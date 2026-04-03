<?php
require_once __DIR__ . '/config/db.php';

try {
    echo "DB CONNECTED OK";
    $res = $conn->query("SELECT email, password FROM users");
    while ($row = $res->fetch()) {
        echo "<br>Email: " . $row['email'];
        echo "<br>Hash: " . $row['password'];
    }
} catch (Exception $e) {
    echo "DB FAILED: " . $e->getMessage();
}
?>