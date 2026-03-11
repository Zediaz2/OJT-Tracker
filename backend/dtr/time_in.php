<?php
require_once '../config/db.php';

$data    = json_decode(file_get_contents('php://input'), true);
$user_id = intval($data['user_id'] ?? 0);
$date    = date('Y-m-d');
$time_in = date('H:i:s');

if (!$user_id) {
    echo json_encode(['error' => 'User ID required']); exit;
}

// Check if already timed in today
$check = $conn->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
$check->execute([$user_id, $date]);
if ($check->fetch()) {
    echo json_encode(['error' => 'Already timed in today']); exit;
}

$stmt = $conn->prepare("INSERT INTO dtr_records (user_id, date, time_in) VALUES (?, ?, ?)");

if ($stmt->execute([$user_id, $date, $time_in])) {
    echo json_encode(['success' => true, 'time_in' => $time_in, 'date' => $date]);
} else {
    echo json_encode(['error' => 'Failed to record time in']);
}
?>