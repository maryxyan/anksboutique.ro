<?php
/**
 * API Server Health Check & Restart
 *
 * This script checks if the Node.js API server is running and attempts to 
 * restart it if it's down. Set this up as a cron job in cPanel to run every
 * few minutes to keep the API server alive.
 *
 * Cron setup (every 5 min): php /home/r142031anks/scripts/api-health-check.php
 *
 * This script is intentionally kept outside the web root and is not exposed over HTTP.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit('This script must be run from the command line.');
}

// Configuration
$apiUrl = 'http://127.0.0.1:8080';
$healthEndpoint = $apiUrl . '/api/healthz';
$pidFile = '/home/r142031anks/api-server.pid';
$logFile = '/home/r142031anks/api-health-check.log';

function logMessage($msg) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $msg\n", FILE_APPEND);
}

// Check if API server is responding
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $healthEndpoint,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_CONNECTTIMEOUT => 3,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($httpCode === 200 && $response !== false) {
    // Server is running fine
    echo "OK: API server is healthy\n";
    exit(0);
}

// Server is down - try to restart
logMessage("API server is DOWN (HTTP $httpCode, error: $error). Attempting restart...");

// Kill existing process if PID file exists
if (file_exists($pidFile)) {
    $oldPid = trim(file_get_contents($pidFile));
    exec("kill $oldPid 2>/dev/null");
    unlink($pidFile);
    logMessage("Killed old process PID $oldPid");
}

// Define Node.js path
$nodeBin = '/home/r142031anks/node-v22.14.0-linux-x64/bin/node';
$appPath = '/home/r142031anks/temp_repo/artifacts/api-server/dist/index.mjs';
$logPath = '/home/r142031anks/api-server.log';

// Try multiple Node.js binary locations
$nodePaths = [
    $nodeBin,
    '/home/r142031anks/node-v22.14-linux-x64/bin/node',
    '/usr/local/bin/node',
    '/usr/bin/node',
    '/home/r142031anks/.nvm/versions/node/v22/bin/node',
];

// Try loading from .bashrc nvm
exec('source ~/.bashrc 2>/dev/null; which node 2>/dev/null', $whichOutput, $whichCode);
if ($whichCode === 0 && !empty($whichOutput[0])) {
    array_unshift($nodePaths, $whichOutput[0]);
}

$started = false;
foreach ($nodePaths as $nodePath) {
    if (!file_exists($nodePath)) continue;
    
    $cmd = sprintf(
        'export PATH="%s:$PATH" && cd %s && DATABASE_URL="postgresql://anksboutique@localhost:5432/anksboutique" PORT=8080 nohup %s %s > %s 2>&1 & echo $!',
        dirname($nodePath),
        dirname(dirname($appPath)),
        $nodePath,
        $appPath,
        $logPath
    );
    
    $output = [];
    exec($cmd, $output, $exitCode);
    
    if (!empty($output) && is_numeric($output[0])) {
        $pid = (int)$output[0];
        file_put_contents($pidFile, (string)$pid);
        logMessage("Started API server with Node: $nodePath, PID: $pid");
        echo "Started API server with PID: $pid using $nodePath\n";
        $started = true;
        break;
    }
}

if (!$started) {
    logMessage("FAILED: Could not start API server - no valid Node.js binary found");
    echo "FAILED: Could not start API server\n";
    exit(1);
}

// Wait a moment and verify
sleep(2);
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $healthEndpoint,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 5,
    CURLOPT_CONNECTTIMEOUT => 3,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    logMessage("API server is now HEALTHY after restart");
    echo "API server is now healthy!\n";
} else {
    logMessage("API server started but not yet healthy (HTTP $httpCode)");
    echo "API server started but not yet healthy\n";
}

