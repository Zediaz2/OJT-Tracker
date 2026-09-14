<?php
require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']); exit;
}

$user_id       = intval($data['user_id'] ?? 0);
$week_start    = $data['week_start'] ?? '';
$week_end      = $data['week_end'] ?? '';
$title         = trim($data['title'] ?? '');
$description   = $data['description'] ?? '';
$working_hours = floatval($data['working_hours'] ?? 0);

if (!$user_id || !$week_start || !$week_end || !$title || !$description) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']); exit;
}

$title = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$sanitized_description = sanitizeHTML($description);
if (empty($sanitized_description)) {
    http_response_code(400);
    echo json_encode(['error' => 'Description cannot be empty']); exit;
}

// Verify user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
$stmt->execute([$user_id]);
if (!$stmt->fetch()) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']); exit;
}

if ($week_start > $week_end) {
    http_response_code(400);
    echo json_encode(['error' => 'Week end date must be after or equal to week start date']); exit;
}

$stmt = $pdo->prepare("INSERT INTO weekly_reports (user_id, week_start, week_end, title, description, working_hours) VALUES (?, ?, ?, ?, ?, ?)");
if ($stmt->execute([$user_id, $week_start, $week_end, $title, $sanitized_description, $working_hours])) {
    http_response_code(201);
    echo json_encode(['success' => true, 'report_id' => $pdo->lastInsertId(), 'message' => 'Report created successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save report']);
}

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