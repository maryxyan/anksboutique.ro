<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/functions.php';

// Initialize database on first run
initializeDatabase();

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$cartCount = getCartCount();
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Anks Boutique - Magazin online de fashion premium. Descoperă colecția noastră exclusivă de haine și accesorii de lux.">
    <title><?= isset($pageTitle) ? escape($pageTitle) . ' | ' : '' ?><?= SITE_NAME ?></title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><text y='14' font-size='14'>👗</text></svg>">
</head>
<body>
    <!-- Announcement Bar -->
    <div class="announcement-bar">
        Transport gratuit la comenzi peste 500 lei &nbsp;|&nbsp; 
        <a href="/products.php">Vezi colecția nouă →</a>
    </div>

    <!-- Header -->
    <header class="header">
        <div class="header-inner">
            <a href="/" class="logo">Anks<span>Boutique</span></a>
            
            <nav>
                <ul class="nav-menu">
                    <li><a href="/" class="<?= $currentPage === 'index.php' || $currentPage === '' ? 'active' : '' ?>">Acasă</a></li>
                    <li><a href="/products.php?category=women" class="<?= strpos($_SERVER['REQUEST_URI'] ?? '', 'category=women') !== false ? 'active' : '' ?>">Femei</a></li>
                    <li><a href="/products.php?category=men" class="<?= strpos($_SERVER['REQUEST_URI'] ?? '', 'category=men') !== false ? 'active' : '' ?>">Bărbați</a></li>
                    <li><a href="/products.php?category=accessories" class="<?= strpos($_SERVER['REQUEST_URI'] ?? '', 'category=accessories') !== false ? 'active' : '' ?>">Accesorii</a></li>
                    <li><a href="/products.php?category=new-arrivals" class="<?= strpos($_SERVER['REQUEST_URI'] ?? '', 'category=new-arrivals') !== false ? 'active' : '' ?>">Noutăți</a></li>
                    <li><a href="/products.php?category=sale" class="<?= strpos($_SERVER['REQUEST_URI'] ?? '', 'category=sale') !== false ? 'active' : '' ?>">Reduceri</a></li>
                </ul>
            </nav>
            
            <div class="header-actions">
                <a href="/search.php" title="Caută">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                </a>
                <a href="<?= isLoggedIn() ? '/account.php' : '/login.php' ?>" title="Contul meu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                </a>
                <a href="/cart.php" class="cart-icon" title="Coșul meu">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <?php if ($cartCount > 0): ?>
                    <span class="cart-count"><?= $cartCount ?></span>
                    <?php endif; ?>
                </a>
            </div>
            
            <button class="mobile-menu-btn" aria-label="Meniu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </header>
    
    <main>
