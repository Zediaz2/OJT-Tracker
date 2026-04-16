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
$week_start    = $data['week_start'] ?? '';
$week_end      = $data['week_end'] ?? '';
$title         = trim($data['title'] ?? '');
$description   = $data['description'] ?? '';  // Keep as-is (may be Delta JSON or plain text)
$working_hours = floatval($data['working_hours'] ?? 0);

// Validate required fields
if (!$user_id || !$week_start || !$week_end || !$title || !$description) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required (user_id, week_start, week_end, title, description)']); 
    exit;
}

// Sanitize title
$title = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

// Sanitize description (plain HTML from vanilla RTE)
$sanitized_description = sanitizeHTML($description);
if (empty($sanitized_description)) {
    http_response_code(400);
    echo json_encode(['error' => 'Description cannot be empty']);
    exit;
}

// Verify user exists
$verify_user = $conn->prepare("SELECT id FROM users WHERE id = ?");
if (!$verify_user) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Create Report] User verify prepare failed: " . $conn->error);
    exit;
}

$verify_user->bind_param("i", $user_id);
if (!$verify_user->execute()) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $verify_user->error]);
    error_log("[Create Report] User verify execute failed: " . $verify_user->error);
    exit;
}

if ($verify_user->get_result()->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found. Please log out and log back in.']);
    error_log("[Create Report] User ID $user_id does not exist");
    exit;
}
$verify_user->close();

// Validate dates
if ($week_start > $week_end) {
    http_response_code(400);
    echo json_encode(['error' => 'Week end date must be after or equal to week start date']); 
    exit;
}

// Prepare statement
$stmt = $conn->prepare(
    "INSERT INTO weekly_reports (user_id, week_start, week_end, title, description, working_hours) 
     VALUES (?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $conn->error]);
    error_log("[Create Report] Prepare failed: " . $conn->error);
    exit;
}

$stmt->bind_param("issssd", $user_id, $week_start, $week_end, $title, $sanitized_description, $working_hours);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'report_id' => $conn->insert_id,
        'message' => 'Report created successfully'
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save report: ' . $stmt->error]);
    error_log("[Create Report] Insert failed: " . $stmt->error);
}

$stmt->close();

/**
 * Sanitize HTML content from vanilla RTE
 * Allows basic formatting tags but strips dangerous content
 */
function sanitizeHTML($html) {
    // Trim whitespace
    $html = trim($html);
    
    if (empty($html)) {
        return '';
    }
    
    // Define allowed tags: basic formatting + lists
    $allowed_tags = '<p><br><strong><em><u><s><ol><ul><li><h1><h2><h3><font><div><span>';
    
    // Strip tags that aren't in allowed list
    $sanitized = strip_tags($html, $allowed_tags);
    
    // Additional security: remove event handlers and scripts
    $sanitized = preg_replace('/<[^>]*on\w+\s*=[^>]*>/i', '', $sanitized);
    $sanitized = preg_replace('/<script[^>]*>.*?<\/script>/i', '', $sanitized);
    
    return $sanitized;
}
?>