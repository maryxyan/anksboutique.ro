<?php
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
