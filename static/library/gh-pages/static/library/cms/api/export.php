<?php
$base = dirname(__DIR__, 3);
$versionsRoot = $base . '/gh-pages/static/docs/versions';
$exportsRoot = $base . '/data/exports';
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method']); exit; }
$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$version = $payload['version'] ?? '';
$format = $payload['format'] ?? 'zip';
if (!$version) { http_response_code(400); echo json_encode(['error'=>'missing version']); exit; }
$srcDir = $versionsRoot . '/' . $version;
if (!is_dir($srcDir)) { http_response_code(404); echo json_encode(['error'=>'version not found']); exit; }
if (!is_dir($exportsRoot)) mkdir($exportsRoot, 0777, true);
$zipPath = $exportsRoot . '/' . $version . '.zip';
// create zip
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
  http_response_code(500); echo json_encode(['error'=>'could not create zip']); exit;
}
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($srcDir)) as $file) {
  if (!$file->isDir()) {
    $local = str_replace('\\','/', $file->getPathname());
    $rel = ltrim(str_replace($srcDir, '', $local), '/');
    $zip->addFile($local, $rel);
  }
}
$zip->close();
echo json_encode(['ok'=>true, 'file'=>$zipPath]);
?>
