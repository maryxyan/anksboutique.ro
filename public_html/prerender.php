<?php
/**
 * SPA Prerenderer — injectează JSON-LD structured data pentru crawlers
 * Servește HTML-ul aplicației React cu date injectate la nivel de server
 */

// Detectează calea
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
$path = rtrim($path, '/');

// Doar pentru crawlers pe rute importante — altfel servește index.html normal
$isBot = false;
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$botPatterns = ['Googlebot', 'bingbot', 'FacebookExternalHit', 'Twitterbot', 'Baiduspider', 'YandexBot', 'Slurp', 'DuckDuckBot'];
foreach ($botPatterns as $pattern) {
    if (stripos($userAgent, $pattern) !== false) {
        $isBot = true;
        break;
    }
}

// Dacă nu e bot sau e o rută care nu necesită prerender, servește static
if (!$isBot) {
    readfile(__DIR__ . '/index.html');
    exit;
}

// URL-ul API intern
$apiBase = 'http://127.0.0.1:3000';

$extraJsonLd = '';
$metaTitle = "Ank's Boutique";
$metaDesc = "Ank's Boutique — magazin online de haine și accesorii.";

// === Ruta: /product/{id} ===
if (preg_match('#^/product/(\d+)$#', $path, $matches)) {
    $productId = (int)$matches[1];
    $apiUrl = "$apiBase/api/products/$productId";

    // Use cURL (allow_url_fopen is off on this server)
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_CONNECTTIMEOUT => 2,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        $product = json_decode($response, true);
        if ($product && isset($product['id'])) {
            $metaTitle = htmlspecialchars($product['title']) . " | Anks Boutique";
            $desc = $product['description'] ?? "Produs premium la Anks Boutique. Preț: " . number_format((float)$product['price'], 2) . " RON.";
            $metaDesc = htmlspecialchars(substr($desc, 0, 160));
            $price = number_format((float)$product['price'], 2);
            $inStock = !empty($product['inStock']);
            $imgUrl = htmlspecialchars($product['images'][0] ?? '');
            $categoryName = htmlspecialchars($product['categoryName'] ?? 'Colecție');
            $catSlug = $product['categoryName'] ? '?category=' . urlencode(strtolower($product['categoryName'])) : '';

            // Breadcrumb JSON-LD
            $extraJsonLd .= '
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Acas\u0103", "item": "https://anksboutique.ro/" },
        { "@type": "ListItem", "position": 2, "name": "' . $categoryName . '", "item": "https://anksboutique.ro/shop' . $catSlug . '" },
        { "@type": "ListItem", "position": 3, "name": "' . htmlspecialchars($product['title']) . '", "item": "https://anksboutique.ro/product/' . $productId . '" }
      ]
    }
    </script>';

            // Product JSON-LD
            $prodDesc = htmlspecialchars(substr($product['description'] ?? '', 0, 200));
            $sku = htmlspecialchars($product['sku'] ?? '');
            $availability = $inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
            $aggRating = '';

            if (!empty($product['reviewCount']) && !empty($product['rating'])) {
                $aggRating = ',
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": ' . (float)$product['rating'] . ',
        "reviewCount": ' . (int)$product['reviewCount'] . ',
        "bestRating": "5"
      }';
            }

            $extraJsonLd .= '
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "' . htmlspecialchars($product['title']) . '",
      "description": "' . $prodDesc . '",
      "image": "' . $imgUrl . '",
      "sku": "' . $sku . '",
      "brand": { "@type": "Brand", "name": "Anks Boutique" },
      "offers": {
        "@type": "Offer",
        "url": "https://anksboutique.ro/product/' . $productId . '",
        "priceCurrency": "RON",
        "price": ' . $price . ',
        "availability": "' . $availability . '",
        "itemCondition": "https://schema.org/NewCondition"
      }' . $aggRating . '
    }
    </script>';
        }
    }
}

// === Ruta: /shop ===
if ($path === '/shop') {
    $metaTitle = "Colec\u0163ie | Anks Boutique";
    $metaDesc = "Descoper\u0103 colec\u0163ia noastr\u0103 premium de haine \u015fi accesorii.";
}

// === Ruta: / ===
if ($path === '' || $path === '/') {
    $metaTitle = "Ank\u2019s Boutique \u2014 Mod\u0103 Premium";
    $metaDesc = "Ank\u2019s Boutique \u2014 magazin online de haine \u015fi accesorii premium.";
}

// === Citește index.html și injectează datele ===
$html = file_get_contents(__DIR__ . '/index.html');

// Injectează meta tags
$html = preg_replace(
    '/<title>.*?<\/title>/',
    '<title>' . $metaTitle . '</title>',
    $html
);
$html = preg_replace(
    '/<meta name="description" content=".*?"/',
    '<meta name="description" content="' . $metaDesc . '"',
    $html
);

// Injectează OG tags
$html = preg_replace(
    '/<meta property="og:title" content=".*?"/',
    '<meta property="og:title" content="' . $metaTitle . '"',
    $html
);
$html = preg_replace(
    '/<meta property="og:description" content=".*?"/',
    '<meta property="og:description" content="' . $metaDesc . '"',
    $html
);

// Adaugă JSON-LD suplimentar înainte de </head>
if (!empty($extraJsonLd)) {
    $html = str_replace('</head>', $extraJsonLd . "\n  </head>", $html);
}

header('Content-Type: text/html; charset=utf-8');
echo $html;
