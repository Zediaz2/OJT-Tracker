<?php
require_once '../config/db.php';

$data    = json_decode(file_get_contents('php://input'), true);
$user_id = intval($data['user_id'] ?? 0);
$date    = date('Y-m-d');
$time_in = date('H:i:s');

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
    error_log("[Time In] User verify prepare failed: " . $conn->error);
    exit;
}

$verify_user->bind_param("i", $user_id);
if (!$verify_user->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $verify_user->error]);
    error_log("[Time In] User verify execute failed: " . $verify_user->error);
    exit;
}

if ($verify_user->get_result()->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']);
    error_log("[Time In] User ID $user_id does not exist");
    exit;
}
$verify_user->close();

// Check if already timed in today
$check = $conn->prepare("SELECT id FROM dtr_records WHERE user_id = ? AND date = ?");
if (!$check) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Time In] Check prepare failed: " . $conn->error);
    exit;
}

$check->bind_param("is", $user_id, $date);
if (!$check->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $check->error]);
    error_log("[Time In] Check execute failed: " . $check->error);
    exit;
}

if ($check->get_result()->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Already timed in today']); 
    exit;
}
$check->close();

// Insert time in record
$stmt = $conn->prepare("INSERT INTO dtr_records (user_id, date, time_in) VALUES (?, ?, ?)");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Time In] Insert prepare failed: " . $conn->error);
    exit;
}

$stmt->bind_param("iss", $user_id, $date, $time_in);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(['success' => true, 'time_in' => $time_in, 'date' => $date]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to record time in: ' . $stmt->error]);
    error_log("[Time In] Insert execute failed: " . $stmt->error);
}

$stmt->close();
?>