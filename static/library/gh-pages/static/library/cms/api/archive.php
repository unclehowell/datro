<?php
$base = dirname(__DIR__, 2);
$inventoryPath = $base . '/data/inventory.json';
$outtrayPath = $base . '/data/outtray.json';
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method']); exit; }
$payload = json_decode(file_get_contents('php://input'), true) ?? [];
if (!isset($payload['id'])) { http_response_code(400); echo json_encode(['error'=>'missing id']); exit; }
$inventory = @json_decode(@file_get_contents($inventoryPath), true) ?: [];
$idx = array_search($payload['id'], array_column($inventory, 'id'));
if ($idx < 0) { http_response_code(404); echo json_encode(['error'=>'item not found']); exit; }
$item = $inventory[$idx];
$item['status'] = 'archived';
$item['archived_path'] = $item['path'] . '.pdf';
$inventory[$idx] = $item;
file_put_contents($inventoryPath, json_encode($inventory, null, 2));
$outtray = @json_decode(@file_get_contents($outtrayPath), true) ?: [];
$outtray[] = ['id'=>$item['id'], 'path'=>$item['archived_path'], 'target_version'=>$item['version'], 'timestamp'=>date('c')];
file_put_contents($outtrayPath, json_encode($outtray, null, 2));
echo json_encode(['ok'=>true, 'item'=>$item, 'outtray'=>$outtray]);
?>
