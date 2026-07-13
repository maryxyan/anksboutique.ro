<?php
// Simulate exactly what api-proxy.php does
$apiUrl = 'http://127.0.0.1:3000';
$requestUri = '/api/cart/items'; // simulate the rewrite
$target = $apiUrl . $requestUri;

// Get the request body from a temp file for testing
$body = '{"sessionId":"test-from-proxy-123","productId":1,"quantity":1}';

// Prepare headers exactly as the proxy does
$headers = [];
if (!empty($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
} else {
    // fallback - set it manually for test
    $headers[] = 'Content-Type: application/json';
}
$headers[] = 'Content-Length: ' . strlen($body);
$headers[] = 'Accept: application/json';
$headers[] = 'X-Forwarded-For: 127.0.0.1';
$headers[] = 'X-Forwarded-Host: anksboutique.ro';
$headers[] = 'X-Forwarded-Proto: https';

echo "Target: $target\n";
echo "Headers:\n";
print_r($headers);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $target,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP: $httpCode\n";
if ($error) echo "Error: $error\n";
echo "Response:\n$response\n";
