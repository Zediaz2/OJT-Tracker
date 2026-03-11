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
$check->bind_param("ii", $report_id, $user_id);
$check->execute();
$check->store_result();
if ($check->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Report not found or access denied.']);
    exit;
}
$check->close();

// ── Fetch image paths then delete physical files ──────────
// Column name: file_path (matches upload_image.php and get_reports.php)
$imgs = $conn->prepare("SELECT file_path FROM report_images WHERE report_id = ?");
$imgs->bind_param("i", $report_id);
$imgs->execute();
$result = $imgs->get_result();

$uploadsDir = realpath(__DIR__ . '/../../frontend/uploads');

while ($row = $result->fetch_assoc()) {
    $filePath = trim($row['file_path']);
    if (empty($filePath) || strpos($filePath, '..') !== false) continue;

    $fullPath = realpath(__DIR__ . '/../../frontend/' . $filePath);
    if ($fullPath && file_exists($fullPath) && $uploadsDir && strpos($fullPath, $uploadsDir) === 0) {
        unlink($fullPath);
    }
}
$imgs->close();

// ── Delete image records ──────────────────────────────────
$delImgs = $conn->prepare("DELETE FROM report_images WHERE report_id = ?");
$delImgs->bind_param("i", $report_id);
$delImgs->execute();
$delImgs->close();

// ── Delete the report ─────────────────────────────────────
$delReport = $conn->prepare("DELETE FROM weekly_reports WHERE id = ? AND user_id = ?");
$delReport->bind_param("ii", $report_id, $user_id);
if (!$delReport->execute()) {
    echo json_encode(['success' => false, 'error' => 'Failed to delete report: ' . $conn->error]);
    exit;
}
$delReport->close();

echo json_encode(['success' => true]);
?>