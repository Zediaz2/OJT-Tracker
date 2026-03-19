<?php
require_once '../config/db.php';

$data        = json_decode(file_get_contents('php://input'), true);
$user_id     = intval($data['user_id'] ?? 0);
$week_start  = $data['week_start'] ?? '';
$week_end    = $data['week_end'] ?? '';
$title       = trim($data['title'] ?? '');
$description = trim($data['description'] ?? '');
$working_hours = floatval($data['working_hours'] ?? 0);

if (!$user_id || !$week_start || !$week_end || !$title || !$description) {
    echo json_encode(['error' => 'All fields are required']); exit;
}

$stmt = $conn->prepare("INSERT INTO weekly_reports (user_id, week_start, week_end, title, description, working_hours) VALUES (?, ?, ?, ?, ?, ?)");

if ($stmt->execute([$user_id, $week_start, $week_end, $title, $description, $working_hours])) {
    echo json_encode(['success' => true, 'report_id' => $conn->lastInsertId()]);
} else {
    echo json_encode(['error' => 'Failed to save report']);
}
?>