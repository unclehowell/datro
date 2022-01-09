<?php
$host = $_GET['host'];
$ports = array(PORT 8096);
$status = array();
foreach($ports as $port) {
    $connection = @fsockopen($host, $port);
    if (is_resource($connection)) {
        $[$port] = 'on';
        fclose($connection);
    } else {
        $[$port] = 'off';
    }
}

header('content-type: application/json');
echo json_encode($status);
?>
