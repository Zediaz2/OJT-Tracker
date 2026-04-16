<?php
require_once '../config/db.php';

$data          = json_decode(file_get_contents('php://input'), true);
$user_id       = intval($data['user_id'] ?? 0);
$break_minutes = intval($data['break_minutes'] ?? 0);
$date          = date('Y-m-d');
$time_out      = date('H:i:s');

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']); 
    exit;
}

// Verify user exists
$verify_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
if (!$verify_user) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Time Out] User verify prepare failed: " . $conn->error);
    exit;
}

$verify_user->bind_param("i", $user_id);
if (!$verify_user->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $verify_user->error]);
    error_log("[Time Out] User verify execute failed: " . $verify_user->error);
    exit;
}

if ($verify_user->get_result()->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']);
    error_log("[Time Out] User ID $user_id does not exist");
    exit;
}
$verify_user->close();

// Validate break_minutes
if ($break_minutes < 0 || $break_minutes > 480) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid break duration. Must be between 0 and 480 minutes.']); 
    exit;
}

// Get today's time_in record
$stmt = $conn->prepare("SELECT id, time_in, time_out FROM dtr_records WHERE user_id = ? AND date = ?");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Time Out] Select prepare failed: " . $conn->error);
    exit;
}

$stmt->bind_param("is", $user_id, $date);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $stmt->error]);
    error_log("[Time Out] Select execute failed: " . $stmt->error);
    exit;
}

$result = $stmt->get_result();
$record = $result->fetch_assoc();
$stmt->close();

if (!$record) {
    http_response_code(404);
    echo json_encode(['error' => 'No time-in record found for today']); 
    exit;
}

if ($record['time_in'] === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Please time in first']); 
    exit;
}

if ($record['time_out'] !== null) {
    http_response_code(409);
    echo json_encode(['error' => 'You have already timed out today']); 
    exit;
}

// Calculate total hours from time_in to time_out
try {
    $in   = new DateTime($record['time_in']);
    $out  = new DateTime($time_out);
    $diff = $in->diff($out);

    $raw_minutes   = ($diff->h * 60) + $diff->i;
    $net_minutes   = max(0, $raw_minutes - $break_minutes);
    $total_hours   = round($net_minutes / 60, 2);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error calculating hours: ' . $e->getMessage()]);
    error_log("[Time Out] DateTime error: " . $e->getMessage());
    exit;
}

// Update record with time_out, total_hours, and break_minutes
$update = $conn->prepare(
    "UPDATE dtr_records SET time_out = ?, total_hours = ?, break_minutes = ? WHERE id = ?"
);

if (!$update) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Time Out] Update prepare failed: " . $conn->error);
    exit;
}

$update->bind_param("sdii", $time_out, $total_hours, $break_minutes, $record['id']);

if ($update->execute()) {
    http_response_code(200);
    echo json_encode([
        'success'       => true,
        'time_out'      => $time_out,
        'total_hours'   => $total_hours,
        'break_minutes' => $break_minutes,
        'raw_hours'     => round($raw_minutes / 60, 2)
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to record time out: ' . $update->error]);
    error_log("[Time Out] Update execute failed: " . $update->error);
}

$update->close();
?>