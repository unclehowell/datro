<?php
$base = dirname(__DIR__, 2);
$path = $base . '/data/exceptions.json';
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
  $data = @json_decode(@file_get_contents($path), true) ?: [];
  echo json_encode($data);
  exit;
}
if ($method === 'POST') {
  $payload = json_decode(file_get_contents('php://input'), true) ?? [];
  $list = @json_decode(@file_get_contents($path), true) ?: [];
  $payload['id'] = $payload['id'] ?? ('ex-' . time());
  $list[] = $payload;
  file_put_contents($path, json_encode($list, null, 2));
  echo json_encode(['ok'=>true, 'exception'=>$payload]);
  exit;
}
http_response_code(405);
?>
