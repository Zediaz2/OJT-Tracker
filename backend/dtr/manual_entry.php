<?php
require_once '../config/db.php';

$data          = json_decode(file_get_contents('php://input'), true);
$user_id       = intval($data['user_id'] ?? 0);
$date          = $data['date']          ?? '';
$time_in       = $data['time_in']       ?? '';
$time_out      = $data['time_out']      ?? '';
$break_minutes = intval($data['break_minutes'] ?? 0);

if (!$user_id || !$date || !$time_in || !$time_out) {
    echo json_encode(['error' => 'All fields are required']); exit;
}

// Validate break duration
if ($break_minutes < 0 || $break_minutes > 480) {
    echo json_encode(['error' => 'Break duration must be between 0 and 480 minutes']); exit;
}

// Check if record already exists for that date
$check = $conn->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
$check->execute([$user_id, $date]);
if ($check->fetch()) {
    echo json_encode(['error' => 'A record for this date already exists']); exit;
}

// Calculate net hours (raw hours minus break)
$in  = new DateTime($time_in);
$out = new DateTime($time_out);
$diff = $in->diff($out);

$raw_minutes = ($diff->h * 60) + $diff->i;
$net_minutes = max(0, $raw_minutes - $break_minutes);
$total_hours = round($net_minutes / 60, 2);

$stmt = $conn->prepare(
    "INSERT INTO dtr_records (user_id, date, time_in, time_out, total_hours, break_minutes) VALUES (?, ?, ?, ?, ?, ?)"
);

if ($stmt->execute([$user_id, $date, $time_in, $time_out, $total_hours, $break_minutes])) {
    echo json_encode([
        'success'       => true,
        'total_hours'   => $total_hours,
        'break_minutes' => $break_minutes
    ]);
} else {
    echo json_encode(['error' => 'Failed to save entry']);
}
?>