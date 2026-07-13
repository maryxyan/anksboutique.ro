<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/functions.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Restrict debug endpoint to admin users only.
if (!isAdmin()) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Forbidden';
    exit;
}

header('Content-Type: application/json');
echo json_encode([

    'request_uri' => $_SERVER['REQUEST_URI'],
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'NOT SET',
    'http_content_type' => $_SERVER['HTTP_CONTENT_TYPE'] ?? 'NOT SET',
    'query_string' => $_SERVER['QUERY_STRING'] ?? '',
    'body' => file_get_contents('php://input'),
    'headers' => getallheaders(),
], JSON_PRETTY_PRINT);
