<?php
require_once '../config/db.php';

$report_id  = intval($_POST['report_id'] ?? 0);
$upload_dir = __DIR__ . '/../../frontend/uploads/';

if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

$allowed = ['image/jpeg', 'image/png', 'image/webp'];
$uploaded = [];

foreach ($_FILES['images']['tmp_name'] as $key => $tmp) {
    $type = $_FILES['images']['type'][$key];
    if (!in_array($type, $allowed)) continue;

    $ext      = pathinfo($_FILES['images']['name'][$key], PATHINFO_EXTENSION);
    $filename = uniqid('img_') . '.' . $ext;
    $dest     = $upload_dir . $filename;

    if (move_uploaded_file($tmp, $dest)) {
        $path = 'uploads/' . $filename;
        $stmt = $conn->prepare("INSERT INTO report_images (report_id, file_path) VALUES (?, ?)");
        $stmt->bind_param("is", $report_id, $path);
        $stmt->execute();
        $uploaded[] = $path;
    }
}

echo json_encode(['success' => true, 'files' => $uploaded]);
?>