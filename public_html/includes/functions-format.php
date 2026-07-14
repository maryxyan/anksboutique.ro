<?php
/**
 * Formatting/util helpers extracted from includes/functions.php
 */

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

