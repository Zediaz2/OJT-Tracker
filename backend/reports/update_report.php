<?php
require_once '../config/db.php';
// NOTE: db.php already sets Content-Type, CORS headers, and handles OPTIONS

$data = json_decode(file_get_contents('php://input'), true);

$report_id     = intval($data['report_id']    ?? 0);
$user_id       = intval($data['user_id']      ?? 0);
$week_start    = trim($data['week_start']     ?? '');
$week_end      = trim($data['week_end']       ?? '');
$title         = trim($data['title']          ?? '');
$description   = trim($data['description']    ?? '');
$working_hours = floatval($data['working_hours'] ?? 0);
$remove_images = $data['remove_images']       ?? [];  // array of file_path values e.g. "uploads/img_xxx.jpg"

// ── Validation ────────────────────────────────────────────
if (!$report_id || !$user_id || !$week_start || !$week_end || !$title || !$description) {
    echo json_encode(['success' => false, 'error' => 'All fields are required.']);
    exit;
}
if ($week_start > $week_end) {
    echo json_encode(['success' => false, 'error' => 'Week end must be after week start.']);
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

// ── Update main record ────────────────────────────────────
$upd = $conn->prepare(
    "UPDATE weekly_reports SET week_start = ?, week_end = ?, title = ?, description = ?, working_hours = ? WHERE id = ? AND user_id = ?"
);
try {
    $upd->execute([$week_start, $week_end, $title, $description, $working_hours, $report_id, $user_id]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to update report: ' . $e->getMessage()]);
    exit;
}

// ── Remove marked images ──────────────────────────────────
// Column name: file_path (matches upload_image.php and get_reports.php)
if (!empty($remove_images) && is_array($remove_images)) {
    $uploadsDir = realpath(__DIR__ . '/../../frontend/uploads');

    foreach ($remove_images as $filePath) {
        $filePath = trim($filePath);
        if (empty($filePath) || strpos($filePath, '..') !== false) continue;

        // Delete DB record
        $del = $conn->prepare("DELETE FROM report_images WHERE report_id = ? AND file_path = ?");
        $del->execute([$report_id, $filePath]);

        // Delete physical file (sandboxed to uploads dir only)
        $fullPath = realpath(__DIR__ . '/../../frontend/' . $filePath);
        if ($fullPath && file_exists($fullPath) && $uploadsDir && strpos($fullPath, $uploadsDir) === 0) {
            unlink($fullPath);
        }
    }
}

echo json_encode(['success' => true]);
?>