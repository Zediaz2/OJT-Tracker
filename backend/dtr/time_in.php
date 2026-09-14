<?php
require_once '../config/db.php';

$data    = json_decode(file_get_contents('php://input'), true);
$user_id = intval($data['user_id'] ?? 0);
$date    = date('Y-m-d');
$time_in = date('H:i:s');

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']); exit;
}

// Verify user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
$stmt->execute([$user_id]);
if (!$stmt->fetch()) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']); exit;
}

// Check if already timed in today
$check = $pdo->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
$check->execute([$user_id, $date]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Already timed in today']); exit;
}

// Insert time in record
$stmt = $pdo->prepare("INSERT INTO dtr_records (user_id, date, time_in) VALUES (?, ?, ?)");
if ($stmt->execute([$user_id, $date, $time_in])) {
    http_response_code(201);
    echo json_encode(['success' => true, 'time_in' => $time_in, 'date' => $date]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to record time in']);
}
?>