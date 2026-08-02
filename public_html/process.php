<?php

$pid = trim(file_get_contents("../api-server.pid"));

echo "<pre>";

echo "PID: $pid\n\n";

echo shell_exec("ps -fp $pid 2>&1");

echo "</pre>";
