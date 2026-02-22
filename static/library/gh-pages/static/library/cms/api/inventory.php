<?php
// Simple JSON-based inventory API for the CMS
$base = dirname(__DIR__, 2); // repo root gh-pages/static/library (correct base for data/)
$inventoryPath = $base . '/data/inventory.json';
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
  $data = @json_decode(@file_get_contents($inventoryPath), true) ?: [];
  echo json_encode($data);
  exit;
}
if ($method === 'POST') {
  $payload = json_decode(file_get_contents('php://input'), true) ?? [];
  // LEAVE_ALONE check for target dir
  if (!isset($payload['id']) && empty($payload['action'])) { http_response_code(400); echo json_encode(['error'=>'missing id']); exit; }
  // support explicit action field for CMS operations
  $action = $payload['action'] ?? 'new';
  // Compute target doc path for LEAVE_ALONE check if provided
  if (!empty($payload['path'])) {
    $baseDir = dirname(__DIR__, 2);
    $targetDir = $baseDir . '/gh-pages/static/docs/' . $payload['path'];
    // If LEAVE_ALONE exists, block edits
    if (is_dir($targetDir) && file_exists($targetDir . '/LEAVE_ALONE.md')) {
      http_response_code(403); echo json_encode(['error'=>'blocked by LEAVE_ALONE.md']); exit;
    }
  }
  $list = @json_decode(@file_get_contents($inventoryPath), true) ?: [];
  if ($action === 'delete') {
    if (!isset($payload['id'])) { http_response_code(400); echo json_encode(['error'=>'missing id']); exit; }
    $idx = array_search($payload['id'], array_column($list, 'id'));
    if ($idx >= 0) {
      array_splice($list, $idx, 1);
    }
    file_put_contents($inventoryPath, json_encode($list, null, 2));
    echo json_encode(['ok'=>true, 'inventory'=>$list]); exit;
  }
  if ($action === 'new' || $action === 'update') {
    if (!isset($payload['id'])) { http_response_code(400); echo json_encode(['error'=>'missing id']); exit; }
    $idx = array_search($payload['id'], array_column($list, 'id'));
    if ($idx !== false) $list[$idx] = array_merge($list[$idx], $payload); else $list[] = $payload;
    file_put_contents($inventoryPath, json_encode($list, null, 2));
    echo json_encode(['ok'=>true, 'item'=>$payload]); exit;
  }
  // default: treat as new
  if (!isset($payload['id'])) { http_response_code(400); echo json_encode(['error'=>'missing id']); exit; }
  $idx = array_search($payload['id'], array_column($list, 'id'));
  if ($idx !== false) $list[$idx] = array_merge($list[$idx], $payload); else $list[] = $payload;
  file_put_contents($inventoryPath, json_encode($list, null, 2));
  echo json_encode(['ok'=>true, 'item'=>$payload]); exit;
}
http_response_code(405);
?>
