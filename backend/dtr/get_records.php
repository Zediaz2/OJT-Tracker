<?php
require_once '../config/db.php';

$user_id = intval($_GET['user_id'] ?? 0);

$stmt = $conn->prepare("SELECT * FROM dtr_records WHERE user_id = ? ORDER BY date DESC");
$stmt->execute([$user_id]);

$records = $stmt->fetchAll();

echo json_encode(['records' => $records]);
?>