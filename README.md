# OJT Tracker — Internship Monitoring System

A locally-hosted web application for tracking OJT (On-the-Job Training) attendance and weekly journal reports. Built with vanilla HTML/CSS/JavaScript on the frontend and PHP + MySQL (XAMPP) on the backend.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Installation](#installation)
- [Features](#features)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Daily Time Record (DTR)](#daily-time-record-dtr)
  - [Weekly Reports & Journal Export](#weekly-reports--journal-export)
  - [Settings](#settings)
- [Migration Scripts](#migration-scripts)
- [Default Credentials](#default-credentials)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript     |
| Backend    | PHP 8+                              |
| Database   | MySQL via XAMPP (MariaDB)           |
| Server     | Apache (XAMPP)                      |
| Fonts      | Plus Jakarta Sans (Google Fonts)    |

---

## Project Structure

```
OJT-Tracker/
│
├── frontend/
│   ├── index.html              # Login page
│   ├── dashboard.html          # Overview & progress stats
│   ├── dtr.html                # Daily Time Record
│   ├── reports.html            # Weekly Reports & Journal
│   ├── settings.html           # User configuration & journal profile
│   │
│   ├── css/
│   │   └── style.css           # Global styles, components, animations
│   │
│   ├── js/
│   │   ├── auth.js             # Auth helpers, API base URL, showAlert()
│   │   ├── dtr.js              # DTR clock, time in/out, break modal, table
│   │   └── reports.js          # Reports CRUD, edit/delete modals, PDF export
│   │
│   └── uploads/                # User-uploaded documentation images
│
└── backend/
    ├── config/
    │   └── db.php              # MySQL connection, CORS & JSON headers
    │
    ├── auth/
    │   ├── login.php
    │   ├── register.php
    │   └── logout.php
    │
    ├── dtr/
    │   ├── time_in.php
    │   ├── time_out.php        # Accepts break_minutes, computes net hours
    │   ├── manual_entry.php    # Past-date entry with break deduction
    │   ├── get_records.php
    │   ├── update_record.php   # Edit existing DTR record
    │   └── delete_record.php   # Delete DTR record (ownership-verified)
    │
    └── reports/
        ├── create_report.php   # Accepts working_hours field
        ├── get_reports.php
        ├── upload_image.php
        ├── update_report.php   # Edit report + remove images
        └── delete_report.php   # Delete report + physical image files
```

---

## Database Setup

### 1. Fresh Install

Import `ojt_tracker.sql` into phpMyAdmin:

1. Open **phpMyAdmin** → click **Import**
2. Select `ojt_tracker.sql` → click **Go**

This creates the `ojt_tracker` database with all tables and a sample user.

### Schema

```sql
-- Users
CREATE TABLE users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(100) UNIQUE NOT NULL,
  password       VARCHAR(255) NOT NULL,
  school         VARCHAR(100),
  company        VARCHAR(100),
  required_hours INT DEFAULT 600,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DTR Records
CREATE TABLE dtr_records (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  date          DATE NOT NULL,
  time_in       TIME,
  time_out      TIME,
  break_minutes INT DEFAULT 0,
  total_hours   DECIMAL(5,2),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dtr (user_id, date)
);

-- Weekly Reports
CREATE TABLE weekly_reports (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  week_start    DATE NOT NULL,
  week_end      DATE NOT NULL,
  title         VARCHAR(150) NOT NULL,
  description   TEXT NOT NULL,
  working_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Report Images
CREATE TABLE report_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  report_id   INT NOT NULL,
  file_path   VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES weekly_reports(id) ON DELETE CASCADE
);
```

### 2. Existing Database Migrations

If you already have the database from a previous version, run these migration scripts in order via **phpMyAdmin → ojt_tracker → SQL tab**:

```sql
-- Migration 1: Add break_minutes to DTR records
ALTER TABLE dtr_records
ADD COLUMN break_minutes INT DEFAULT 0 AFTER time_out,
MODIFY COLUMN total_hours DECIMAL(5,2);

-- Migration 2: Add working_hours to weekly reports
ALTER TABLE weekly_reports
ADD COLUMN working_hours DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER week_end;
```

---

## Installation

1. **Install XAMPP** and start **Apache** and **MySQL**
2. **Clone / copy** the project folder into `C:/xampp/htdocs/OJT-Tracker/`
3. **Import the database** (see Database Setup above)
4. **Open your browser** and navigate to:
   ```
   http://localhost/OJT-Tracker/frontend/index.html
   ```

> Make sure `frontend/uploads/` exists and is writable by Apache. XAMPP handles this automatically on Windows.

---

## Features

### Authentication

- Login and registration with bcrypt-hashed passwords
- Session stored in `localStorage` as a JSON user object
- All protected pages redirect to login if no session is found
- `auth.js` provides `getUser()`, `logoutUser()`, and `showAlert()` shared across all pages

---

### Dashboard

- Displays total hours logged, remaining hours, and completion percentage
- Animated progress bar with shimmer effect
- Stat cards for days attended, total reports, and OJT completion status

---

### Daily Time Record (DTR)

#### Live Clock
- Displays current time in **12-hour format** (e.g. `8:23:45 AM`) with a blinking colon separator
- Shows full date (e.g. `Wednesday, March 11, 2026`)

#### Time In / Time Out
- One-click Time In and Time Out buttons
- Time Out opens a **Break Duration Modal** to deduct break time before saving
- Break presets: 0 min, 15 min, 30 min, 60 min, or custom input (0–480 min)
- Net hours formula: `(time_out − time_in) − break_minutes`
- Success alerts display times in **12-hour format**

#### Attendance History Table
- Columns: `#`, `Date`, `Time In`, `Time Out`, `Break`, `Net Hours`, `Status`, `Actions`
- Time In and Time Out displayed in **12-hour format** (e.g. `8:00 AM`, `5:01 PM`)
- Status badge: **Complete** (green) or **In Progress** (yellow)

#### Manual Entry
- Add past attendance records with date, time in, time out, and optional break minutes
- Validates that time out is after time in

#### Edit Record
- Pre-fills all fields in a slide-in modal
- Re-calculates net hours on save

#### Delete Record
- Confirmation modal with record date displayed
- Ownership-verified before deletion

---

### Weekly Reports & Journal Export

#### Submit Report
- Fields: Week Start, Week End, Report Title, Number of Working Hours, Weekly Accomplishments
- Optional documentation image attachments (JPG, PNG, WEBP — multiple files)
- Images stored in `frontend/uploads/` with unique filenames

#### Report Cards
- Each report card shows title, week range, description, attached images, and submission date
- Action buttons per card: **Export PDF**, **Edit**, **Delete**
- **Export All** button in the page header exports every report at once

#### Edit Report
- Slide-in modal pre-fills all fields including working hours
- Existing images displayed as thumbnails — click **✕** to mark for removal on save (click **↩** to undo)
- Separate file input for adding new images
- Ownership verified on backend before any update

#### Delete Report
- Confirmation modal shows report title
- Permanently removes the database record, `report_images` rows, and physical image files from `uploads/`
- Ownership verified before deletion

#### STI Weekly Journal PDF Export

Exports a print-ready PDF that matches the **FT-CRD-167-00 Weekly Journal Template** layout:

| Section | Content |
|---|---|
| Header | Uploaded logo (left) + Template title (right), separated by a bold border |
| Info Table | Last Name / First Name / MI, STI Campus, Program / Year Level / Section, Host Company / Department, Schedule / Number of Working Hours |
| Documentation | Uploaded photos displayed in a flex grid below the info table |
| Accomplishments | Bordered text box, grows to fill available vertical space |
| Signature | "Reviewed by:" with signature line + supervisor name; "Date" with signature line |
| Footer | `FT-CRD-167-00 | Weekly Journal Template | Page X of Y` + submission date |

- Opens in a **new browser tab** with a Print / Save as PDF toolbar
- Print output targets **A4 portrait** paper with clean margins
- Logo and all profile data are pulled automatically from Settings

---

### Settings

#### OJT Configuration
| Field | Description |
|---|---|
| Company / Organization | Host company name |
| Department Assigned To | Specific team or department |
| Required OJT Hours | Total hours required (used for dashboard progress) |

#### Weekly Journal Profile
All fields auto-fill the PDF export template — set once, used forever.

| Field | Description |
|---|---|
| School / Organization Logo | Upload JPG/PNG/WEBP — stored as Base64 in `localStorage`, appears in PDF header |
| Campus / School Name | Displayed in the STI Campus row |
| Program | e.g. BSIT |
| Year Level | e.g. 4th Year |
| Section | e.g. IT401 |
| Middle Initial | e.g. G. |
| OJT Supervisor Name | Printed below the signature line |
| Journal Template Title | Overrides the header title (default: `WEEKLY JOURNAL TEMPLATE`) |

> All settings are saved to `localStorage` — no backend required.

---

## Migration Scripts

Standalone SQL files for updating an existing database:

| File | Purpose |
|---|---|
| `add_working_hours.sql` | Adds `working_hours` column to `weekly_reports` |

Run via phpMyAdmin → select `ojt_tracker` database → SQL tab → paste and execute.

---

## Default Credentials

| Field    | Value             |
|----------|-------------------|
| Email    | `juan@email.com`  |
| Password | `admin123`        |

> Change these immediately after first login in a production environment.

---

## API Base URL

Defined once in `frontend/js/auth.js`:

```js
const API = 'http://localhost/OJT-Tracker/backend';
```

All pages import `auth.js` first and reference `API` for every `fetch()` call.