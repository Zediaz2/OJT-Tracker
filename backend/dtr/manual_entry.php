<?php
require_once '../config/db.php';

$data     = json_decode(file_get_contents('php://input'), true);
$user_id  = intval($data['user_id'] ?? 0);
$date     = $data['date']     ?? '';
$time_in  = $data['time_in']  ?? '';
$time_out = $data['time_out'] ?? '';

if (!$user_id || !$date || !$time_in || !$time_out) {
    echo json_encode(['error' => 'All fields are required']); exit;
}

// Check if record already exists for that date
$check = $conn->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
$check->bind_param("is", $user_id, $date);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(['error' => 'A record for this date already exists']); exit;
}

// Calculate total hours
$in  = new DateTime($time_in);
$out = new DateTime($time_out);
$diff = $in->diff($out);
$total_hours = $diff->h + ($diff->i / 60);

$stmt = $conn->prepare("INSERT INTO dtr_records (user_id, date, time_in, time_out, total_hours) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("isssd", $user_id, $date, $time_in, $time_out, $total_hours);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'total_hours' => round($total_hours, 2)]);
} else {
    echo json_encode(['error' => 'Failed to save entry']);
}
?>