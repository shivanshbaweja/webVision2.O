# GGSIPU — Local Reference & Role-Based Portal Replica

This is a local reconstruction of the GGSIPU web portal structure with **in-app dummy link simulation** and **role-based content personalization (Student, Faculty, Admin)** powered by a native Node.js **SQLite database**.

## Key Improvements

1. **Dummy & In-App Navigation (Zero External Redirects)**:
   - External links to `https://www.ipu.ac.in/` are intercepted and simulated locally.
   - Clicking on notices opens an interactive **Notice Reader & Document Preview Modal**.
   - Clicking on quick links opens simulated interactive tools:
     - **Provisional Results & Grade Portal**: Interactive semester marks, SGPA breakdown, and CGPA calculator.
     - **Datesheets & Timetable**: Odd Semester 2026 examination timetable with room allocations.
     - **Admissions 2026–27**: In-app prospectus and counselling guide.
     - **Student Welfare & EWS**: Financial assistance guidelines and grievance form simulation.

2. **Database & Role-Based Access Control**:
   - Built with Node's native `node:sqlite` database (`ipu_portal.sqlite`). No external npm packages required!
   - Pre-seeded with 3 roles and user accounts:
     - **Student**: `student` / `student123` (Aarav Sharma — B.Tech CSE)
     - **Faculty**: `faculty` / `faculty123` (Dr. Sunita Rao — USICT)
     - **Admin**: `admin` / `admin123` (Rajesh Verma — Estate & Administration)
   - Supports self-registration with role selection.

3. **Content Filtering by Role**:
   - **Student View**:
     - Displays personalized **Student Academic Dashboard** with CGPA (8.84), Attendance (89.2%), Fee Clearance, and Upcoming Exams.
     - Notices are strictly filtered: shows exams, datesheets, EWS scholarships, student welfare, and campus cultural talks.
     - Administrative vendor tender notices, staff circulars, and furniture repair rate lists are hidden from students.
   - **Faculty View**:
     - Displays Faculty Dashboard with course allocations, doctoral scholar mentorship tracking, and CIA marks upload tools.
     - Hides student scholarship application circulars and mercy chance lists.
   - **Admin View**:
     - Full operational control with access to campus maintenance SOPs, tender notices, and a **Live Notice Publisher** that writes new notices directly into the SQLite database.
   - **Public / Guest View**:
     - General overview with 1-click demo role switcher pills (`[🎓 Student]`, `[💼 Faculty]`, `[⚙ Admin]`).

## Quick Start

1. Start the server (if not already running):
   ```bash
   node server.js
   ```
2. Open `http://localhost:3000` in your browser.
3. Use the top **Quick Switch** pills or click **Portal Login** to test roles.

## Pre-configured Demo Accounts

| Role | Username | Password | Profile |
|---|---|---|---|
| **Student** | `student` | `student123` | Aarav Sharma (B.Tech CSE - 4th Sem) |
| **Faculty** | `faculty` | `faculty123` | Dr. Sunita Rao (Associate Professor - USICT) |
| **Admin** | `admin` | `admin123` | Rajesh Verma (Estate & General Administration) |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and mode check |
| `GET` | `/api/auth/me` | Current authenticated user session |
| `POST` | `/api/auth/login` | Login with username and password |
| `POST` | `/api/auth/register` | Register new account with role |
| `POST` | `/api/auth/logout` | Invalidate current session |
| `GET` | `/api/site-sections?role=student` | Navigation groups filtered by role |
| `GET` | `/api/quick-links?role=student` | Quick access cards filtered by role |
| `GET` | `/api/notices?role=student` | Notices filtered by student relevance |
| `GET` | `/api/notices/:id` | Detailed notice with circular reference |
| `POST` | `/api/notices` | Admin publish notice to SQLite database |
| `GET` | `/api/student/academic-record` | Student marks, SGPA, attendance and exams |
