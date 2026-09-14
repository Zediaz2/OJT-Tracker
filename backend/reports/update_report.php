<?php
require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);

$report_id     = intval($data['report_id']    ?? 0);
$user_id       = intval($data['user_id']      ?? 0);
$week_start    = trim($data['week_start']     ?? '');
$week_end      = trim($data['week_end']       ?? '');
$title         = trim($data['title']          ?? '');
$description   = $data['description']         ?? '';
$working_hours = floatval($data['working_hours'] ?? 0);
$remove_images = $data['remove_images']       ?? [];

if (!$report_id || !$user_id || !$week_start || !$week_end || !$title || !$description) {
    echo json_encode(['success' => false, 'error' => 'All fields are required.']); exit;
}
if ($week_start > $week_end) {
    echo json_encode(['success' => false, 'error' => 'Week end must be after week start.']); exit;
}

$title = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$sanitized_description = sanitizeHTML($description);
if (empty($sanitized_description)) {
    echo json_encode(['success' => false, 'error' => 'Description cannot be empty.']); exit;
}

// Verify ownership
$check = $pdo->prepare("SELECT id FROM weekly_reports WHERE id = ? AND user_id = ?");
$check->execute([$report_id, $user_id]);
if (!$check->fetch()) {
    echo json_encode(['success' => false, 'error' => 'Report not found or access denied.']); exit;
}

// Update main record
$upd = $pdo->prepare("UPDATE weekly_reports SET week_start = ?, week_end = ?, title = ?, description = ?, working_hours = ? WHERE id = ? AND user_id = ?");
if (!$upd->execute([$week_start, $week_end, $title, $sanitized_description, $working_hours, $report_id, $user_id])) {
    echo json_encode(['success' => false, 'error' => 'Failed to update report.']); exit;
}

// Remove marked images
if (!empty($remove_images) && is_array($remove_images)) {
    $uploadsDir = realpath(__DIR__ . '/../../frontend/uploads');
    foreach ($remove_images as $filePath) {
        $filePath = trim($filePath);
        if (empty($filePath) || strpos($filePath, '..') !== false) continue;

        $del = $pdo->prepare("DELETE FROM report_images WHERE report_id = ? AND file_path = ?");
        $del->execute([$report_id, $filePath]);

        $fullPath = realpath(__DIR__ . '/../../frontend/' . $filePath);
        if ($fullPath && file_exists($fullPath) && $uploadsDir && strpos($fullPath, $uploadsDir) === 0) {
            unlink($fullPath);
        }
    }
}

echo json_encode(['success' => true]);

function sanitizeHTML($html) {
    $html = trim($html);
    if (empty($html)) return '';
    $allowed_tags = '<p><br><strong><em><u><s><ol><ul><li><h1><h2><h3><font><div><span>';
    $sanitized = strip_tags($html, $allowed_tags);
    $sanitized = preg_replace('/<[^>]*on\w+\s*=[^>]*>/i', '', $sanitized);
    $sanitized = preg_replace('/<script[^>]*>.*?<\/script>/i', '', $sanitized);
    return $sanitized;
}
?>