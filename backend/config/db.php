<?php
// ════════════════════════════════════════════════════════
// DATABASE CONFIGURATION & CONNECTION — SQLite via PDO
// ════════════════════════════════════════════════════════

// Database file path (auto-created if missing)
define('DB_PATH', __DIR__ . '/../../database/ojt_tracker.db');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php_errors.log');

// Ensure the database directory exists
$dbDir = dirname(DB_PATH);
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
}

// Establish PDO SQLite connection
try {
    $pdo = new PDO('sqlite:' . DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    // Enable WAL mode for better concurrent read/write performance
    $pdo->exec('PRAGMA journal_mode=WAL');
    // Enable foreign keys (off by default in SQLite)
    $pdo->exec('PRAGMA foreign_keys=ON');
} catch (PDOException $e) {
    http_response_code(500);
    error_log("[DB Connection Error] " . $e->getMessage());
    die(json_encode([
        'error' => 'Database connection failed',
        'details' => 'Unable to open SQLite database. Check file permissions on the database/ directory.'
    ]));
}

// Auto-initialize tables if the database is brand new
$tableCheck = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
if ($tableCheck->fetch() === false) {
    require_once __DIR__ . '/../setup_database.php';
}

// Set timezone
date_default_timezone_set('Asia/Manila');

// ── Security Headers ──────────────────────────────────────
header('Content-Type: application/json');

// Dynamic CORS — only allow the origin that is making the request
// This ensures the app works on localhost AND on LAN (e.g. 192.168.x.x)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_patterns = [
    '/^https?:\/\/localhost(:\d+)?$/',
    '/^https?:\/\/127\.0\.0\.1(:\d+)?$/',
    '/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/',
    '/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/',
    '/^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/',
];

$origin_allowed = false;
foreach ($allowed_patterns as $pattern) {
    if (preg_match($pattern, $origin)) {
        $origin_allowed = true;
        break;
    }
}

if ($origin_allowed) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
} else {
    // Fallback for same-origin requests (no Origin header)
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session with secure cookie settings
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Strict',
]);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>