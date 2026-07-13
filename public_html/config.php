<?php
/**
 * Anks Boutique Commerce - Configuration
 */

// Application settings
define('SITE_NAME', 'Anks Boutique');
define('SITE_TAGLINE', 'Premium Fashion & Accessories');
define('BASE_URL', '/');
define('ADMIN_EMAIL', 'admin@anksboutique.ro');

// Database configuration (SQLite - no setup required)
define('DB_PATH', __DIR__ . '/../data/anksboutique.db');

// Session settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Lax');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../data/error.log');

// Currency
define('CURRENCY', 'RON');
define('CURRENCY_SYMBOL', 'lei');
