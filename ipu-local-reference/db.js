const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'ipu_portal.sqlite');
const db = new DatabaseSync(DB_PATH);

// Helper for hashing
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verify === hash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Initialize tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      enrollment_or_id TEXT,
      department_or_program TEXT,
      details_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      is_new INTEGER DEFAULT 0,
      content TEXT,
      circular_no TEXT,
      attachment_name TEXT,
      views_count INTEGER DEFAULT 120
    );

    CREATE TABLE IF NOT EXISTS quick_links (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      tone TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      action_type TEXT NOT NULL,
      badge TEXT
    );

    CREATE TABLE IF NOT EXISTS site_sections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS section_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id TEXT NOT NULL,
      label TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      description TEXT,
      display_order INTEGER NOT NULL,
      FOREIGN KEY (section_id) REFERENCES site_sections(id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function seedData() {
  // Check if users already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, salt, role, name, email, enrollment_or_id, department_or_program, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Student
    const studentPass = hashPassword('student123');
    insertUser.run(
      'student',
      studentPass.hash,
      studentPass.salt,
      'student',
      'Aarav Sharma',
      'aarav.sharma@ipu.ac.in',
      '04216403223',
      'B.Tech CSE - 4th Semester',
      JSON.stringify({
        cgpa: '8.84',
        attendance: '89%',
        semester: '4th Sem (Odd)',
        feeStatus: 'Paid / No Dues',
        admitCardStatus: 'Released (Seat: E-204)',
        advisor: 'Dr. Sunita Rao'
      })
    );

    // Faculty
    const facultyPass = hashPassword('faculty123');
    insertUser.run(
      'faculty',
      facultyPass.hash,
      facultyPass.salt,
      'faculty',
      'Dr. Sunita Rao',
      'sunita.rao@ipu.ac.in',
      'FAC-2015-88',
      'USICT - Dept of Computer Science & Engineering',
      JSON.stringify({
        designation: 'Associate Professor',
        batchesTeaching: 3,
        phdScholars: 4,
        pendingGrades: 1,
        cabin: 'Block B, Room 312'
      })
    );

    // Admin
    const adminPass = hashPassword('admin123');
    insertUser.run(
      'admin',
      adminPass.hash,
      adminPass.salt,
      'admin',
      'Rajesh Verma',
      'rajesh.verma@ipu.ac.in',
      'ADM-1044',
      'Estate & General Administration Branch',
      JSON.stringify({
        designation: 'Assistant Registrar (Administration)',
        office: 'Main Administrative Block, Dwarka Campus',
        systemAccess: 'Full University Portal Control'
      })
    );
  }

  // Seed Notices
  const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get().count;
  if (noticeCount === 0) {
    const insertNotice = db.prepare(`
      INSERT INTO notices (id, title, date, category, source, target_role, is_new, content, circular_no, attachment_name, views_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialNotices = [
      // Student notices
      {
        id: 'ews-financial-assistance-2026-27',
        title: 'Inviting applications for financial assistance to students under the EWS Scheme for Academic Year 2026–27',
        date: '29 Oct 2026',
        category: 'Scholarships',
        source: 'Directorate of Students’ Welfare',
        target_role: 'student',
        is_new: 1,
        content: 'Directorate of Students Welfare invites applications from economically weaker students of USS & affiliated colleges. Eligible students whose family annual income is under ₹2,50,000 can submit certified income proof and bank details by 20 November 2026.',
        circular_no: 'GGSIPU/DSW/EWS/2026/891',
        attachment_name: 'EWS_Financial_Assistance_Application_2026.pdf',
        views_count: 542
      },
      {
        id: 'mercy-chance-2026-10-29',
        title: 'Grant of Mercy Chance to students admitted under Ordinance 10, 11 and 25 for End-Term Examination',
        date: '29 Oct 2026',
        category: 'Examinations',
        source: 'Office of Controller of Examinations',
        target_role: 'student',
        is_new: 1,
        content: 'The Competent Authority has approved grant of Mercy Chance for eligible students of various programmes who have exhausted their maximum permissible duration to clear remaining backlogs. Online registration starts on 2 November 2026.',
        circular_no: 'GGSIPU/COE/EXAM/2026/1102',
        attachment_name: 'Mercy_Chance_Schedule_and_Fees.pdf',
        views_count: 910
      },
      {
        id: 'datesheet-odd-sem-2026',
        title: 'Proposed Theory & Practical Examination Datesheet for Odd Semester 2026–27 (USS & Affiliated Colleges)',
        date: '28 Oct 2026',
        category: 'Examinations',
        source: 'Conduct Branch, Examination Division',
        target_role: 'student',
        is_new: 1,
        content: 'Final datesheet for regular & reappear students of B.Tech, MCA, MBA, BBA, LLB and other professional courses. Students are advised to verify course codes and report any scheduling clash to examconduct@ipu.ac.in by 7 November 2026.',
        circular_no: 'GGSIPU/EXAM/CONDUCT/2026/304',
        attachment_name: 'Proposed_Datesheet_OddSem_2026.pdf',
        views_count: 1420
      },
      {
        id: 'tie-talks-2026-10-29',
        title: 'TiE Talks – Alumni Entrepreneurial Talk Series on 10 November 2026 at Main Auditorium',
        date: '29 Oct 2026',
        category: 'Events',
        source: 'University Placement & Entrepreneurship Cell',
        target_role: 'student',
        is_new: 0,
        content: 'Join prominent alumni startup founders as they share their journey in venture building, product engineering, and fundraising. Open for all university students. Free registration and participation certificates provided.',
        circular_no: 'GGSIPU/UIRC/TIE/2026/55',
        attachment_name: 'TiE_Talks_Schedule_and_Speakers.pdf',
        views_count: 380
      },
      {
        id: 'hostel-mess-fee-schedule-2026',
        title: 'Hostel Re-allotment & Mess Advance Payment Schedule for Dwarka & East Delhi Campuses',
        date: '27 Oct 2026',
        category: 'Campus',
        source: 'Office of Chief Warden',
        target_role: 'student',
        is_new: 0,
        content: 'Hostel residents must pay their second installment of mess advance via the student portal before 15 November 2026 to avoid late surcharge. Check the hostel notice board for allocated room updates.',
        circular_no: 'GGSIPU/HOSTEL/CW/2026/78',
        attachment_name: 'Hostel_Mess_Fee_Circular_2026.pdf',
        views_count: 420
      },

      // Faculty notices
      {
        id: 'phd-oral-exam-2026-10-30',
        title: 'Oral Examination / Evaluation of Ph.D. thesis in Computer Science & Engineering',
        date: '30 Oct 2026',
        category: 'Research',
        source: 'Research & Consultancy Branch',
        target_role: 'faculty',
        is_new: 1,
        content: 'The Ph.D. viva-voce examination of research scholar Mr. Anirban Ghosh (Enrollment: 01216490019) on Deep Learning in Medical Imaging will be conducted on 5 November 2026 in Hybrid Mode. All DRC and SRC faculty members are requested to attend.',
        circular_no: 'GGSIPU/DRC/CSE/VIVA/2026/41',
        attachment_name: 'PhD_Viva_Notice_Ghosh.pdf',
        views_count: 290
      },
      {
        id: 'fdp-high-perf-computing-2026',
        title: 'One-Week National Faculty Development Programme on Parallel Computing & Large AI Models',
        date: '28 Oct 2026',
        category: 'Academic',
        source: 'University School of ICT (USICT)',
        target_role: 'faculty',
        is_new: 1,
        content: 'USICT invites faculty nominations for the DST-SERB sponsored FDP starting from 24 November 2026. Hands-on labs on GPU cluster programming and distributed training will be conducted. Faculty participants will receive certificates.',
        circular_no: 'GGSIPU/USICT/FDP/2026/19',
        attachment_name: 'FDP_Brochure_and_Registration.pdf',
        views_count: 310
      },
      {
        id: 'cia-marks-submission-portal',
        title: 'Opening of Examination Portal for Uploading Continuous Internal Assessment (CIA) & Practical Marks',
        date: '26 Oct 2026',
        category: 'Examinations',
        source: 'Controller of Examinations',
        target_role: 'faculty',
        is_new: 0,
        content: 'All Deans of USS and Directors of Affiliated Institutes are requested to ensure that internal assessment marks and attendance records are uploaded through the faculty portal login no later than 25 November 2026.',
        circular_no: 'GGSIPU/COE/MARKS/2026/89',
        attachment_name: 'Internal_Marks_Upload_Instructions.pdf',
        views_count: 670
      },

      // Admin / Staff notices
      {
        id: 'sop-repair-2026-10-30',
        title: 'Approved SOPs and Schedule of Work containing Rates for specified repair & maintenance of furniture items at Dwarka Campus',
        date: '30 Oct 2026',
        category: 'Administration',
        source: 'Estate & General Administration Branch',
        target_role: 'admin',
        is_new: 1,
        content: 'Standard operating procedures and approved item rates for annual repair, polish, and upkeep of furniture across academic blocks, administrative wings, and lecture theatres. Branch officers must route repair requisition forms through the Estate Branch portal.',
        circular_no: 'GGSIPU/GA/ESTATE/SOP/2026/72',
        attachment_name: 'SOP_Furniture_Repair_Schedule_2026.pdf',
        views_count: 180
      },
      {
        id: 'annual-tender-it-network-2026',
        title: 'Notice Inviting E-Tender for Comprehensive AMC of Campus Networking & Core Switches at Dwarka & Surajmal Vihar',
        date: '28 Oct 2026',
        category: 'Tenders',
        source: 'University Purchase & Store Division',
        target_role: 'admin',
        is_new: 1,
        content: 'Two-bid e-tenders are invited from certified OEM partners for comprehensive maintenance of campus fiber backbone, distribution switches, and Wi-Fi access controllers. Pre-bid conference scheduled for 8 November 2026.',
        circular_no: 'GGSIPU/PUR/AMC/NET/2026/14',
        attachment_name: 'Tender_Document_Campus_Networking_2026.pdf',
        views_count: 220
      },

      // Common notices visible to ALL
      {
        id: 'power-interruption-2026-10-30',
        title: 'Notice regarding a short period of interruption of power supply at Dwarka Campus on 30 October 2026',
        date: '30 Oct 2026',
        category: 'Campus',
        source: 'University Works Division (UWD)',
        target_role: 'all',
        is_new: 1,
        content: 'Due to mandatory maintenance of 11kV substation and transformer bank at Dwarka Campus, power supply will remain intermittently restricted between 14:00 hrs and 17:00 hrs on 30 October 2026. Backup generators will support core computer laboratories.',
        circular_no: 'GGSIPU/UWD/ELEC/2026/66',
        attachment_name: 'Power_Interruption_Advisory.pdf',
        views_count: 890
      },
      {
        id: 'guest-lecture-2026-10-29',
        title: 'Distinguished Guest Lecture by Mr. Abhishek Bhargava, Notable Alumnus of USCT on Green Chemical Engineering',
        date: '29 Oct 2026',
        category: 'Events',
        source: 'University School of Chemical Technology',
        target_role: 'all',
        is_new: 0,
        content: 'USCT invites all faculty, researchers, and students to attend the lecture on sustainable chemical manufacturing and decarbonization pathways on 4 November 2026 at C-Block Seminar Hall.',
        circular_no: 'GGSIPU/USCT/LECTURE/2026/12',
        attachment_name: 'Lecture_Brochure_Bhargava.pdf',
        views_count: 410
      }
    ];

    for (const n of initialNotices) {
      insertNotice.run(
        n.id, n.title, n.date, n.category, n.source, n.target_role,
        n.is_new, n.content, n.circular_no, n.attachment_name, n.views_count
      );
    }
  }

  // Seed Quick Links
  const quickLinkCount = db.prepare('SELECT COUNT(*) as count FROM quick_links').get().count;
  if (quickLinkCount === 0) {
    const insertQuick = db.prepare(`
      INSERT INTO quick_links (id, title, description, icon, tone, target_role, action_type, badge)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const links = [
      // Student Links
      {
        id: 'results',
        title: 'Exam Results Portal',
        description: 'View provisional grade cards, semester marks and CGPA record',
        icon: '✓',
        tone: 'pink',
        target_role: 'student',
        action_type: 'results_modal',
        badge: 'Semester 3 Released'
      },
      {
        id: 'datesheets',
        title: 'Datesheets & Exams',
        description: 'Odd Semester 2026 end-term theory & practical timetables',
        icon: '▣',
        tone: 'violet',
        target_role: 'student',
        action_type: 'datesheet_modal',
        badge: 'Updated'
      },
      {
        id: 'welfare',
        title: 'Students’ Welfare & EWS',
        description: 'EWS scholarship status, student clubs and grievance portal',
        icon: '♡',
        tone: 'green',
        target_role: 'student',
        action_type: 'welfare_modal',
        badge: 'Apply Open'
      },
      {
        id: 'syllabus',
        title: 'Programmes & Syllabus',
        description: 'Curriculum structure, branch schemes and academic regulations',
        icon: '⌘',
        tone: 'teal',
        target_role: 'student',
        action_type: 'syllabus_modal',
        badge: 'Ordinance 2026'
      },
      {
        id: 'admissions',
        title: 'Admissions 2026–27',
        description: 'Counselling schedules, seat matrix and fee refund status',
        icon: '↗',
        tone: 'orange',
        target_role: 'student',
        action_type: 'admissions_modal',
        badge: 'Prospectus'
      },
      {
        id: 'placement',
        title: 'Placement & Internships',
        description: 'Active campus hiring drives and internship registration',
        icon: '★',
        tone: 'blue',
        target_role: 'student',
        action_type: 'placement_modal',
        badge: 'Drive Active'
      },

      // Faculty Links
      {
        id: 'faculty-portal',
        title: 'Grade Submission Portal',
        description: 'Upload end-term CIA marks, attendance sheets and practical awards',
        icon: '✎',
        tone: 'violet',
        target_role: 'faculty',
        action_type: 'faculty_grades_modal',
        badge: 'Deadline 25 Nov'
      },
      {
        id: 'phd-tracking',
        title: 'Ph.D. Scholar Repository',
        description: 'Track doctoral viva schedules, DRC evaluations and publications',
        icon: '🎓',
        tone: 'teal',
        target_role: 'faculty',
        action_type: 'faculty_phd_modal',
        badge: '4 Scholars'
      },
      {
        id: 'research-grants',
        title: 'Research & Consultancy',
        description: 'Seed money grant applications and patent filing assistance',
        icon: '◈',
        tone: 'blue',
        target_role: 'faculty',
        action_type: 'research_grants_modal',
        badge: 'Call for Proposals'
      },

      // Admin Links
      {
        id: 'estate-management',
        title: 'Estate & Campus Maintenance',
        description: 'Manage campus infrastructure repairs, SOP schedules and utilities',
        icon: '⚙',
        tone: 'orange',
        target_role: 'admin',
        action_type: 'admin_estate_modal',
        badge: 'Dwarka Campus'
      },
      {
        id: 'tenders-procurement',
        title: 'Tenders & Procurement',
        description: 'Active e-tender bidding status, vendor evaluation and contracts',
        icon: '▤',
        tone: 'green',
        target_role: 'admin',
        action_type: 'admin_tenders_modal',
        badge: '2 Active'
      },
      {
        id: 'user-management',
        title: 'Portal Notice & User Console',
        description: 'Publish new circulars and manage university role-based access',
        icon: '✦',
        tone: 'pink',
        target_role: 'admin',
        action_type: 'admin_manage_modal',
        badge: 'Admin Only'
      }
    ];

    for (const l of links) {
      insertQuick.run(l.id, l.title, l.description, l.icon, l.tone, l.target_role, l.action_type, l.badge);
    }
  }

  // Seed Sections & Items
  const sectionCount = db.prepare('SELECT COUNT(*) as count FROM site_sections').get().count;
  if (sectionCount === 0) {
    const insertSection = db.prepare(`
      INSERT INTO site_sections (id, title, target_role, display_order)
      VALUES (?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO section_items (section_id, label, action_type, target_role, description, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const sectionsData = [
      {
        id: 'academics',
        title: 'Academics',
        target_role: 'all',
        order: 1,
        items: [
          { label: 'List of Programmes', action: 'programmes_view', role: 'all', desc: 'Undergraduate, Postgraduate & Doctoral programmes across 14 University Schools.' },
          { label: 'Academic Calendar 2026–27', action: 'calendar_view', role: 'all', desc: 'Semester timelines, examination windows, and recognized holidays.' },
          { label: 'Scheme & Syllabus', action: 'syllabus_modal', role: 'student', desc: 'Subject codes, credit breakdowns, and course syllabi.' },
          { label: 'Schools & Research Centres', action: 'schools_view', role: 'all', desc: 'USICT, USMS, USLLS, USAP, USCT, USBAS and allied centres.' }
        ]
      },
      {
        id: 'examinations',
        title: 'Examinations',
        target_role: 'all',
        order: 2,
        items: [
          { label: 'Examination Notices', action: 'notices_filter_exam', role: 'all', desc: 'Official notifications issued by the Examination Division.' },
          { label: 'Datesheets & Schedules', action: 'datesheet_modal', role: 'student', desc: 'Odd & Even semester theory/practical datesheets.' },
          { label: 'Results Portal (Simulated)', action: 'results_modal', role: 'student', desc: 'Enter enrollment number to view simulated grade sheets.' },
          { label: 'Upload CIA / Practical Marks', action: 'faculty_grades_modal', role: 'faculty', desc: 'Secure evaluation mark entry for internal faculty.' }
        ]
      },
      {
        id: 'students',
        title: 'Students Corner',
        target_role: 'student',
        order: 3,
        items: [
          { label: 'Students’ Welfare & Grievance', action: 'welfare_modal', role: 'student', desc: 'Student support cell, counselling and grievance resolution.' },
          { label: 'EWS Financial Assistance', action: 'welfare_modal', role: 'student', desc: 'Direct scholarship applications for economically weaker students.' },
          { label: 'Training & Placements', action: 'placement_modal', role: 'student', desc: 'Corporate placement brochures and active recruitment drives.' },
          { label: 'Hostel Allotment & Mess Rules', action: 'hostel_modal', role: 'student', desc: 'Hostel rules, fee schedule and room allotment criteria.' }
        ]
      },
      {
        id: 'admissions',
        title: 'Admissions',
        target_role: 'all',
        order: 4,
        items: [
          { label: 'Admissions 2026–27 Information', action: 'admissions_modal', role: 'all', desc: 'Eligibility, application portal guidelines and CET notices.' },
          { label: 'Admission Brochures', action: 'admissions_modal', role: 'all', desc: 'Download program-wise admission guidelines.' },
          { label: 'CET Seat Matrix & Cutoffs', action: 'admissions_modal', role: 'all', desc: 'Previous round opening and closing rank statistics.' },
          { label: 'Fee Refund Policies', action: 'admissions_modal', role: 'all', desc: 'University refund rules as per UGC regulations.' }
        ]
      },
      {
        id: 'administration',
        title: 'Administration',
        target_role: 'admin',
        order: 5,
        items: [
          { label: 'Estate Branch & Maintenance SOPs', action: 'admin_estate_modal', role: 'admin', desc: 'Infrastructure repair rates and Dwarka campus maintenance.' },
          { label: 'Tenders & Procurement Division', action: 'admin_tenders_modal', role: 'admin', desc: 'Active tenders, technical bids, and work order tracking.' },
          { label: 'University Acts & Statutes', action: 'statutes_view', role: 'all', desc: 'Legislative statutes and university ordinances.' },
          { label: 'Office of the Vice Chancellor', action: 'vc_office_view', role: 'admin', desc: 'Administrative circulars and senate meeting minutes.' }
        ]
      }
    ];

    for (const sec of sectionsData) {
      insertSection.run(sec.id, sec.title, sec.target_role, sec.order);
      for (let i = 0; i < sec.items.length; i++) {
        const item = sec.items[i];
        insertItem.run(sec.id, item.label, item.action, item.role, item.desc, i + 1);
      }
    }
  }
}

// User Authentication Methods
function authenticateUser(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash, user.salt)) {
    return null;
  }

  // Create session token valid for 7 days
  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

  return {
    token,
    user: sanitizeUser(user)
  };
}

function registerUser({ username, password, role, name, email, departmentOrProgram, enrollmentOrId }) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username);
  if (existing) {
    throw new Error('Username already exists. Please choose another username.');
  }

  const validRoles = ['student', 'faculty', 'admin'];
  const userRole = validRoles.includes(role) ? role : 'student';

  const { hash, salt } = hashPassword(password);
  let defaultDetails = {};
  if (userRole === 'student') {
    defaultDetails = {
      cgpa: '8.50',
      attendance: '92%',
      semester: 'Current Semester',
      feeStatus: 'Cleared',
      admitCardStatus: 'Active'
    };
  } else if (userRole === 'faculty') {
    defaultDetails = {
      designation: 'Assistant Professor',
      batchesTeaching: 2,
      phdScholars: 2,
      pendingGrades: 0
    };
  } else {
    defaultDetails = {
      designation: 'Staff Officer',
      office: 'Administrative Wing'
    };
  }

  const result = db.prepare(`
    INSERT INTO users (username, password_hash, salt, role, name, email, enrollment_or_id, department_or_program, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    username, hash, salt, userRole, name, email,
    enrollmentOrId || 'N/A', departmentOrProgram || 'General',
    JSON.stringify(defaultDetails)
  );

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, newUser.id, expiresAt);

  return {
    token,
    user: sanitizeUser(newUser)
  };
}

function getUserByToken(token) {
  if (!token) return null;
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  return user ? sanitizeUser(user) : null;
}

function removeSession(token) {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

function sanitizeUser(user) {
  let details = {};
  try {
    details = JSON.parse(user.details_json || '{}');
  } catch (e) {
    details = {};
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    enrollmentOrId: user.enrollment_or_id,
    departmentOrProgram: user.department_or_program,
    details
  };
}

// Data Queries filtered by Role
function getNotices(role = null, search = '', category = 'all') {
  let query = 'SELECT * FROM notices WHERE 1=1';
  const params = [];

  // Role filtering:
  // If role is student: only 'student' and 'all'
  // If role is faculty: only 'faculty' and 'all'
  // If role is admin: all notices
  // If guest (null): show notices where target_role in ('student', 'all') or general
  if (role === 'student') {
    query += " AND (target_role = 'student' OR target_role = 'all')";
  } else if (role === 'faculty') {
    query += " AND (target_role = 'faculty' OR target_role = 'all')";
  } else if (role === 'admin') {
    // Admin sees all
  } else {
    // Guest view: general public
    query += " AND (target_role = 'student' OR target_role = 'all')";
  }

  if (category && category !== 'all') {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(category);
  }

  const rows = db.prepare(query).all(...params);

  // Apply search filtering
  if (!search) return rows;
  const s = search.toLowerCase();
  return rows.filter((r) =>
    r.title.toLowerCase().includes(s) ||
    r.category.toLowerCase().includes(s) ||
    r.source.toLowerCase().includes(s) ||
    (r.content && r.content.toLowerCase().includes(s))
  );
}

function getNoticeById(id) {
  return db.prepare('SELECT * FROM notices WHERE id = ?').get(id);
}

function createNotice({ title, date, category, source, targetRole, isNew, content, circularNo, attachmentName }) {
  const id = 'notice-' + Date.now();
  db.prepare(`
    INSERT INTO notices (id, title, date, category, source, target_role, is_new, content, circular_no, attachment_name, views_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id, title, date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    category || 'General', source || 'University Notice Board',
    targetRole || 'all', isNew ? 1 : 0, content || '', circularNo || 'GGSIPU/NOTICES/2026', attachmentName || 'Circular.pdf'
  );
  return getNoticeById(id);
}

function getQuickLinks(role = null) {
  let query = 'SELECT * FROM quick_links WHERE 1=1';
  if (role === 'student') {
    query += " AND (target_role = 'student' OR target_role = 'all')";
  } else if (role === 'faculty') {
    query += " AND (target_role = 'faculty' OR target_role = 'all')";
  } else if (role === 'admin') {
    query += " AND (target_role = 'admin' OR target_role = 'all')";
  } else {
    query += " AND (target_role = 'student' OR target_role = 'all')";
  }
  return db.prepare(query).all();
}

function getSections(role = null) {
  let sectionQuery = 'SELECT * FROM site_sections ORDER BY display_order ASC';
  const sections = db.prepare(sectionQuery).all();

  return sections
    .filter((sec) => {
      if (role === 'student') return sec.target_role === 'student' || sec.target_role === 'all';
      if (role === 'faculty') return sec.target_role === 'faculty' || sec.target_role === 'all';
      if (role === 'admin') return true;
      return sec.target_role === 'student' || sec.target_role === 'all';
    })
    .map((sec) => {
      let itemsQuery = 'SELECT * FROM section_items WHERE section_id = ? ORDER BY display_order ASC';
      const items = db.prepare(itemsQuery).all(sec.id);
      const filteredItems = items.filter((item) => {
        if (role === 'student') return item.target_role === 'student' || item.target_role === 'all';
        if (role === 'faculty') return item.target_role === 'faculty' || item.target_role === 'all';
        if (role === 'admin') return true;
        return item.target_role === 'student' || item.target_role === 'all';
      });
      return {
        id: sec.id,
        title: sec.title,
        items: filteredItems
      };
    })
    .filter((sec) => sec.items.length > 0);
}

// Student Mock Academic Record
function getStudentAcademicRecord(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.role !== 'student') return null;
  return {
    studentName: user.name,
    enrollmentNo: user.enrollment_or_id || '04216403223',
    program: user.department_or_program || 'B.Tech (CSE)',
    institution: 'University School of Information, Communication & Technology (USICT)',
    campus: 'Dwarka Sector 16-C, New Delhi',
    semesters: [
      {
        sem: 'Semester 1',
        sgpa: '8.72',
        credits: 25,
        status: 'Pass',
        subjects: [
          { code: 'ETMA-101', name: 'Applied Mathematics - I', credits: 4, grade: 'A+', points: 9 },
          { code: 'ETPH-103', name: 'Applied Physics - I', credits: 3, grade: 'A', points: 8 },
          { code: 'ETCS-111', name: 'Programming in C', credits: 4, grade: 'O', points: 10 },
          { code: 'ETEE-107', name: 'Electrical Science', credits: 3, grade: 'B+', points: 7 }
        ]
      },
      {
        sem: 'Semester 2',
        sgpa: '8.90',
        credits: 25,
        status: 'Pass',
        subjects: [
          { code: 'ETMA-102', name: 'Applied Mathematics - II', credits: 4, grade: 'O', points: 10 },
          { code: 'ETCS-108', name: 'Data Structures & Algorithms', credits: 4, grade: 'A+', points: 9 },
          { code: 'ETEC-106', name: 'Analog Electronics', credits: 3, grade: 'A', points: 8 },
          { code: 'ETEN-114', name: 'Communication Skills', credits: 2, grade: 'A+', points: 9 }
        ]
      },
      {
        sem: 'Semester 3',
        sgpa: '8.91',
        credits: 26,
        status: 'Pass (Provisional)',
        subjects: [
          { code: 'ETCS-203', name: 'Database Management Systems', credits: 4, grade: 'O', points: 10 },
          { code: 'ETCS-205', name: 'Computer Architecture', credits: 4, grade: 'A+', points: 9 },
          { code: 'ETCS-207', name: 'Discrete Mathematics', credits: 4, grade: 'A', points: 8 },
          { code: 'ETCS-209', name: 'Object Oriented Programming (Java)', credits: 4, grade: 'O', points: 10 }
        ]
      }
    ],
    cumulativeCgpa: '8.84',
    totalCreditsEarned: 76,
    attendanceSummary: {
      overall: '89.2%',
      presentClasses: 214,
      totalClasses: 240,
      status: 'Eligible for Examination (Admit Card Valid)'
    },
    upcomingExams: [
      { date: '16 Nov 2026', time: '10:00 AM - 01:00 PM', code: 'ETCS-202', subject: 'Operating Systems', hall: 'Room E-204' },
      { date: '19 Nov 2026', time: '10:00 AM - 01:00 PM', code: 'ETCS-204', subject: 'Computer Networks', hall: 'Room E-204' },
      { date: '22 Nov 2026', time: '10:00 AM - 01:00 PM', code: 'ETCS-206', subject: 'Theory of Computation', hall: 'Room E-208' }
    ]
  };
}

// Initialize on startup
initDb();

module.exports = {
  db,
  authenticateUser,
  registerUser,
  getUserByToken,
  removeSession,
  getNotices,
  getNoticeById,
  createNotice,
  getQuickLinks,
  getSections,
  getStudentAcademicRecord
};
