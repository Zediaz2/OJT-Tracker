<?php
require_once '../config/db.php';

$user_id = intval($_GET['user_id'] ?? 0);

$stmt = $conn->prepare("SELECT * FROM dtr_records WHERE user_id = ? ORDER BY date DESC");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$records = [];
while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode(['records' => $records]);
?>