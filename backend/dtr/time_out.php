<?php
require_once '../config/db.php';

$data          = json_decode(file_get_contents('php://input'), true);
$user_id       = intval($data['user_id'] ?? 0);
$break_minutes = intval($data['break_minutes'] ?? 0);
$date          = date('Y-m-d');
$time_out      = date('H:i:s');

if (!$user_id) {
    echo json_encode(['error' => 'User ID required']); exit;
}

// Validate break_minutes
if ($break_minutes < 0 || $break_minutes > 480) {
    echo json_encode(['error' => 'Invalid break duration. Must be between 0 and 480 minutes.']); exit;
}

// Get today's time_in record
$stmt = $conn->prepare("SELECT id, time_in, time_out FROM dtr_records WHERE user_id = ? AND date = ?");
$stmt->execute([$user_id, $date]);
$record = $stmt->fetch();

if (!$record) {
    echo json_encode(['error' => 'No time-in record found for today']); exit;
}
if ($record['time_in'] === null) {
    echo json_encode(['error' => 'Please time in first']); exit;
}
if ($record['time_out'] !== null) {
    echo json_encode(['error' => 'You have already timed out today']); exit;
}

// Calculate total hours from time_in to time_out
$in   = new DateTime($record['time_in']);
$out  = new DateTime($time_out);
$diff = $in->diff($out);

$raw_minutes   = ($diff->h * 60) + $diff->i;
$net_minutes   = max(0, $raw_minutes - $break_minutes);
$total_hours   = round($net_minutes / 60, 2);

// Update record with time_out, total_hours, and break_minutes
$update = $conn->prepare(
    "UPDATE dtr_records SET time_out = ?, total_hours = ?, break_minutes = ? WHERE id = ?"
);

if ($update->execute([$time_out, $total_hours, $break_minutes, $record['id']])) {
    echo json_encode([
        'success'       => true,
        'time_out'      => $time_out,
        'total_hours'   => $total_hours,
        'break_minutes' => $break_minutes,
        'raw_hours'     => round($raw_minutes / 60, 2)
    ]);
} else {
    echo json_encode(['error' => 'Failed to record time out']);
}
?>