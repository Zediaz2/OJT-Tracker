<?php
require_once '../config/db.php';

$data      = json_decode(file_get_contents('php://input'), true);
$report_id = intval($data['report_id'] ?? 0);
$user_id   = intval($data['user_id']   ?? 0);

if (!$report_id || !$user_id) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields.']); exit;
}

// Verify ownership
$check = $pdo->prepare("SELECT id FROM weekly_reports WHERE id = ? AND user_id = ?");
$check->execute([$report_id, $user_id]);
if (!$check->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Report not found or access denied.']); exit;
}

// Fetch and delete physical image files
$imgs = $pdo->prepare("SELECT file_path FROM report_images WHERE report_id = ?");
$imgs->execute([$report_id]);
$uploadsDir = realpath(__DIR__ . '/../../frontend/uploads');

while ($row = $imgs->fetch()) {
    $filePath = trim($row['file_path']);
    if (empty($filePath) || strpos($filePath, '..') !== false) continue;
    $fullPath = realpath(__DIR__ . '/../../frontend/' . $filePath);
    if ($fullPath && file_exists($fullPath) && $uploadsDir && strpos($fullPath, $uploadsDir) === 0) {
        unlink($fullPath);
    }
}

// Delete image records
$pdo->prepare("DELETE FROM report_images WHERE report_id = ?")->execute([$report_id]);

// Delete the report
$del = $pdo->prepare("DELETE FROM weekly_reports WHERE id = ? AND user_id = ?");
if ($del->execute([$report_id, $user_id])) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to delete report.']);
}
?>