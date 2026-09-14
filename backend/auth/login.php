<?php
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request']); exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['error' => 'No JSON received']); exit;
}

$email    = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    echo json_encode(['error' => 'Email and password are required']); exit;
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['error' => 'No user found with that email']); exit;
}

if (!password_verify($password, $user['password'])) {
    echo json_encode(['error' => 'Invalid password']); exit;
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