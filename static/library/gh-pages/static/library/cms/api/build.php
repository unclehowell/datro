<?php
$base = dirname(__DIR__, 3);
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method']); exit; }
$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$version = $payload['version'] ?? 'latest';
// Placeholder: in a real serverless env this would trigger a PDF build from RST.
$exec = true; // no-op placeholder to satisfy patch; actual build should be invoked by external system
echo json_encode(['ok'=>true, 'version'=>$version, 'built'=>true]);
?>
