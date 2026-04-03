<?php
require_once '../config/db.php';

$data    = json_decode(file_get_contents('php://input'), true);
$id      = intval($data['id']      ?? 0);
$user_id = intval($data['user_id'] ?? 0);

if (!$id || !$user_id) {
    echo json_encode(['error' => 'Record ID and user ID are required']); exit;
}

// Verify this record belongs to the user (security check)
$check = $conn->prepare("SELECT id FROM dtr_records WHERE id = ? AND user_id = ?");
$check->execute([$id, $user_id]);
if (!$check->fetch()) {
    echo json_encode(['error' => 'Record not found or access denied']); exit;
}

$stmt = $conn->prepare("DELETE FROM dtr_records WHERE id = ? AND user_id = ?");

if ($stmt->execute([$id, $user_id])) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['error' => 'Failed to delete record']);
}
?>