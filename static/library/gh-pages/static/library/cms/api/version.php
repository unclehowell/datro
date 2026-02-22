<?php
$base = dirname(__DIR__, 2);
$latest = $base . '/gh-pages/static/docs/latest';
$versionsRoot = $base . '/gh-pages/static/docs/versions';
$registryPath = $base . '/gh-pages/static/docs/_registry.json';
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'POST') { http_response_code(405); echo json_encode(['error'=>'method']); exit; }
$payload = json_decode(file_get_contents('php://input'), true) ?? [];
if (($payload['action'] ?? '') !== 'new' || empty($payload['version'])) { http_response_code(400); echo json_encode(['error'=>'missing version']); exit; }
$version = $payload['version'];
$src = $latest;
$dest = $versionsRoot . '/' . $version;
if (file_exists($dest)) { http_response_code(400); echo json_encode(['error'=>'exists']); exit; }
// copy directory recursively
 $copyDir = function($srcDir, $dstDir) use (&$copyDir) {
  if (!is_dir($srcDir)) return;
  if (!is_dir($dstDir)) mkdir($dstDir, 0777, true);
  foreach (scandir($srcDir) as $item) {
    if ($item === '.' || $item === '..') continue;
    $s = $srcDir . '/' . $item;
    $d = $dstDir . '/' . $item;
    if (is_dir($s)) { $copyDir($s, $d); } else { copy($s, $d); }
  }
};
$copyDir($src, $dest);
// prune artifacts in new version if present
$buildPath = $dest . '/build'; if (is_dir($buildPath)) { $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($buildPath, FilesystemIterator::SKIP_DOTS)); foreach ($files as $f) { if ($f->isDir()) { rmdir($f->getPathname()); } else { unlink($f->getPathname()); } } rmdir($buildPath); }
// update registry
$reg = @json_decode(@file_get_contents($registryPath), true) ?: ['languages'=>[], 'items'=>[]];
$reg['items'][] = ['version'=>$version, 'path'=>'versions/'.$version];
file_put_contents($registryPath, json_encode($reg, null, 2));
echo json_encode(['ok'=>true, 'version'=>$version]);
?>
