# Smart Schedule Generator 📅

> **An automated, constraint-based timetable generation and management desktop system tailored for Philippine Department of Education (DepEd) secondary schools.**

[![Electron](https://img.shields.io/badge/Platform-Electron%20Desktop-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Overview

**Smart Schedule Generator** is an offline, standalone desktop application developed as an academic research project to solve the complex, time-consuming challenge of high school class and faculty scheduling.

Tested with real-world school data from **ICT High School of Eastern Biliran (DepEd Region VIII)**, the system automates timetable construction while strictly adhering to DepEd curriculum requirements, teacher specializations, room capacities, and weekly instructional time allocations.

---

## ✨ Key Features

### 1. ⚙️ Automated Constraint-Based Scheduling Engine
* **Curriculum Compliance**: Strictly enforces weekly instructional time (`minutesPerWeek`) per learning area according to DepEd guidelines.
* **Teacher Pool Matching**: Assigns qualified teachers based on subject specializations and prevents instructor overload.
* **Smart Distribution**: Evenly distributes subject meetings across weekdays (Monday–Friday) instead of clustering.
* **Dedicated Room Allocation**: Automatically pairs sections with dedicated classrooms to avoid room congestion.

### 2. 🛡️ Conflict Detection & In-Place Resolution
* **Zero Hard Overlaps**: Instantly flags:
  * Teacher double-bookings (same teacher in two places at once).
  * Room double-bookings (two sections in the same room).
  * Section double-bookings (one class having two subjects simultaneously).
* **Automated Conflict Solver**: Shifts, swaps, and re-allocates contentious periods without dropping classes.

### 3. 📂 DepEd Excel (.xlsx) Spreadsheet Ingestion
* Directly uploads and parses official DepEd multi-column *Teacher's Program* and *Class Program* spreadsheets.
* Automatically extracts and registers teachers, sections, subjects, classrooms, and timetable periods into the local database in a single atomic transaction.

### 4. 📊 Research KPI Analytics Dashboard
Provides objective metrics to measure schedule quality for research evaluation:
* **Schedule Fill Rate**: Percentage of required section periods successfully assigned.
* **Subject Hours Compliance**: Tracks whether subjects fulfill their weekly target minutes.
* **Teacher Load Balance**: Visualizes faculty workload distribution against standard teaching load limits (DepEd max 1,800 mins/week).
* **Schedule Integrity Index**: Real-time count of active conflicts.

### 5. 🖨️ Master Matrix & Print-Ready Programs
* **Interactive Master Matrix**: High-density bento grid with eye-safe hover highlighting (instantly focuses all matching sections, teachers, or rooms).
* **Individual Programs**: Filterable, clean views for individual **Teacher's Programs** and **Class/Section Programs**.
* **Print & PDF Export**: Clean, print-friendly outputs ready for official administrative submission and classroom posting.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Desktop Shell** | [Electron](https://www.electronjs.org/) | Native desktop window, OS integration, offline execution |
| **User Interface** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Type-safe, reactive component architecture |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Modern responsive interface with Dark / Light theme support |
| **Database** | [SQLite 3](https://www.sqlite.org/) (`sqlite3`) | Embedded, serverless, relational persistence with zero external setup |
| **Spreadsheet Engine** | [SheetJS (xlsx)](https://sheetjs.com/) | Reading and parsing multi-format DepEd spreadsheets |
| **Analytics & Icons** | [Recharts](https://recharts.org/) & [Lucide React](https://lucide.dev/) | Dashboard data visualizations and UI iconography |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (Version 18.x, 20.x, or newer)
* [npm](https://www.npmjs.com/) (bundled with Node.js)
* Windows OS (7 / 10 / 11)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Javerdomaraya/smart-schedule-generator.git
   cd smart-schedule-generator
