<?php
/**
 * Database Setup & Verification Script — SQLite
 * Called automatically by db.php when the database is first created.
 * Can also be run manually: php setup_database.php
 */

// If called directly (not via require from db.php), set up the connection
if (!isset($pdo)) {
    $dbPath = __DIR__ . '/../database/ojt_tracker.db';
    $dbDir = dirname($dbPath);
    if (!is_dir($dbDir)) mkdir($dbDir, 0755, true);

    try {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec('PRAGMA journal_mode=WAL');
        $pdo->exec('PRAGMA foreign_keys=ON');
    } catch (PDOException $e) {
        die(json_encode(['status' => 'error', 'message' => 'SQLite connection failed: ' . $e->getMessage()]));
    }
    $standalone = true;
} else {
    $standalone = false;
}

$tables_created = [];
$tables_failed = [];

// ── Users table ──────────────────────────────────────────
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        school TEXT,
        company TEXT,
        required_hours INTEGER DEFAULT 600,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    $tables_created[] = 'users';
} catch (PDOException $e) {
    $tables_failed[] = ['table' => 'users', 'error' => $e->getMessage()];
}

// ── DTR Records table ────────────────────────────────────
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS dtr_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time_in TEXT,
        time_out TEXT,
        total_hours REAL,
        break_minutes INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
    )");
    $tables_created[] = 'dtr_records';
} catch (PDOException $e) {
    $tables_failed[] = ['table' => 'dtr_records', 'error' => $e->getMessage()];
}

// ── Weekly Reports table ─────────────────────────────────
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS weekly_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        week_start TEXT NOT NULL,
        week_end TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        working_hours REAL DEFAULT 0,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $tables_created[] = 'weekly_reports';
} catch (PDOException $e) {
    $tables_failed[] = ['table' => 'weekly_reports', 'error' => $e->getMessage()];
}

// ── Report Images table ──────────────────────────────────
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS report_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES weekly_reports(id) ON DELETE CASCADE
    )");
    $tables_created[] = 'report_images';
} catch (PDOException $e) {
    $tables_failed[] = ['table' => 'report_images', 'error' => $e->getMessage()];
}

// ── Seed sample user if empty ────────────────────────────
$count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
if ($count == 0) {
    // Password: admin123
    $hash = password_hash('admin123', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password, school, company, required_hours) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute(['Juan dela Cruz', 'juan@email.com', $hash, 'PLM', 'ABC Corp', 600]);
}

// If run standalone, output results
if (isset($standalone) && $standalone) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => empty($tables_failed) ? 'success' : 'partial',
        'message' => 'Database setup completed.',
        'tables_created' => $tables_created,
        'tables_failed' => $tables_failed,
    ]);
}
?>
