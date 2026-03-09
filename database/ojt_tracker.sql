CREATE DATABASE IF NOT EXISTS ojt_tracker;
USE ojt_tracker;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  school VARCHAR(100),
  company VARCHAR(100),
  required_hours INT DEFAULT 600,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DTR Records
CREATE TABLE dtr_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  total_hours DECIMAL(4,2),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dtr (user_id, date)  -- prevents duplicate time-in per day
);

-- Weekly Reports
CREATE TABLE weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Report Images
CREATE TABLE report_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES weekly_reports(id) ON DELETE CASCADE
);

-- Sample user (password: admin123)
INSERT INTO users (full_name, email, password, school, company, required_hours)
VALUES ('Juan dela Cruz', 'juan@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PLM', 'ABC Corp', 600);