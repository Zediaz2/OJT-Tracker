<?php
require_once '../config/db.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request']); exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$name           = trim($data['name'] ?? '');
$email          = trim($data['email'] ?? '');
$password       = trim($data['password'] ?? '');
$school         = trim($data['school'] ?? '');
$company        = trim($data['company'] ?? '');
$required_hours = intval($data['required_hours'] ?? 600);

// Validation
if (!$name || !$email || !$password || !$company) {
    echo json_encode(['error' => 'Name, email, password, and company are required']); exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['error' => 'Invalid email address']); exit;
}
if (strlen($password) < 6) {
    echo json_encode(['error' => 'Password must be at least 6 characters']); exit;
}

// Check if email already exists
$check = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check->bind_param("s", $email);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(['error' => 'An account with that email already exists']); exit;
}

// Hash password and insert
$hashed = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("
    INSERT INTO users (full_name, email, password, school, company, required_hours)
    VALUES (?, ?, ?, ?, ?, ?)
");
$stmt->bind_param("sssssi", $name, $email, $hashed, $school, $company, $required_hours);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Account created successfully']);
} else {
    echo json_encode(['error' => 'Failed to create account. Please try again.']);
}
?>