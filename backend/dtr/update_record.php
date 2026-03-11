<?php
require_once '../config/db.php';

$data          = json_decode(file_get_contents('php://input'), true);
$id            = intval($data['id']            ?? 0);
$user_id       = intval($data['user_id']       ?? 0);
$date          = $data['date']                 ?? '';
$time_in       = $data['time_in']              ?? '';
$time_out      = $data['time_out']             ?? '';
$break_minutes = intval($data['break_minutes'] ?? 0);

if (!$id || !$user_id || !$date || !$time_in) {
    echo json_encode(['error' => 'ID, user ID, date, and time in are required']); exit;
}

if ($break_minutes < 0 || $break_minutes > 480) {
    echo json_encode(['error' => 'Break duration must be between 0 and 480 minutes']); exit;
}

// Verify this record belongs to the user (security check)
$check = $conn->prepare("SELECT id FROM dtr_records WHERE id = ? AND user_id = ?");
$check->execute([$id, $user_id]);
if (!$check->fetch()) {
    echo json_encode(['error' => 'Record not found or access denied']); exit;
}

// Calculate net hours if time_out is provided
$total_hours = null;
if (!empty($time_out)) {
    if ($time_in >= $time_out) {
        echo json_encode(['error' => 'Time Out must be later than Time In']); exit;
    }
    $in  = new DateTime($time_in);
    $out = new DateTime($time_out);
    $diff = $in->diff($out);

    $raw_minutes = ($diff->h * 60) + $diff->i;
    $net_minutes = max(0, $raw_minutes - $break_minutes);
    $total_hours = round($net_minutes / 60, 2);
}

$stmt = $conn->prepare(
    "UPDATE dtr_records
     SET date = ?, time_in = ?, time_out = ?, break_minutes = ?, total_hours = ?
     WHERE id = ? AND user_id = ?"
);

if ($stmt->execute([$date, $time_in, $time_out, $break_minutes, $total_hours, $id, $user_id])) {
    echo json_encode([
        'success'       => true,
        'total_hours'   => $total_hours,
        'break_minutes' => $break_minutes
    ]);
} else {
    echo json_encode(['error' => 'Failed to update record']);
}
?>