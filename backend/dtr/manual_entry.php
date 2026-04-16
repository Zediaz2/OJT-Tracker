<?php
require_once '../config/db.php';

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate input exists
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$user_id       = intval($data['user_id'] ?? 0);
$date          = $data['date']          ?? '';
$time_in       = $data['time_in']       ?? '';
$time_out      = $data['time_out']      ?? '';
$break_minutes = intval($data['break_minutes'] ?? 0);

// Validate required fields
if (!$user_id || !$date || !$time_in || !$time_out) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required (user_id, date, time_in, time_out)']); 
    exit;
}

// Validate break duration
if ($break_minutes < 0 || $break_minutes > 480) {
    http_response_code(400);
    echo json_encode(['error' => 'Break duration must be between 0 and 480 minutes']); 
    exit;
}

// Check if record already exists for that date
$check = $conn->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
if (!$check) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[DTR Manual Entry] Prepare failed: " . $conn->error);
    exit;
}

$check->bind_param("is", $user_id, $date);
if (!$check->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $check->error]);
    error_log("[DTR Manual Entry] Check query failed: " . $check->error);
    exit;
}

if ($check->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'A record for this date already exists']); 
    exit;
}
$check->close();

// Calculate net hours (raw hours minus break)
try {
    $in  = new DateTime($time_in);
    $out = new DateTime($time_out);
    $diff = $in->diff($out);

    $raw_minutes = ($diff->h * 60) + $diff->i;
    $net_minutes = max(0, $raw_minutes - $break_minutes);
    $total_hours = round($net_minutes / 60, 2);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid time format: ' . $e->getMessage()]);
    error_log("[DTR Manual Entry] DateTime error: " . $e->getMessage());
    exit;
}

// Verify user exists before inserting
$verify_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
if (!$verify_user) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[DTR Manual Entry] User verify prepare failed: " . $conn->error);
    exit;
}

$verify_user->bind_param("i", $user_id);
if (!$verify_user->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $verify_user->error]);
    error_log("[DTR Manual Entry] User verify execute failed: " . $verify_user->error);
    exit;
}

$user_result = $verify_user->get_result();
if ($user_result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']);
    error_log("[DTR Manual Entry] User ID $user_id does not exist in database");
    exit;
}
$verify_user->close();

// Insert record
$stmt = $conn->prepare(
    "INSERT INTO dtr_records (user_id, date, time_in, time_out, total_hours, break_minutes) 
     VALUES (?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[DTR Manual Entry] Prepare failed: " . $conn->error);
    exit;
}

$stmt->bind_param("isssdi", $user_id, $date, $time_in, $time_out, $total_hours, $break_minutes);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'total_hours' => $total_hours,
        'break_minutes' => $break_minutes,
        'record_id' => $conn->insert_id
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save entry: ' . $stmt->error]);
    error_log("[DTR Manual Entry] Insert failed: " . $stmt->error);
}

$stmt->close();
?>