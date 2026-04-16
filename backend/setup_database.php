<?php
/**
 * Database Setup & Verification Script
 * Run this once to initialize or repair your database
 */

$host = 'localhost';
$user = 'root';
$pass = '';  // empty for default XAMPP

// Step 1: Connect to MySQL server (without specifying a database)
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'MySQL Connection Failed: ' . $conn->connect_error,
        'action' => 'Ensure XAMPP MySQL is running and credentials are correct'
    ]));
}

// Step 2: Create database if it doesn't exist
$db_name = 'ojt_tracker';
$sql_create_db = "CREATE DATABASE IF NOT EXISTS $db_name;";

if (!$conn->query($sql_create_db)) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Failed to create database: ' . $conn->error
    ]));
}

// Step 3: Select the database
if (!$conn->select_db($db_name)) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Failed to select database: ' . $conn->error
    ]));
}

// Step 4: Create tables with proper schema
$tables_created = [];
$tables_failed = [];

// Users table
$sql = "CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  school VARCHAR(100),
  company VARCHAR(100),
  required_hours INT DEFAULT 600,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
if ($conn->query($sql)) {
    $tables_created[] = 'users';
} else {
    $tables_failed[] = ['table' => 'users', 'error' => $conn->error];
}

// DTR Records table (WITH break_minutes column)
$sql = "CREATE TABLE IF NOT EXISTS dtr_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  total_hours DECIMAL(4,2),
  break_minutes INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dtr (user_id, date)
)";
if ($conn->query($sql)) {
    $tables_created[] = 'dtr_records';
} else {
    $tables_failed[] = ['table' => 'dtr_records', 'error' => $conn->error];
}

// Add break_minutes column if it's missing (for existing tables)
$check_column = $conn->query("SHOW COLUMNS FROM dtr_records LIKE 'break_minutes'");
if ($check_column->num_rows === 0) {
    $conn->query("ALTER TABLE dtr_records ADD COLUMN break_minutes INT DEFAULT 0 AFTER total_hours");
}

// Weekly Reports table
$sql = "CREATE TABLE IF NOT EXISTS weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  working_hours DECIMAL(5,2) DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";
if ($conn->query($sql)) {
    $tables_created[] = 'weekly_reports';
} else {
    $tables_failed[] = ['table' => 'weekly_reports', 'error' => $conn->error];
}

// Add working_hours column if missing
$check_column = $conn->query("SHOW COLUMNS FROM weekly_reports LIKE 'working_hours'");
if ($check_column->num_rows === 0) {
    $conn->query("ALTER TABLE weekly_reports ADD COLUMN working_hours DECIMAL(5,2) DEFAULT 0 AFTER submitted_at");
}

// Report Images table
$sql = "CREATE TABLE IF NOT EXISTS report_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES weekly_reports(id) ON DELETE CASCADE
)";
if ($conn->query($sql)) {
    $tables_created[] = 'report_images';
} else {
    $tables_failed[] = ['table' => 'report_images', 'error' => $conn->error];
}

// Step 5: Check if sample user exists, if not create one
$check_user = $conn->query("SELECT COUNT(*) as count FROM users");
$row = $check_user->fetch_assoc();

if ($row['count'] == 0) {
    // Password: admin123 (bcrypt hash)
    $sample_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    $sql = "INSERT INTO users (full_name, email, password, school, company, required_hours)
            VALUES ('Juan dela Cruz', 'juan@email.com', '$sample_hash', 'PLM', 'ABC Corp', 600)";
    $conn->query($sql);
}

// Step 6: Verify connection to ojt_tracker database
$verify = new mysqli($host, $user, $pass, $db_name);
if ($verify->connect_error) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Verification Failed: ' . $verify->connect_error
    ]));
}

$conn->close();
$verify->close();

// Return success response
echo json_encode([
    'status' => 'success',
    'message' => 'Database setup completed successfully!',
    'tables_created' => $tables_created,
    'tables_failed' => $tables_failed,
    'next_step' => 'Try inserting data through your frontend. If errors persist, check the browser console for detailed error messages.'
]);
?>
