<?php
require_once '../config/db.php';
// NOTE: db.php already sets Content-Type, CORS headers, and handles OPTIONS

$data      = json_decode(file_get_contents('php://input'), true);
$report_id = intval($data['report_id'] ?? 0);
$user_id   = intval($data['user_id']   ?? 0);

if (!$report_id || !$user_id) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields.']);
    exit;
}

// ── Verify ownership ──────────────────────────────────────
// Table name: weekly_reports (matches create_report.php and get_reports.php)
$check = $conn->prepare("SELECT id FROM weekly_reports WHERE id = ? AND user_id = ?");
$check->execute([$report_id, $user_id]);
if (!$check->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Report not found or access denied.']);
    exit;
}

// ── Fetch image paths then delete physical files ──────────
// Column name: file_path (matches upload_image.php and get_reports.php)
$imgs = $conn->prepare("SELECT file_path FROM report_images WHERE report_id = ?");
$imgs->execute([$report_id]);
$result = $imgs->fetchAll();

$uploadsDir = realpath(__DIR__ . '/../../frontend/uploads');

foreach ($result as $row) {
    $filePath = trim($row['file_path']);
    if (empty($filePath) || strpos($filePath, '..') !== false) continue;

    $fullPath = realpath(__DIR__ . '/../../frontend/' . $filePath);
    if ($fullPath && file_exists($fullPath) && $uploadsDir && strpos($fullPath, $uploadsDir) === 0) {
        unlink($fullPath);
    }
}

// ── Delete image records ──────────────────────────────────
$delImgs = $conn->prepare("DELETE FROM report_images WHERE report_id = ?");
$delImgs->execute([$report_id]);

// ── Delete the report ─────────────────────────────────────
$delReport = $conn->prepare("DELETE FROM weekly_reports WHERE id = ? AND user_id = ?");
try {
    $delReport->execute([$report_id, $user_id]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to delete report: ' . $e->getMessage()]);
    exit;
}

echo json_encode(['success' => true]);
?>