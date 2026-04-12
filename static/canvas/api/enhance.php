<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get input data
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data)) {
    echo json_encode(['error' => 'No data provided']);
    exit;
}

// Path to the enhancement script
$script = '/home/ubuntu/datro/static/canvas/scripts/ad_enhance.py';

// Write data to temp file
$input_file = tempnam(sys_get_temp_dir(), 'ad_enhance_');
file_put_contents($input_file, json_encode($data));

// Execute the script with the temp file
$cmd = escapeshellcmd($script) . ' < ' . escapeshellarg($input_file);
$output = shell_exec($cmd);

// Clean up
unlink($input_file);

if ($output === null) {
    echo json_encode([
        'error' => '❌ Script execution failed',
        'adjustments' => [],
        'overall_score' => 5.0,
        'issues_found' => ['Script execution failed']
    ]);
} else {
    // Return the script output as JSON
    echo $output;
}
?>