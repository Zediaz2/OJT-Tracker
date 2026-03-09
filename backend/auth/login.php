<?php
require_once '../config/db.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request']); exit;
}

// Read raw input
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

// Debug — remove after fixing
if (!$data) {
    echo json_encode(['error' => 'No JSON received', 'raw' => $raw]); exit;
}

$email    = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    echo json_encode(['error' => 'Email and password are required']); exit;
}

$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

// Debug — shows exactly what's in DB
if (!$user) {
    echo json_encode(['error' => 'No user found with that email']); exit;
}

if (!password_verify($password, $user['password'])) {
    echo json_encode([
        'error'          => 'Password does not match',
        'entered'        => $password,
        'hash_in_db'     => $user['password'],
        'verify_result'  => password_verify($password, $user['password'])
    ]); exit;
}

$_SESSION['user_id']   = $user['id'];
$_SESSION['user_name'] = $user['full_name'];

echo json_encode([
    'success' => true,
    'user' => [
        'id'             => $user['id'],
        'name'           => $user['full_name'],
        'email'          => $user['email'],
        'company'        => $user['company'],
        'required_hours' => $user['required_hours']
    ]
]);
?>