<?php
require_once '../config/db.php';

$user_id = intval($_GET['user_id'] ?? 0);

$stmt = $conn->prepare("
    SELECT r.*, GROUP_CONCAT(i.file_path) as images
    FROM weekly_reports r
    LEFT JOIN report_images i ON r.id = i.report_id
    WHERE r.user_id = ?
    GROUP BY r.id
    ORDER BY r.submitted_at DESC
");
$stmt->execute([$user_id]);
$result = $stmt->fetchAll();

$reports = [];
foreach ($result as $row) {
    $row['images'] = $row['images'] ? explode(',', $row['images']) : [];
    $reports[] = $row;
}

echo json_encode(['reports' => $reports]);
?>