#!/usr/local/bin/php
<?php
/**
 * Send email via PHP mail()
 * Called from Node.js with command line arguments
 *
 * Usage:
 *   php send-mail.php --to="user@example.com" --subject="Hello" --html="<p>Content</p>"
 *   php send-mail.php --to="user@example.com" --subject="Hello" --html-file="/path/to/file.html"
 */

$options = getopt("", ["to:", "subject:", "html:", "html-file:", "from:", "fromName:"]);

$to = $options['to'] ?? '';
$subject = $options['subject'] ?? '';
$htmlContent = $options['html'] ?? '';
$htmlFile = $options['html-file'] ?? '';
$from = $options['from'] ?? 'contact@anksboutique.ro';
$fromName = $options['fromName'] ?? "Ank's Boutique";

if (empty($to) || empty($subject)) {
    echo json_encode(['error' => 'Missing required parameters: to, subject']);
    exit(1);
}

// Read HTML from file if provided
if (!empty($htmlFile)) {
    if (!file_exists($htmlFile)) {
        echo json_encode(['error' => 'HTML file not found: ' . $htmlFile]);
        exit(1);
    }
    $htmlContent = file_get_contents($htmlFile);
}

if (empty($htmlContent)) {
    echo json_encode(['error' => 'No HTML content provided']);
    exit(1);
}

// Build email headers
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: ' . $fromName . ' <' . $from . '>',
    'Reply-To: ' . $from,
    'Return-Path: ' . $from,
    'X-Mailer: AnkBoutique/1.0',
];

$success = mail($to, $subject, $htmlContent, implode("\r\n", $headers));

if ($success) {
    echo json_encode(['success' => true, 'to' => $to, 'subject' => $subject]);
    exit(0);
} else {
    echo json_encode(['error' => 'mail() returned false']);
    exit(1);
}
