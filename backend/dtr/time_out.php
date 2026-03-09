<?php
require_once '../config/db.php';

$data     = json_decode(file_get_contents('php://input'), true);
$user_id  = intval($data['user_id'] ?? 0);
$date     = date('Y-m-d');
$time_out = date('H:i:s');

// Get today's time_in record
$stmt = $conn->prepare("SELECT id, time_in FROM dtr_records WHERE user_id = ? AND date = ?");
$stmt->bind_param("is", $user_id, $date);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();

if (!$record) {
    echo json_encode(['error' => 'No time-in record found for today']); exit;
}
if ($record['time_in'] === null) {
    echo json_encode(['error' => 'Please time in first']); exit;
}

// Calculate total hours
$in  = new DateTime($record['time_in']);
$out = new DateTime($time_out);
$diff = $in->diff($out);
$total_hours = $diff->h + ($diff->i / 60);

$update = $conn->prepare("UPDATE dtr_records SET time_out = ?, total_hours = ? WHERE id = ?");
$update->bind_param("sdi", $time_out, $total_hours, $record['id']);

if ($update->execute()) {
    echo json_encode(['success' => true, 'time_out' => $time_out, 'total_hours' => round($total_hours, 2)]);
} else {
    echo json_encode(['error' => 'Failed to record time out']);
}
?>