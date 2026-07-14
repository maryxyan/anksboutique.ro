<?php
/**
 * Media/image upload helpers.
 *
 * Extracted from includes/functions.php to separate responsibilities.
 */

function handleImageUpload($file) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = 5 * 1024 * 1024; // 5MB

    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    // Validate file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowedTypes, true)) {
        return null;
    }

    // Validate file size
    if ($file['size'] > $maxSize) {
        return null;
    }

    $uploadDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

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

    echo '<img src="' . $srcEsc . '" alt="' . $altEsc . '" style="' . escape($style) . '" loading="lazy" onload="(function(img){var wrap=img.parentElement; if(!wrap) return; var f=wrap.querySelector(\".img-fallback\"); if(f) f.style.display=\"none\";})(this)" onerror="(function(img){var wrap=img.parentElement; if(!wrap) return; var f=wrap.querySelector(\".img-fallback\"); if(f) f.style.display=\"flex\";})(this)" />';
}

