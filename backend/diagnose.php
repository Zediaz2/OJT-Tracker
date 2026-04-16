<?php
/**
 * XAMPP OJT Tracker - Diagnostic & Setup Tool
 * Run this file at: http://localhost/OJT-Tracker/backend/diagnose.php
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>OJT Tracker - Diagnostic Tool</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 30px; border-bottom: 3px solid #1a56db; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 25px; margin-bottom: 15px; font-size: 1.1em; }
        .diagnostic { margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #ddd; border-radius: 4px; }
        .diagnostic.success { border-left-color: #10b981; background: #f0fdf4; }
        .diagnostic.warning { border-left-color: #f59e0b; background: #fffbeb; }
        .diagnostic.error { border-left-color: #ef4444; background: #fef2f2; }
        .status { display: inline-block; padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 0.9em; }
        .status.ok { background: #d1fae5; color: #065f46; }
        .status.warning { background: #fef3c7; color: #b45309; }
        .status.error { background: #fee2e2; color: #991b1b; }
        .details { margin-top: 10px; padding: 10px; background: white; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: #555; max-height: 200px; overflow-y: auto; }
        .button-group { margin-top: 30px; display: flex; gap: 10px; flex-wrap: wrap; }
        button { padding: 12px 24px; border: none; border-radius: 6px; font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .btn-primary { background: #1a56db; color: white; }
        .btn-primary:hover { background: #1e40af; }
        .btn-secondary { background: #e5e7eb; color: #333; }
        .btn-secondary:hover { background: #d1d5db; }
        table { width: 100%; margin-top: 15px; border-collapse: collapse; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f3f4f6; font-weight: 600; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 OJT Tracker - Diagnostic & Setup Tool</h1>
        <p style="color: #666; margin-bottom: 20px;">Use this tool to verify your XAMPP setup and fix database issues.</p>

        <?php
        // ════════════════════════════════════════════════
        // STEP 1: Check PHP & Environment
        // ════════════════════════════════════════════════
        echo '<h2>Environment Check</h2>';
        
        // PHP Version
        echo '<div class="diagnostic success">';
        echo '<span class="status ok">✓ PHP Version</span>';
        echo '<div class="details">PHP ' . phpversion() . '</div>';
        echo '</div>';

        // PHP Extensions
        $extensions = ['mysqli', 'json', 'openssl'];
        foreach ($extensions as $ext) {
            if (extension_loaded($ext)) {
                echo '<div class="diagnostic success">';
                echo '<span class="status ok">✓ ' . strtoupper($ext) . ' Extension</span>';
                echo '</div>';
            } else {
                echo '<div class="diagnostic error">';
                echo '<span class="status error">✗ ' . strtoupper($ext) . ' Extension Missing</span>';
                echo '</div>';
            }
        }

        // ════════════════════════════════════════════════
        // STEP 2: Check MySQL Connection
        // ════════════════════════════════════════════════
        echo '<h2>MySQL Connection Test</h2>';

        $mysql_host = 'localhost';
        $mysql_user = 'root';
        $mysql_pass = '';
        $mysql_db = 'ojt_tracker';

        $test_conn = @new mysqli($mysql_host, $mysql_user, $mysql_pass);

        if (!$test_conn->connect_error) {
            echo '<div class="diagnostic success">';
            echo '<span class="status ok">✓ MySQL Server Connected</span>';
            echo '<div class="details">Server: ' . $test_conn->server_info . '</div>';
            echo '</div>';

            // Check if database exists
            $db_check = $test_conn->query("SHOW DATABASES LIKE '$mysql_db'");
            if ($db_check && $db_check->num_rows > 0) {
                echo '<div class="diagnostic success">';
                echo '<span class="status ok">✓ Database "' . $mysql_db . '" Exists</span>';
                echo '</div>';

                // Switch to database
                if ($test_conn->select_db($mysql_db)) {
                    // Check tables
                    echo '<div class="diagnostic success">';
                    echo '<span class="status ok">✓ Database Selected</span>';
                    echo '</div>';

                    $tables_to_check = ['users', 'dtr_records', 'weekly_reports', 'report_images'];
                    foreach ($tables_to_check as $table) {
                        $result = $test_conn->query("SHOW TABLES LIKE '$table'");
                        if ($result && $result->num_rows > 0) {
                            echo '<div class="diagnostic success">';
                            echo '<span class="status ok">✓ Table "$table" Exists</span>';
                            
                            // Check row count
                            $count = $test_conn->query("SELECT COUNT(*) as cnt FROM $table")->fetch_assoc()['cnt'];
                            echo '<div class="details">Rows: ' . $count . '</div>';
                            echo '</div>';
                        } else {
                            echo '<div class="diagnostic warning">';
                            echo '<span class="status warning">⚠ Table "$table" Missing</span>';
                            echo '</div>';
                        }
                    }

                    // Check for break_minutes column in dtr_records
                    $columns = $test_conn->query("SHOW COLUMNS FROM dtr_records LIKE 'break_minutes'");
                    if ($columns && $columns->num_rows > 0) {
                        echo '<div class="diagnostic success">';
                        echo '<span class="status ok">✓ Column "break_minutes" in dtr_records</span>';
                        echo '</div>';
                    } else {
                        echo '<div class="diagnostic error">';
                        echo '<span class="status error">✗ Column "break_minutes" Missing (CRITICAL)</span>';
                        echo '</div>';
                    }

                } else {
                    echo '<div class="diagnostic error">';
                    echo '<span class="status error">✗ Cannot select database: ' . $test_conn->error . '</span>';
                    echo '</div>';
                }
            } else {
                echo '<div class="diagnostic error">';
                echo '<span class="status error">✗ Database "' . $mysql_db . '" Does Not Exist</span>';
                echo '</div>';
            }

            $test_conn->close();
        } else {
            echo '<div class="diagnostic error">';
            echo '<span class="status error">✗ MySQL Connection Failed</span>';
            echo '<div class="details">Error: ' . $test_conn->connect_error . '</div>';
            echo '<div class="details">Make sure XAMPP MySQL is running on ' . $mysql_host . ':3306</div>';
            echo '</div>';
        }

        // ════════════════════════════════════════════════
        // STEP 3: File Permissions
        // ════════════════════════════════════════════════
        echo '<h2>File Permissions</h2>';

        $uploads_dir = __DIR__ . '/../../frontend/uploads';
        if (is_dir($uploads_dir) && is_writable($uploads_dir)) {
            echo '<div class="diagnostic success">';
            echo '<span class="status ok">✓ Upload Directory Writable</span>';
            echo '</div>';
        } else {
            echo '<div class="diagnostic warning">';
            echo '<span class="status warning">⚠ Upload Directory Check</span>';
            echo '<div class="details">Path: ' . $uploads_dir . '<br>Writable: ' . (is_writable($uploads_dir) ? 'Yes' : 'No') . '</div>';
            echo '</div>';
        }

        ?>

        <h2>Quick Setup</h2>
        <div class="diagnostic">
            <p><strong>To fix all issues at once:</strong></p>
            <ol style="margin-left: 20px; margin-top: 10px; line-height: 1.8;">
                <li>Click the <strong>"Setup Database"</strong> button below</li>
                <li>This will create all tables and columns automatically</li>
                <li>Then try inserting data through your frontend</li>
            </ol>
        </div>

        <div class="button-group">
            <form method="POST" style="display: inline;">
                <button type="submit" name="setup_db" class="btn-primary">Setup Database</button>
            </form>
            <button class="btn-secondary" onclick="location.reload()">Refresh Diagnostics</button>
        </div>

        <?php
        // ════════════════════════════════════════════════
        // HANDLE SETUP REQUEST
        // ════════════════════════════════════════════════
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['setup_db'])) {
            echo '<h2 style="color: #1a56db;">Database Setup in Progress...</h2>';

            $setup_conn = new mysqli($mysql_host, $mysql_user, $mysql_pass);

            if ($setup_conn->connect_error) {
                echo '<div class="diagnostic error">Failed to connect to MySQL: ' . $setup_conn->connect_error . '</div>';
            } else {
                // Create database
                if ($setup_conn->query("CREATE DATABASE IF NOT EXISTS $mysql_db")) {
                    echo '<div class="diagnostic success">✓ Database created or already exists</div>';
                } else {
                    echo '<div class="diagnostic error">✗ Failed to create database: ' . $setup_conn->error . '</div>';
                }

                // Select database
                $setup_conn->select_db($mysql_db);

                // Create tables
                $tables = [
                    'users' => "CREATE TABLE IF NOT EXISTS users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        full_name VARCHAR(100) NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        school VARCHAR(100),
                        company VARCHAR(100),
                        required_hours INT DEFAULT 600,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )",
                    'dtr_records' => "CREATE TABLE IF NOT EXISTS dtr_records (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        date DATE NOT NULL,
                        time_in TIME,
                        time_out TIME,
                        total_hours DECIMAL(4,2),
                        break_minutes INT DEFAULT 0,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_dtr (user_id, date)
                    )",
                    'weekly_reports' => "CREATE TABLE IF NOT EXISTS weekly_reports (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        week_start DATE NOT NULL,
                        week_end DATE NOT NULL,
                        title VARCHAR(150) NOT NULL,
                        description TEXT NOT NULL,
                        working_hours DECIMAL(5,2) DEFAULT 0,
                        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )",
                    'report_images' => "CREATE TABLE IF NOT EXISTS report_images (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        report_id INT NOT NULL,
                        file_path VARCHAR(255) NOT NULL,
                        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (report_id) REFERENCES weekly_reports(id) ON DELETE CASCADE
                    )"
                ];

                foreach ($tables as $name => $sql) {
                    if ($setup_conn->query($sql)) {
                        echo '<div class="diagnostic success">✓ Table "$name" created or already exists</div>';
                    } else {
                        echo '<div class="diagnostic error">✗ Failed to create table "$name": ' . $setup_conn->error . '</div>';
                    }
                }

                // Add break_minutes column if missing
                $check_col = $setup_conn->query("SHOW COLUMNS FROM dtr_records LIKE 'break_minutes'");
                if (!$check_col || $check_col->num_rows === 0) {
                    if ($setup_conn->query("ALTER TABLE dtr_records ADD COLUMN break_minutes INT DEFAULT 0 AFTER total_hours")) {
                        echo '<div class="diagnostic success">✓ Added "break_minutes" column to dtr_records</div>';
                    }
                }

                // Add working_hours column if missing
                $check_col = $setup_conn->query("SHOW COLUMNS FROM weekly_reports LIKE 'working_hours'");
                if (!$check_col || $check_col->num_rows === 0) {
                    if ($setup_conn->query("ALTER TABLE weekly_reports ADD COLUMN working_hours DECIMAL(5,2) DEFAULT 0 AFTER description")) {
                        echo '<div class="diagnostic success">✓ Added "working_hours" column to weekly_reports</div>';
                    }
                }

                // Check/insert sample user
                $setup_conn->select_db($mysql_db);
                $user_check = $setup_conn->query("SELECT COUNT(*) as cnt FROM users")->fetch_assoc()['cnt'];
                if ($user_check == 0) {
                    $hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // admin123
                    if ($setup_conn->query("INSERT INTO users (full_name, email, password, school, company, required_hours) VALUES ('Juan dela Cruz', 'juan@email.com', '$hash', 'PLM', 'ABC Corp', 600)")) {
                        echo '<div class="diagnostic success">✓ Sample user created (Email: juan@email.com, Password: admin123)</div>';
                    }
                } else {
                    echo '<div class="diagnostic success">✓ Sample user already exists</div>';
                }

                $setup_conn->close();

                echo '<div class="diagnostic success" style="margin-top: 20px;">';
                echo '<strong>✓ Database Setup Complete!</strong>';
                echo '<p style="margin-top: 10px;">You can now:</p>';
                echo '<ol style="margin-left: 20px; margin-top: 10px;">';
                echo '<li>Login with: <code>juan@email.com</code> / <code>admin123</code></li>';
                echo '<li>Try inserting DTR and report data</li>';
                echo '</ol>';
                echo '</div>';
            }
        }
        ?>
    </div>
</body>
</html>
