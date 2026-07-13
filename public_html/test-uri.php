<?php
file_put_contents('/tmp/test_uri.log', print_r([
    'REQUEST_URI' => $_SERVER['REQUEST_URI'],
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'],
    'PHP_SELF' => $_SERVER['PHP_SELF'],
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? '',
    'REDIRECT_URL' => $_SERVER['REDIRECT_URL'] ?? 'N/A',
    'REDIRECT_STATUS' => $_SERVER['REDIRECT_STATUS'] ?? 'N/A',
    'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? 'N/A',
    'CONTENT_LENGTH' => $_SERVER['CONTENT_LENGTH'] ?? 'N/A',
    'METHOD' => $_SERVER['REQUEST_METHOD'],
    'HTTP_CONTENT_TYPE' => $_SERVER['HTTP_CONTENT_TYPE'] ?? 'N/A',
], true) . "\n", FILE_APPEND);
echo "Logged\n";
