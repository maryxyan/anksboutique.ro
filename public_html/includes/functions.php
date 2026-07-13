<?php
/**
 * Utility functions
 */

function getCsrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function requireCsrfToken(): void {
    $token = $_POST['csrf_token'] ?? '';
    $valid = is_string($_SESSION['csrf_token'] ?? null) && hash_equals($_SESSION['csrf_token'], $token);
    if (!$valid) {
        http_response_code(403);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Forbidden (CSRF)';
        exit;
    }
}

function escape($str) {

    return htmlspecialchars($str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function formatPrice($price) {
    return number_format($price, 2, ',', '.') . ' ' . CURRENCY_SYMBOL;
}

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'n-a' : $text;
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
}

function requireLogin() {
    if (!isLoggedIn()) {
        $_SESSION['redirect_after'] = $_SERVER['REQUEST_URI'];
        redirect('/login.php');
    }
}

function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        redirect('/');
    }
}

function getFlash($key = 'message') {
    $msg = $_SESSION[$key] ?? null;
    unset($_SESSION[$key]);
    return $msg;
}

function setFlash($message, $key = 'message') {
    $_SESSION[$key] = $message;
}

function getProductImage($product, $index = 1) {
    $imageKey = $index === 1 ? 'image_url' : 'image_url_2';
    if (!empty($product[$imageKey])) {
        return escape($product[$imageKey]);
    }
    // Generate placeholder based on product name
    $placeholder = 'https://placehold.co/600x700/e2e8f0/1e293b?text=' . urlencode(substr($product['name'], 0, 2));
    return $placeholder;
}

function generateOrderNumber() {
    return 'ANK-' . strtoupper(substr(uniqid(), -8)) . '-' . date('Ymd');
}

/**
 * Handle image file upload
 * Returns the URL path to the uploaded file, or null on failure.
 */
function handleImageUpload($file) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    // NOTE: This function returns an uploaded file URL or null on failure.


    // Validate file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes)) {
        return null;
    }

    // Validate file size
    if ($file['size'] > $maxSize) {
        return null;
    }

    // Create uploads directory if needed
    // From includes/functions.php, uploads is at project root
    $uploadDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_') . '.' . $ext;
    $destination = $uploadDir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $destination)) {
        return '/uploads/' . $filename;
    }

    return null;
}

/**
 * Render an image tag with a safe fallback UI when the image cannot be loaded.
 *
 * Avoids using inline `innerHTML` / DOM injection in error handlers.
 */
function renderImageWithFallback(string $src, string $alt, string $fallbackText, array $imgStyle = []): void {
    $srcEsc = escape($src);
    $altEsc = escape($alt);
    $fallbackEsc = escape($fallbackText);

    $defaultStyle = 'width:100%;height:100%;object-fit:cover';
    $style = $defaultStyle;
    if (!empty($imgStyle)) {
        // Accept styles already validated/escaped by caller; this is admin-only output.
        $style = rtrim($defaultStyle, ';') . ';' . implode(';', $imgStyle);
    }

    echo '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--color-bg-alt);color:var(--color-text-muted);font-size:0.8rem" class="img-fallback" aria-hidden="true">' . $fallbackEsc . '</div>';
    // Hide fallback on successful load, show it when the image fails.
    echo '<img src="' . $srcEsc . '" alt="' . $altEsc . '" style="' . escape($style) . '" loading="lazy" onload="(function(img){var wrap=img.parentElement; if(!wrap) return; var f=wrap.querySelector(\".img-fallback\"); if(f) f.style.display=\"none\";})(this)" onerror="(function(img){var wrap=img.parentElement; if(!wrap) return; var f=wrap.querySelector(\".img-fallback\"); if(f) f.style.display=\"flex\";})(this)" />';

}

