-- ============================
-- Users Table
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    school TEXT,
    company TEXT,
    required_hours INTEGER DEFAULT 600,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- DTR Records Table
-- ============================
CREATE TABLE IF NOT EXISTS dtr_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    total_hours REAL,
    break_minutes INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, date)
);

-- ============================
-- Weekly Reports Table
-- ============================
CREATE TABLE IF NOT EXISTS weekly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    working_hours REAL NOT NULL DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- Report Images Table
-- ============================
CREATE TABLE IF NOT EXISTS report_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES weekly_reports(id) ON DELETE CASCADE
);

-- ============================
-- Sample User
-- Password is hashed (admin123)
-- ============================
INSERT OR IGNORE INTO users (id, full_name, email, password, school, company, required_hours)
VALUES (1, 'Juan dela Cruz', 
        'juan@email.com', 
        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
        'PLM', 
        'ABC Corp', 
        600);