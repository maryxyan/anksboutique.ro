<?php
/**
 * Shared admin helpers (POST/CSRF/flash/redirect) to reduce duplication.
 *
 * Includes no business logic; it only wraps common security + UX patterns.
 */

function admin_require_post_action(string $expectedAction): bool {
    return ($_SERVER['REQUEST_METHOD'] === 'POST'
        && isset($_POST['action'])
        && hash_equals($expectedAction, (string)$_POST['action']));
}

function admin_csrf_or_forbidden(): void {
    // functions.php must be loaded by callers.
    requireCsrfToken();
}

function admin_set_flash_and_redirect(string $url, string $message, string $key = 'success'): void {
    setFlash($message, $key);
    redirect($url);
}

/**
 * Safely reads POST values.
 */
function admin_post_int(string $key, int $default = 0): int {
    return (int)($_POST[$key] ?? $default);
}

function admin_post_string(string $key, string $default = ''): string {
    $v = $_POST[$key] ?? $default;
    return is_string($v) ? $v : $default;
}

