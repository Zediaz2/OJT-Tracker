<?php
require_once '../config/db.php';
session_destroy();
echo json_encode(['success' => true, 'message' => 'Logged out']);
?>