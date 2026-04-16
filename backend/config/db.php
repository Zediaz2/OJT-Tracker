<?php
// ════════════════════════════════════════════════════════
// DATABASE CONFIGURATION & CONNECTION
// ════════════════════════════════════════════════════════

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');        // leave empty if no XAMPP password
define('DB_NAME', 'ojt_tracker');
define('DB_PORT', 3306);

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Don't display to users, log instead
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php_errors.log');

// Establish MySQLi connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    
    // Log detailed error
    error_log("[DB Connection Error] " . $conn->connect_errno . ": " . $conn->connect_error);
    
    // Return user-friendly error
    die(json_encode([
        'error' => 'Database connection failed',
        'details' => 'Unable to connect to MySQL server. Please check:
                    1. XAMPP MySQL is running
                    2. Database credentials in config/db.php are correct
                    3. Database "ojt_tracker" exists'
    ]));
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// Set timezone
date_default_timezone_set('Asia/Manila');

// CORS Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session
session_start();
?>