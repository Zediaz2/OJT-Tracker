# OJT Tracker — Student Internship Monitoring System

A web-based system for OJT (On-the-Job Training) students to track daily attendance, submit weekly journal reports, and monitor internship progress. Built with plain HTML, CSS, JavaScript, PHP, and MySQL — designed to run locally on XAMPP.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [Setup & Installation](#setup--installation)
7. [Default Login Credentials](#default-login-credentials)
8. [API Endpoints](#api-endpoints)
9. [File Upload Configuration](#file-upload-configuration)
10. [PDF Export](#pdf-export)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

OJT Tracker is a lightweight, locally-hosted internship monitoring system intended for students undergoing their On-the-Job Training. It provides a structured way to log daily attendance, write weekly journal entries, attach documentation images, and track overall progress toward the required internship hours.

The system is built to be simple, beginner-friendly, and easy to expand for future development.

---

## Features

### Authentication
- Secure login with bcrypt password hashing
- Session-based authentication via PHP
- Registration for new student accounts
- Protected pages — redirects to login if not authenticated

### Daily Time Record (DTR)
- One-click Time In and Time Out with live clock display
- Automatic total hours calculation per day
- Prevents duplicate Time In entries for the same date
- Manual entry form for adding past attendance records
- Full attendance history table with status indicators

### Weekly Reports
- Submit weekly journal entries with title and description
- Upload multiple documentation images per report (JPG, PNG, WEBP)
- Image preview before submission
- Lightbox viewer for uploaded images
- Export all reports to PDF via browser print dialog

### Dashboard
- Overview of company, hours rendered, required hours, and reports submitted
- Visual progress bar showing completion percentage toward required OJT hours
- Recent attendance table (last 5 records)
- Settings page to configure company name and required hours

---

## Technology Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend  | PHP 7.4+            |
| Database | MySQL 5.7+ / MariaDB |
| Server   | Apache (via XAMPP)  |
| Storage  | Local filesystem (uploaded images) |

---

## Project Structure

```
OJT-Tracker/
│
├── frontend/
│   ├── index.html            # Login & Register page
│   ├── dashboard.html        # Main dashboard
│   ├── dtr.html              # Daily Time Record
│   ├── reports.html          # Weekly Reports
│   ├── settings.html         # User settings
│   ├── uploads/              # Uploaded report images (auto-created)
│   │
│   ├── css/
│   │   └── style.css         # Global stylesheet
│   │
│   └── js/
│       ├── auth.js           # Authentication, API base URL, shared utilities
│       ├── dtr.js            # DTR page logic
│       └── reports.js        # Reports page logic
│
├── backend/
│   ├── config/
│   │   └── db.php            # Database connection & CORS headers
│   │
│   ├── auth/
│   │   ├── login.php         # POST — authenticate user
│   │   ├── logout.php        # GET  — destroy session
│   │   └── register.php      # POST — create new account
│   │
│   ├── dtr/
│   │   ├── time_in.php       # POST — record time in
│   │   ├── time_out.php      # POST — record time out & compute hours
│   │   ├── manual_entry.php  # POST — add a past DTR record
│   │   └── get_records.php   # GET  — fetch all DTR records for a user
│   │
│   └── reports/
│       ├── create_report.php # POST — create a new weekly report
│       ├── get_reports.php   # GET  — fetch all reports with images
│       └── upload_image.php  # POST — upload images for a report
│
└── database/
    └── ojt_tracker.sql       # Full database schema + sample user
```

---

## Database Schema

The system uses four tables:

### `users`
Stores student account information.

| Column | Type | Description |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary key |
| full_name | VARCHAR(100) | Student's full name |
| email | VARCHAR(100) UNIQUE | Login email |
| password | VARCHAR(255) | Bcrypt hashed password |
| school | VARCHAR(100) | School name |
| company | VARCHAR(100) | Internship company |
| required_hours | INT | Total hours required (default 600) |
| created_at | TIMESTAMP | Account creation date |

### `dtr_records`
Stores daily attendance entries.

| Column | Type | Description |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT | Foreign key → users.id |
| date | DATE | Attendance date |
| time_in | TIME | Time in |
| time_out | TIME | Time out |
| total_hours | DECIMAL(4,2) | Auto-calculated hours |

> Unique constraint on `(user_id, date)` prevents duplicate entries per day.

### `weekly_reports`
Stores weekly journal submissions.

| Column | Type | Description |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary key |
| user_id | INT | Foreign key → users.id |
| week_start | DATE | Start of the week covered |
| week_end | DATE | End of the week covered |
| title | VARCHAR(150) | Report title |
| description | TEXT | Activities and accomplishments |
| submitted_at | TIMESTAMP | Submission timestamp |

### `report_images`
Stores file paths for uploaded report images.

| Column | Type | Description |
|---|---|---|
| id | INT AUTO_INCREMENT | Primary key |
| report_id | INT | Foreign key → weekly_reports.id |
| file_path | VARCHAR(255) | Relative path to the image file |
| uploaded_at | TIMESTAMP | Upload timestamp |

---

## Setup & Installation

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) installed (Apache + MySQL)
- A modern web browser (Chrome, Edge, Firefox)

---

### Step 1 — Place Files

Copy the entire `OJT-Tracker` folder into your XAMPP `htdocs` directory:

```
C:/xampp/htdocs/OJT-Tracker/
```

---

### Step 2 — Start XAMPP

Open the XAMPP Control Panel and start both:
- **Apache**
- **MySQL**

---

### Step 3 — Import the Database

1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click **New** in the left sidebar
3. Create a database named: `ojt_tracker`
4. Select the new database, then click the **Import** tab
5. Choose the file: `OJT-Tracker/database/ojt_tracker.sql`
6. Click **Go**

---

### Step 4 — Verify the API URL

Open `frontend/js/auth.js` and confirm the API base URL is correct:

```javascript
const API = 'http://localhost/OJT-Tracker/backend';
```

> If your XAMPP uses a different port (e.g., 8080), update this to:
> `http://localhost:8080/OJT-Tracker/backend`

---

### Step 5 — Open the Application

Navigate to the following URL in your browser:

```
http://localhost/OJT-Tracker/frontend/index.html
```

> **Important:** Always access the app through `http://localhost/...` and not through VS Code Live Server or by opening the file directly. PHP only runs through Apache.

---

## Default Login Credentials

A sample student account is included in the database:

| Field | Value |
|---|---|
| Email | juan@email.com |
| Password | admin123 |

You can register additional accounts directly from the login page.

---

## API Endpoints

All endpoints are located under `/OJT-Tracker/backend/`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login.php` | Authenticate a user |
| POST | `/auth/register.php` | Register a new student account |
| GET | `/auth/logout.php` | Destroy the current session |

### Daily Time Record

| Method | Endpoint | Description |
|---|---|---|
| POST | `/dtr/time_in.php` | Record today's time in |
| POST | `/dtr/time_out.php` | Record today's time out |
| POST | `/dtr/manual_entry.php` | Add a past attendance record |
| GET | `/dtr/get_records.php?user_id=` | Get all DTR records for a user |

### Weekly Reports

| Method | Endpoint | Description |
|---|---|---|
| POST | `/reports/create_report.php` | Create a new weekly report |
| GET | `/reports/get_reports.php?user_id=` | Get all reports with image paths |
| POST | `/reports/upload_image.php` | Upload images for a report |

---

## File Upload Configuration

Uploaded images are saved to:

```
frontend/uploads/
```

The folder is created automatically when the first image is uploaded. Allowed file formats are **JPG**, **PNG**, and **WEBP**.

If images are not saving, check that Apache has write permissions to the `frontend/uploads/` folder.

---

## PDF Export

On the Weekly Reports page, an **Export PDF** button appears once at least one report has been submitted. Clicking it opens the browser's print dialog pre-filled with a formatted version of all your reports.

To save as PDF:
1. In the print dialog, set **Destination** to **Save as PDF**
2. Click **Save**

The PDF includes the student's name, all report entries with dates and descriptions, attachment counts, and a generation timestamp.

---

## Troubleshooting

**Login says "Invalid credentials"**
- Make sure the database was imported correctly
- Regenerate the password hash by creating a file at `C:/xampp/htdocs/gen_hash.php` with `<?php echo password_hash('yourpassword', PASSWORD_BCRYPT); ?>`, visiting `http://localhost/gen_hash.php`, and updating the `users` table in phpMyAdmin

**405 Method Not Allowed**
- You are accessing the app through VS Code Live Server — use `http://localhost/OJT-Tracker/frontend/index.html` instead

**API calls failing / CORS errors**
- Confirm Apache is running in XAMPP
- Confirm the `API` variable in `auth.js` points to `http://localhost/OJT-Tracker/backend`

**Images not displaying after upload**
- Check that the `frontend/uploads/` folder exists and is writable
- Confirm the image path in the database starts with `uploads/` and not an absolute path

**Database connection failed**
- Verify that MySQL is running in XAMPP
- Check `backend/config/db.php` — the default credentials are `root` with an empty password, which is standard for XAMPP

---

## License

This project is intended for educational and personal use as a student internship monitoring tool.
