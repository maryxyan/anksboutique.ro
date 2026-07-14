<?php
/**
 * functions.php
 *
 * Compatibility aggregator.
 *
 * Historical codebase used a single includes/functions.php file.
 * We keep the public function names by loading separated modules.
 */

require_once __DIR__ . '/functions-format.php';
require_once __DIR__ . '/functions-security.php';
require_once __DIR__ . '/functions-media.php';

// Backward-compat alias
// Historical codebase had formatPrice/redirect/escape etc in this file.
// These are now provided via the included modules.



