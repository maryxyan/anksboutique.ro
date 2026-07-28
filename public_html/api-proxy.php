<?php
/**
 * API Proxy - forward requests to Node.js backend
 */

// Allow the API URL to be overridden by an environment variable (set in Apache config)
// Default to 127.0.0.1:8080 which matches the Node.js server's default port
$apiUrl = getenv('API_PROXY_URL') ?: 'http://127.0.0.1:300';
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$path = parse_url($requestUri, PHP_URL_PATH);
$query = parse_url($requestUri, PHP_URL_QUERY);

// If path doesn't start with /api, try REDIRECT_URL (some Apache configs)
if (strpos($path, '/api') !== 0 && !empty($_SERVER['REDIRECT_URL'])) {
    $path = $_SERVER['REDIRECT_URL'];
}

// Strict defense-in-depth: only allow proxying /api/*
// (Avoid open proxy / SSRF via path manipulation)
$path = '/' . ltrim((string)$path, '/');
if (!( $path === '/api' || strpos($path, '/api/') === 0 )) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not Found';
    exit;
}


// Build target URL
$target = $apiUrl . $path;
if ($query) {
    $target .= '?' . $query;
}

// Detect multipart uploads
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
$isMultipart = stripos($contentType, 'multipart/form-data') !== false;

// Prepare headers to forward (skip Content-Type/Content-Length for multipart - let cURL handle it)
$headers = array();

if (!$isMultipart) {
    // Get the request body for non-multipart requests
    $body = file_get_contents('php://input');

    // Add Content-Type
    if (!empty($_SERVER['CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
    } elseif (!empty($_SERVER['HTTP_CONTENT_TYPE'])) {
        $headers[] = 'Content-Type: ' . $_SERVER['HTTP_CONTENT_TYPE'];
    } elseif (!empty($body) && $body[0] === '{') {
        $headers[] = 'Content-Type: application/json';
    }

    // Add Content-Length
    if (!empty($_SERVER['CONTENT_LENGTH'])) {
        $headers[] = 'Content-Length: ' . $_SERVER['CONTENT_LENGTH'];
    } elseif (!empty($body)) {
        $headers[] = 'Content-Length: ' . strlen($body);
    }
} else {
    $body = null;
}

// Forward HTTP_* headers from $_SERVER
$skipHeaders = array('host', 'connection', 'keep-alive', 'transfer-encoding', 'content-type', 'content-length');
foreach ($_SERVER as $name => $value) {
    if (strpos($name, 'HTTP_') === 0) {
        $headerName = str_replace('_', '-', substr($name, 5));
        $headerName = ucwords(strtolower($headerName), '-');
        if (!in_array(strtolower($headerName), $skipHeaders)) {
            $headers[] = "$headerName: $value";
        }
    }
}

// Add X-Forwarded headers
$headers[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
$headers[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
$headers[] = 'X-Forwarded-Proto: ' . $proto;

// Initialize cURL
$ch = curl_init();
curl_setopt_array($ch, array(
    CURLOPT_URL => $target,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER => $headers,
));

// Set body/method
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($isMultipart) {
    // For multipart uploads: use $_POST + $_FILES with CURLFile
    $postFields = $_POST;
    foreach ($_FILES as $key => $file) {
        if (is_array($file['tmp_name'])) {
            // Handle multiple files with the same field name (e.g. file[])
            foreach ($file['tmp_name'] as $i => $tmpName) {
                if (!empty($tmpName)) {
                    $postFields[$key][] = new CURLFile($tmpName, $file['type'][$i], $file['name'][$i]);
                }
            }
        } elseif (!empty($file['tmp_name'])) {
            $postFields[$key] = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
        }
    }
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
} elseif (in_array($method, array('POST', 'PUT', 'PATCH')) && !empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
} elseif ($method !== 'GET') {
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

// Execute
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    header('Content-Type: application/json');

    // Gather diagnostic info to help debug connection issues
    $diag = array(
        'error' => 'Proxy error: ' . $error,
        'target' => $target,
        'method' => $method,
        'connect_timeout' => 10,
    );

    // Check if we can resolve the hostname
    $host = parse_url($target, PHP_URL_HOST) ?: '127.0.0.1';
    $resolved = gethostbynamel($host);
    if ($resolved === false) {
        $diag['dns'] = 'DNS resolution failed for ' . $host;
    } else {
        $diag['dns'] = $resolved;
    }

    // Quick socket check on the target
    $port = parse_url($target, PHP_URL_PORT) ?: 80;
    $fp = @fsockopen($host, $port, $errno, $errstr, 2);
    if ($fp) {
        $diag['socket_check'] = 'open';
        fclose($fp);
    } else {
        $diag['socket_check'] = 'closed (' . $errstr . ')';
    }

    echo json_encode($diag);
    exit;
}

// Forward response headers
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

foreach (explode("\r\n", $responseHeaders) as $header) {
    if (!empty($header) && stripos($header, 'transfer-encoding:') === false) {
        header($header, false);
    }
}

http_response_code($httpCode);
echo $responseBody;
