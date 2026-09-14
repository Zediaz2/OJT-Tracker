<?php
require_once '../config/db.php';

$user_id = intval($_GET['user_id'] ?? 0);

// SQLite doesn't have GROUP_CONCAT exactly the same, but it does support it
$stmt = $pdo->prepare("
    SELECT r.*, GROUP_CONCAT(i.file_path) as images
    FROM weekly_reports r
    LEFT JOIN report_images i ON r.id = i.report_id
    WHERE r.user_id = ?
    GROUP BY r.id
    ORDER BY r.submitted_at DESC
");
$stmt->execute([$user_id]);
$reports = $stmt->fetchAll();

// Convert images string to array
foreach ($reports as &$row) {
    $row['images'] = $row['images'] ? explode(',', $row['images']) : [];
}

echo json_encode(['reports' => $reports]);
?>