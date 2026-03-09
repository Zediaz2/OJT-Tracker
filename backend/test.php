<?php
$conn = new mysqli('localhost', 'root', '', 'ojt_tracker');

if ($conn->connect_error) {
    echo "DB FAILED: " . $conn->connect_error;
} else {
    echo "DB CONNECTED OK";
    $res = $conn->query("SELECT email, password FROM users");
    while ($row = $res->fetch_assoc()) {
        echo "<br>Email: " . $row['email'];
        echo "<br>Hash: " . $row['password'];
    }
}
?>