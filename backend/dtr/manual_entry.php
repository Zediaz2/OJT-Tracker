<?php
require_once '../config/db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']); exit;
}

$user_id       = intval($data['user_id'] ?? 0);
$date          = $data['date']          ?? '';
$time_in       = $data['time_in']       ?? '';
$time_out      = $data['time_out']      ?? '';
$break_minutes = intval($data['break_minutes'] ?? 0);

if (!$user_id || !$date || !$time_in || !$time_out) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required (user_id, date, time_in, time_out)']); exit;
}

if ($break_minutes < 0 || $break_minutes > 480) {
    http_response_code(400);
    echo json_encode(['error' => 'Break duration must be between 0 and 480 minutes']); exit;
}

// Check duplicate
$check = $pdo->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
$check->execute([$user_id, $date]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'A record for this date already exists']); exit;
}

// Calculate net hours
try {
    $in  = new DateTime($time_in);
    $out = new DateTime($time_out);
    $diff = $in->diff($out);
    $raw_minutes = ($diff->h * 60) + $diff->i;
    $net_minutes = max(0, $raw_minutes - $break_minutes);
    $total_hours = round($net_minutes / 60, 2);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid time format']); exit;
}

// Verify user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
$stmt->execute([$user_id]);
if (!$stmt->fetch()) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']); exit;
}

// Insert record
$stmt = $pdo->prepare("INSERT INTO dtr_records (user_id, date, time_in, time_out, total_hours, break_minutes) VALUES (?, ?, ?, ?, ?, ?)");
if ($stmt->execute([$user_id, $date, $time_in, $time_out, $total_hours, $break_minutes])) {
    http_response_code(201);
    echo json_encode([
        'success'       => true,
        'total_hours'   => $total_hours,
        'break_minutes' => $break_minutes,
        'record_id'     => $pdo->lastInsertId()
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save entry']);
}
?>