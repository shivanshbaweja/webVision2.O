// GGSIPU Local Reference & Role-Based Portal Application Script
const API = '/api';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

// State
let authToken = localStorage.getItem('ipu_auth_token') || null;
let currentUser = null;
let effectiveRole = null; // 'student' | 'faculty' | 'admin' | null
let allNotices = [];
let allSections = [];
let allQuickLinks = [];
let studentAcademicRecord = null;

// API Helpers
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }
  return data;
}

// Toast Notification
function showToast(message, duration = 3500) {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;
  msgEl.textContent = message;
  toast.style.display = 'flex';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.display = 'none';
  }, duration);
}

// ================= MODAL CONTROLS =================
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.style.display = 'grid';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.style.display = 'none';
    const anyOpen = document.querySelectorAll('.modal-backdrop[style*="display: grid"]');
    if (anyOpen.length === 0) {
      document.body.style.overflow = '';
    }
  }
}

function setupModalDismissals() {
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
        if (backdrop.style.display === 'grid') {
          closeModal(backdrop.id);
        }
      });
    }
  });

  // Attach explicit close buttons
  document.getElementById('closeAuthModal')?.addEventListener('click', () => closeModal('authModal'));
  document.getElementById('closeNoticeModal')?.addEventListener('click', () => closeModal('noticeModal'));
  document.getElementById('closeNoticeModalBtn')?.addEventListener('click', () => closeModal('noticeModal'));
  document.getElementById('closeResultsModal')?.addEventListener('click', () => closeModal('resultsModal'));
  document.getElementById('closeResultsModalBtn')?.addEventListener('click', () => closeModal('resultsModal'));
  document.getElementById('closeDatesheetModal')?.addEventListener('click', () => closeModal('datesheetModal'));
  document.getElementById('closeDatesheetModalBtn')?.addEventListener('click', () => closeModal('datesheetModal'));
  document.getElementById('closeGenericModal')?.addEventListener('click', () => closeModal('genericModal'));
  document.getElementById('genericModalCloseBtn')?.addEventListener('click', () => closeModal('genericModal'));
  document.getElementById('genericModalPrimaryBtn')?.addEventListener('click', () => closeModal('genericModal'));
  document.getElementById('closeCreateNoticeModal')?.addEventListener('click', () => closeModal('createNoticeModal'));
}

// ================= GENERIC SIMULATED DIALOGS =================
function openGenericModal(title, bodyHtml, icon = '✦', buttonText = 'Acknowledge') {
  document.getElementById('genericModalTitle').textContent = title;
  document.getElementById('genericModalIcon').textContent = icon;
  document.getElementById('genericModalBody').innerHTML = bodyHtml;
  document.getElementById('genericModalPrimaryBtn').textContent = buttonText;
  openModal('genericModal');
}

// Handler for simulated action clicks
function handleActionClick(actionType, label = '') {
  switch (actionType) {
    case 'results_modal':
      openResultsModal();
      break;

    case 'datesheet_modal':
      openDatesheetModal();
      break;

    case 'admissions_modal':
      openGenericModal(
        'Admissions 2026–27 (Local Reference)',
        `
        <p><strong>Common Entrance Test (CET) & National Level Tests:</strong></p>
        <p>GGSIPU conducts admissions via JEE Main, CUET, NIMCET, and University CET. All counselling rounds for Academic Year 2026–27 are monitored locally.</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Online registration & document verification active.</li>
          <li>Seat allotment results for Round 2 published.</li>
          <li>Reporting at designated University School / Affiliated College open.</li>
        </ul>
        <div style="margin-top: 14px; background: #eaf3fb; padding: 10px 14px; border-radius: 6px; font-size: 12px; color: #1e5284;">
          ● <em>This is an in-app simulated view. No external page redirection needed.</em>
        </div>
        `,
        '↗',
        'Download Prospectus (Demo)'
      );
      break;

    case 'welfare_modal':
      openGenericModal(
        'Directorate of Students’ Welfare (DSW)',
        `
        <p><strong>Student Support & Financial Assistance (EWS Scheme):</strong></p>
        <p>The DSW branch coordinates student welfare, extra-curricular societies, and the economically weaker sections financial scheme for 2026–27.</p>
        <div style="background: #eef7f3; padding: 12px 14px; border-radius: 6px; border: 1px solid #c2e5d7; margin: 12px 0;">
          <strong style="color: #1f6b53;">EWS Scheme Status: Applications Open</strong>
          <p style="margin: 4px 0 0; font-size: 12px; color: #2e7a62;">Income ceiling: Family annual income under ₹2.50 Lakh. Submit signed declaration by 20 Nov 2026.</p>
        </div>
        <p>Student Grievance Redressal Committee meetings are held every alternate Wednesday in the Main Administrative Block.</p>
        `,
        '♡',
        'Apply for EWS Assistance (Demo)'
      );
      break;

    case 'syllabus_modal':
      openGenericModal(
        'Curriculum Scheme & Syllabus',
        `
        <p><strong>Academic Regulations & Syllabi:</strong></p>
        <p>Undergraduate & Postgraduate curricula designed according to NEP 2020 framework with multidisciplinary credit choice.</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li><strong>B.Tech (CSE/IT/ECE/AI&ML):</strong> Ordinance 11, Schemes 2024–2028.</li>
          <li><strong>MCA / MBA:</strong> Revised 2-Year Professional Framework.</li>
          <li><strong>USLLS (BA LLB / BBA LLB):</strong> Bar Council Approved 5-Year Curriculum.</li>
        </ul>
        `,
        '⌘',
        'Download Course Scheme (Demo)'
      );
      break;

    case 'placement_modal':
      openGenericModal(
        'University Training & Placement Cell',
        `
        <p><strong>Campus Recruitment Season 2026–27:</strong></p>
        <p>Central Placement Cell at Dwarka Campus facilitates campus placement drives across USS and 80+ affiliated colleges.</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Participating Recruiters: Top Tier Product & Tech Firms, Financial Institutions, and Core Engineering Orgs.</li>
          <li>Next scheduled technical evaluation: 12 November 2026.</li>
        </ul>
        `,
        '★',
        'View Registered Drives'
      );
      break;

    case 'faculty_grades_modal':
      openGenericModal(
        'Faculty CIA & Practical Marks Entry',
        `
        <p><strong>Examination Division Faculty Portal:</strong></p>
        <p>Faculty members are permitted to upload Continuous Internal Assessment (CIA) marks and practical evaluation sheets.</p>
        <div style="background: #fbf5ea; border: 1px solid #fed7aa; padding: 12px 14px; border-radius: 6px; margin: 10px 0; color: #9a3412;">
          <strong>Deadline: 25 November 2026 (Strict)</strong>
          <p style="margin: 4px 0 0; font-size: 12px;">Ensure attendance percentage criteria is verified before freezing marks.</p>
        </div>
        `,
        '✎',
        'Enter CIA Marks Portal'
      );
      break;

    case 'faculty_phd_modal':
      openGenericModal(
        'Ph.D. Scholar Tracking System',
        `
        <p><strong>Research & Development Cell:</strong></p>
        <p>Doctoral Research Committee (DRC) tracking for Ph.D. scholars in USICT, USCT, USBAS, and USMS.</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>Active scholars under supervision: 4 Candidates.</li>
          <li>Upcoming viva-voce: Mr. Anirban Ghosh (Scheduled 5 Nov 2026).</li>
          <li>Next Bi-annual Progress Report Window: December 2026.</li>
        </ul>
        `,
        '🎓',
        'Open Scholar Records'
      );
      break;

    case 'research_grants_modal':
      openGenericModal(
        'University Seed Money & Research Grants',
        `
        <p><strong>Institutional Research Funding Scheme:</strong></p>
        <p>Faculty grant assistance for high-impact international conference presentations, patent filings, and seed lab setup.</p>
        `,
        '◈',
        'Download Grant Form'
      );
      break;

    case 'admin_estate_modal':
      openGenericModal(
        'Estate Branch & Infrastructure Maintenance',
        `
        <p><strong>Campus Operations – Dwarka & East Delhi:</strong></p>
        <p>SOPs for furniture repair, civil maintenance, electrical transformer substations, and lecture hall air-conditioning upkeep.</p>
        <div style="background: #edf7f3; border: 1px solid #c2e5d7; padding: 12px; border-radius: 6px; margin: 10px 0; font-size: 12px; color: #1e6b52;">
          ✓ Approved Schedule of Rates 2026 active for Dwarka campus.
        </div>
        `,
        '⚙',
        'Open Requisition System'
      );
      break;

    case 'admin_tenders_modal':
      openGenericModal(
        'Tenders & Procurement Division',
        `
        <p><strong>Central Purchase Branch:</strong></p>
        <p>Active e-procurement tenders for IT hardware, AMC networking equipment, and stationery supplies.</p>
        <ul style="padding-left: 20px; line-height: 1.8;">
          <li>E-Tender Ref: GGSIPU/PUR/AMC/NET/2026/14 (Networking AMC)</li>
          <li>Pre-bid Conference: 8 November 2026 at Conference Room.</li>
        </ul>
        `,
        '▤',
        'View Tender Bids'
      );
      break;

    case 'admin_manage_modal':
      openModal('createNoticeModal');
      break;

    case 'notices_filter_exam':
      document.getElementById('notices-section')?.scrollIntoView({ behavior: 'smooth' });
      const select = document.getElementById('categoryFilter');
      if (select) {
        select.value = 'examinations';
        select.dispatchEvent(new Event('change'));
      }
      break;

    default:
      openGenericModal(
        label || 'University Information Corner',
        `
        <p><strong>Institutional Reference Document:</strong></p>
        <p>You selected <strong>${escapeHtml(label || 'Information Portal')}</strong>.</p>
        <p>All external navigation has been intentionally intercepted to keep your browsing experience inside this local prototype replica.</p>
        `,
        '◈',
        'Close Reference'
      );
      break;
  }
}

// ================= RESULTS MODAL =================
async function openResultsModal() {
  try {
    if (!studentAcademicRecord) {
      const data = await apiRequest('/student/academic-record');
      studentAcademicRecord = data.data;
    }
    const rec = studentAcademicRecord;
    if (!rec) return;

    document.getElementById('resName').textContent = rec.studentName;
    document.getElementById('resRoll').textContent = rec.enrollmentNo;
    document.getElementById('resProg').textContent = rec.program;
    document.getElementById('resCgpa').textContent = rec.cumulativeCgpa;

    renderSemesterGrades(2); // default to Semester 3 (index 2)
    openModal('resultsModal');
  } catch (err) {
    showToast('Unable to load student results record.');
  }
}

function renderSemesterGrades(semIndex) {
  if (!studentAcademicRecord || !studentAcademicRecord.semesters) return;
  const semData = studentAcademicRecord.semesters[semIndex];
  if (!semData) return;

  // Update tabs active state
  document.querySelectorAll('.sem-tab').forEach((tab, idx) => {
    tab.classList.toggle('active', idx === semIndex);
  });

  const tbody = document.getElementById('resultsTableBody');
  tbody.innerHTML = semData.subjects.map((sub) => `
    <tr>
      <td><code>${escapeHtml(sub.code)}</code></td>
      <td><strong>${escapeHtml(sub.name)}</strong></td>
      <td>${escapeHtml(sub.credits)}</td>
      <td><span style="font-weight: 700; color: #1e64a8;">${escapeHtml(sub.grade)}</span></td>
      <td>${escapeHtml(sub.points)} / 10</td>
      <td><span class="result-status-tag">PASS</span></td>
    </tr>
  `).join('');

  document.getElementById('semSgpaVal').textContent = semData.sgpa;
}

// ================= DATESHEET MODAL =================
function openDatesheetModal() {
  openModal('datesheetModal');
}

// ================= NOTICE READER MODAL =================
async function openNoticeModal(noticeId) {
  try {
    const res = await apiRequest(`/notices/${noticeId}`);
    const n = res.data;
    if (!n) return;

    document.getElementById('noticeModalCategory').textContent = n.category;
    document.getElementById('noticeModalDate').textContent = n.date;
    document.getElementById('noticeModalTitle').textContent = n.title;
    document.getElementById('noticeModalRef').textContent = n.circular_no || `GGSIPU/NOTICES/${n.id}`;
    document.getElementById('noticeModalSource').textContent = n.source;
    document.getElementById('noticeModalTargetRole').textContent = `Target: ${n.target_role.toUpperCase()}`;
    document.getElementById('noticeModalBody').textContent = n.content || 'Notice reference circular details are recorded in the university register.';
    document.getElementById('noticeAttachmentName').textContent = n.attachment_name || `${n.id}.pdf`;

    openModal('noticeModal');
  } catch (err) {
    showToast('Failed to load notice details.');
  }
}

// ================= AUTHENTICATION & ROLE SWITCHING =================
async function checkAuthSession() {
  try {
    const res = await apiRequest('/auth/me');
    if (res.authenticated && res.user) {
      currentUser = res.user;
      effectiveRole = currentUser.role;
    } else {
      currentUser = null;
      effectiveRole = null;
    }
  } catch (err) {
    currentUser = null;
    effectiveRole = null;
  }
  updateAuthUI();
  await refreshPortalData();
}

async function loginUser(username, password) {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    authToken = res.token;
    currentUser = res.user;
    effectiveRole = currentUser.role;
    localStorage.setItem('ipu_auth_token', authToken);
    closeModal('authModal');
    showToast(`Logged in successfully as ${currentUser.name} (${currentUser.role.toUpperCase()})`);
    updateAuthUI();
    await refreshPortalData();
  } catch (err) {
    const alertEl = document.getElementById('loginAlert');
    if (alertEl) {
      alertEl.textContent = err.message || 'Login failed';
      alertEl.className = 'form-alert alert-error';
      alertEl.style.display = 'block';
    }
  }
}

async function registerUserAccount(payload) {
  try {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authToken = res.token;
    currentUser = res.user;
    effectiveRole = currentUser.role;
    localStorage.setItem('ipu_auth_token', authToken);
    closeModal('authModal');
    showToast(`Account registered and logged in as ${currentUser.name}!`);
    updateAuthUI();
    await refreshPortalData();
  } catch (err) {
    const alertEl = document.getElementById('registerAlert');
    if (alertEl) {
      alertEl.textContent = err.message || 'Registration failed';
      alertEl.className = 'form-alert alert-error';
      alertEl.style.display = 'block';
    }
  }
}

async function logoutUser() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (err) {
    // Ignore error on logout
  }
  authToken = null;
  currentUser = null;
  effectiveRole = null;
  localStorage.removeItem('ipu_auth_token');
  showToast('Logged out. Switched to public guest mode.');
  updateAuthUI();
  await refreshPortalData();
}

// Fast Switch to a specific role (auto logins or switches demo persona)
async function switchRoleDemo(role) {
  if (role === 'student') {
    await loginUser('student', 'student123');
  } else if (role === 'faculty') {
    await loginUser('faculty', 'faculty123');
  } else if (role === 'admin') {
    await loginUser('admin', 'admin123');
  }
}

// Update Header, Masthead and Status Banner according to active user/role
function updateAuthUI() {
  const utilityNav = document.getElementById('utilityAuthNav');
  const mastheadSlot = document.getElementById('mastheadUserSlot');
  const roleStripText = document.getElementById('roleStatusText');
  const modeTag = document.getElementById('utilityModeTag');
  const adminBtnHolder = document.getElementById('adminNoticeBtnHolder');

  // Update pills active state
  document.querySelectorAll('.role-pill-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-demo') === effectiveRole);
  });

  if (currentUser) {
    const roleCapitalized = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    modeTag.textContent = `${roleCapitalized} Portal · ${currentUser.name}`;

    utilityNav.innerHTML = `
      <span style="font-size: 11px; color: #a4bed4;">Logged in: <strong>${escapeHtml(currentUser.name)}</strong> (${escapeHtml(roleCapitalized)})</span>
      <button type="button" class="utility-btn" id="logoutBtnTop">Logout</button>
    `;

    const avatarInitial = currentUser.name.charAt(0).toUpperCase();
    const avatarClass = `avatar-${currentUser.role}`;
    const roleTagClass = `role-tag-${currentUser.role}`;

    mastheadSlot.innerHTML = `
      <div class="user-profile-pill">
        <div class="user-avatar ${avatarClass}">${avatarInitial}</div>
        <div class="user-pill-meta">
          <span class="user-pill-name">${escapeHtml(currentUser.name)}</span>
          <span class="user-pill-role ${roleTagClass}">${escapeHtml(roleCapitalized)}</span>
        </div>
        <button type="button" class="logout-icon-btn" id="logoutIconBtn" title="Logout">✕</button>
      </div>
    `;

    document.getElementById('logoutBtnTop')?.addEventListener('click', logoutUser);
    document.getElementById('logoutIconBtn')?.addEventListener('click', logoutUser);

    if (currentUser.role === 'student') {
      roleStripText.innerHTML = `
        <strong>🎓 Active Student Session:</strong> Viewing tailored student announcements, examination schedules, and student welfare circulars.
        <span style="color: #1f6b53; margin-left: 8px;">(Administrative vendor tenders & faculty memos are hidden)</span>
      `;
    } else if (currentUser.role === 'faculty') {
      roleStripText.innerHTML = `
        <strong>💼 Active Faculty Session:</strong> Viewing research notices, Ph.D. viva evaluations, and internal marks submission portal.
      `;
    } else if (currentUser.role === 'admin') {
      roleStripText.innerHTML = `
        <strong>⚙ Active Administration Session:</strong> Full access to campus maintenance SOPs, tender notices, and notice creation.
      `;
    }

    if (adminBtnHolder) {
      adminBtnHolder.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    }
  } else {
    modeTag.textContent = 'Public Reference Mode';
    utilityNav.innerHTML = `
      <button type="button" class="utility-btn" id="openLoginBtnTop">🔐 Portal Login</button>
    `;
    mastheadSlot.innerHTML = `
      <button class="official-button login-accent-btn" id="mastheadLoginBtn" type="button">
        <span>🔐</span> Log In / Choose Role
      </button>
    `;

    document.getElementById('openLoginBtnTop')?.addEventListener('click', () => openModal('authModal'));
    document.getElementById('mastheadLoginBtn')?.addEventListener('click', () => openModal('authModal'));

    roleStripText.innerHTML = `
      <strong>Public Guest View:</strong> Showing general university reference information. Log in as a Student, Faculty, or Admin for role-filtered content.
    `;

    if (adminBtnHolder) {
      adminBtnHolder.style.display = 'none';
    }
  }

  renderRoleDashboard();
}

// Render dedicated Student / Faculty / Admin Dashboard widget
function renderRoleDashboard() {
  const dashContainer = document.getElementById('portalDashboard');
  if (!dashContainer) return;

  if (!currentUser) {
    dashContainer.style.display = 'none';
    dashContainer.innerHTML = '';
    return;
  }

  dashContainer.style.display = 'block';

  if (currentUser.role === 'student') {
    const details = currentUser.details || {};
    dashContainer.innerHTML = `
      <div class="dashboard-card dashboard-student">
        <div class="dash-top">
          <div class="dash-user-identity">
            <div class="dash-avatar-large avatar-student">🎓</div>
            <div class="dash-user-meta">
              <h3>Welcome back, ${escapeHtml(currentUser.name)}!</h3>
              <p>Enrollment: <strong>${escapeHtml(currentUser.enrollmentOrId || '04216403223')}</strong> | ${escapeHtml(currentUser.departmentOrProgram || 'B.Tech CSE - 4th Sem')}</p>
            </div>
          </div>
          <span class="dash-badge badge-student-green">Verified Student Portal</span>
        </div>

        <div class="dash-metrics-grid">
          <div class="dash-metric-box">
            <div class="metric-label">Cumulative CGPA</div>
            <div class="metric-value" style="color: #227b60;">${escapeHtml(details.cgpa || '8.84')}</div>
            <div class="metric-sub">Ranked in Top 5% of USS</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Overall Attendance</div>
            <div class="metric-value" style="color: #1e64a8;">${escapeHtml(details.attendance || '89.2%')}</div>
            <div class="metric-sub">Admit Card: Exam Eligible</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Fee Clearance</div>
            <div class="metric-value" style="color: #227b60; font-size: 18px;">${escapeHtml(details.feeStatus || 'Paid / No Dues')}</div>
            <div class="metric-sub">Odd Semester 2026 Cleared</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Next End-Term Exam</div>
            <div class="metric-value" style="color: #b45309; font-size: 18px;">16 Nov 2026</div>
            <div class="metric-sub">Operating Systems (Hall E-204)</div>
          </div>
        </div>

        <div class="dash-filter-alert">
          <div>
            <strong>✓ Student Content Filtering Active:</strong> You only see notices, datesheets, and services relevant to university students. Tender procurement notices and confidential staff circulars are omitted.
          </div>
          <div class="dash-quick-btns">
            <button class="dash-btn" type="button" id="dashViewResultsBtn">📊 View Grade Card</button>
            <button class="dash-btn" type="button" id="dashViewDatesheetBtn">▣ Check Datesheet</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('dashViewResultsBtn')?.addEventListener('click', openResultsModal);
    document.getElementById('dashViewDatesheetBtn')?.addEventListener('click', openDatesheetModal);

  } else if (currentUser.role === 'faculty') {
    const details = currentUser.details || {};
    dashContainer.innerHTML = `
      <div class="dashboard-card dashboard-faculty">
        <div class="dash-top">
          <div class="dash-user-identity">
            <div class="dash-avatar-large avatar-faculty">💼</div>
            <div class="dash-user-meta">
              <h3>Welcome, ${escapeHtml(currentUser.name)}!</h3>
              <p>${escapeHtml(currentUser.departmentOrProgram || 'USICT')} | ID: <strong>${escapeHtml(currentUser.enrollmentOrId || 'FAC-2015-88')}</strong></p>
            </div>
          </div>
          <span class="dash-badge badge-faculty-blue">Faculty & Academic Portal</span>
        </div>

        <div class="dash-metrics-grid">
          <div class="dash-metric-box">
            <div class="metric-label">Assigned Courses</div>
            <div class="metric-value">${escapeHtml(details.batchesTeaching || '3 Batches')}</div>
            <div class="metric-sub">Odd Semester 2026–27</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Ph.D. Scholars Mentored</div>
            <div class="metric-value">${escapeHtml(details.phdScholars || '4 Candidates')}</div>
            <div class="metric-sub">Next viva: 5 Nov 2026</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Pending CIA Marks</div>
            <div class="metric-value" style="color: #b45309;">${escapeHtml(details.pendingGrades ?? '1 Batch')}</div>
            <div class="metric-sub">Deadline: 25 Nov 2026</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Research Grants</div>
            <div class="metric-value" style="color: #227b60;">₹ 12.5 Lakh</div>
            <div class="metric-sub">DST-SERB Active Grant</div>
          </div>
        </div>

        <div class="dash-filter-alert">
          <div>
            <strong>✓ Faculty Content Filtering Active:</strong> Displaying research notices, faculty development programmes, and CIA marks upload tools. Student scholarship applications are hidden.
          </div>
          <div class="dash-quick-btns">
            <button class="dash-btn" type="button" id="dashUploadMarksBtn">✎ CIA Upload Portal</button>
            <button class="dash-btn" type="button" id="dashPhdScholarsBtn">🎓 Ph.D. Roster</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('dashUploadMarksBtn')?.addEventListener('click', () => handleActionClick('faculty_grades_modal'));
    document.getElementById('dashPhdScholarsBtn')?.addEventListener('click', () => handleActionClick('faculty_phd_modal'));

  } else if (currentUser.role === 'admin') {
    dashContainer.innerHTML = `
      <div class="dashboard-card dashboard-admin">
        <div class="dash-top">
          <div class="dash-user-identity">
            <div class="dash-avatar-large avatar-admin">⚙</div>
            <div class="dash-user-meta">
              <h3>University Administration Console – ${escapeHtml(currentUser.name)}</h3>
              <p>${escapeHtml(currentUser.departmentOrProgram || 'General Administration & Estate Branch')}</p>
            </div>
          </div>
          <span class="dash-badge badge-admin-gold">Administrative Access</span>
        </div>

        <div class="dash-metrics-grid">
          <div class="dash-metric-box">
            <div class="metric-label">Live Notices in DB</div>
            <div class="metric-value">${allNotices.length}</div>
            <div class="metric-sub">Stored in SQLite</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Active Campus Tenders</div>
            <div class="metric-value">2 Active</div>
            <div class="metric-sub">Pre-bid 8 Nov 2026</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Estate Maintenance SOPs</div>
            <div class="metric-value" style="color: #227b60;">Approved</div>
            <div class="metric-sub">Dwarka Sector 16-C</div>
          </div>
          <div class="dash-metric-box">
            <div class="metric-label">Portal Database</div>
            <div class="metric-value" style="color: #227b60; font-size: 18px;">SQLite Active</div>
            <div class="metric-sub">Zero external redirect mode</div>
          </div>
        </div>

        <div class="dash-filter-alert">
          <div>
            <strong>⚙ Administrative Control:</strong> You have full visibility over all circulars, tenders, and operations. You can publish new official notices directly into the live portal database.
          </div>
          <div class="dash-quick-btns">
            <button class="dash-btn" type="button" id="dashCreateNoticeBtn">+ Publish New Notice</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('dashCreateNoticeBtn')?.addEventListener('click', () => openModal('createNoticeModal'));
  }
}

// ================= FETCH & RENDER PORTAL DATA =================
async function refreshPortalData() {
  const roleParam = effectiveRole ? `?role=${effectiveRole}` : '';
  try {
    const [sectionsRes, quickRes, noticesRes] = await Promise.all([
      apiRequest(`/site-sections${roleParam}`),
      apiRequest(`/quick-links${roleParam}`),
      apiRequest(`/notices${roleParam}`)
    ]);

    allSections = sectionsRes.data || [];
    allQuickLinks = quickRes.data || [];
    allNotices = noticesRes.data || [];

    renderNavigation(allSections);
    renderDepartments(allSections);
    renderQuickLinks(allQuickLinks);
    renderNotices(allNotices);
    setupNoticeFilters();
  } catch (err) {
    console.error('Error refreshing portal data:', err);
    showToast('Failed to load updated portal data from local database.');
  }
}

// Render Main Navigation
function renderNavigation(sections) {
  const host = document.getElementById('navSections');
  if (!host) return;

  host.innerHTML = sections.map((section) => `
    <div class="nav-entry">
      <button class="nav-trigger" type="button" aria-expanded="false">
        ${escapeHtml(section.title)}
      </button>
      <div class="dropdown">
        ${section.items.map((item) => `
          <a href="#quickSection" data-dummy-action="${escapeHtml(item.action_type || '')}" data-label="${escapeHtml(item.label)}">
            <span>${escapeHtml(item.label)}</span>
            <span class="icon-indicator">◈</span>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Dropdown toggle handling
  host.querySelectorAll('.nav-trigger').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const entry = button.closest('.nav-entry');
      const willOpen = !entry.classList.contains('open');

      host.querySelectorAll('.nav-entry').forEach((item) => {
        item.classList.remove('open');
        item.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false');
      });

      if (willOpen) {
        entry.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Attach click handlers to dropdown links
  host.querySelectorAll('.dropdown a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Close dropdown
      host.querySelectorAll('.nav-entry').forEach((item) => item.classList.remove('open'));
      const action = link.getAttribute('data-dummy-action');
      const label = link.getAttribute('data-label');
      handleActionClick(action, label);
    });
  });
}

// Close nav dropdowns on window click
window.addEventListener('click', () => {
  document.querySelectorAll('.nav-entry.open').forEach((entry) => {
    entry.classList.remove('open');
    entry.querySelector('.nav-trigger')?.setAttribute('aria-expanded', 'false');
  });
});

// Render Quick Links
function renderQuickLinks(items) {
  const container = document.getElementById('quickLinks');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<div class="loading-card">No quick access tools available for this profile.</div>';
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="quick-card" data-dummy-action="${escapeHtml(item.action_type)}" data-title="${escapeHtml(item.title)}">
      <div class="quick-icon tone-${escapeHtml(item.tone)}">${escapeHtml(item.icon)}</div>
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        ${item.badge ? `<span class="quick-card-badge">${escapeHtml(item.badge)}</span>` : ''}
      </div>
      <span class="quick-arrow">↗</span>
    </div>
  `).join('');

  container.querySelectorAll('.quick-card').forEach((card) => {
    card.addEventListener('click', () => {
      const action = card.getAttribute('data-dummy-action');
      const title = card.getAttribute('data-title');
      handleActionClick(action, title);
    });
  });
}

// Render Notices List
function renderNotices(items) {
  const host = document.getElementById('noticeList');
  const countEl = document.getElementById('noticeCount');
  if (!host) return;

  countEl.textContent = `Displaying ${items.length} relevant notices`;

  if (!items.length) {
    host.innerHTML = '<div class="loading-row">No matching announcements found for this keyword or category.</div>';
    return;
  }

  host.innerHTML = items.map((notice) => {
    const parts = (notice.date || '').split(' ');
    const day = parts[0] || '30';
    const month = parts[1] || 'Oct';
    const year = parts[2] || '2026';

    const targetLabel = notice.target_role === 'student' ? 'Students' :
                        notice.target_role === 'faculty' ? 'Faculty' :
                        notice.target_role === 'admin' ? 'Admin' : 'University';

    return `
      <article class="notice-row" data-notice-id="${escapeHtml(notice.id)}">
        <div class="notice-date">
          <strong>${escapeHtml(day)}</strong>
          ${escapeHtml(month)}<br>${escapeHtml(year)}
        </div>
        <div class="notice-info">
          <div class="notice-meta">
            <span class="category-label">${escapeHtml(notice.category)}</span>
            <span class="target-badge">For: ${escapeHtml(targetLabel)}</span>
            ${notice.is_new ? '<span class="new-label">● NEW</span>' : ''}
          </div>
          <h3>${escapeHtml(notice.title)}</h3>
          <div class="notice-source">${escapeHtml(notice.source)} · Ref: ${escapeHtml(notice.circular_no || 'GGSIPU/NOTICES/2026')}</div>
        </div>
        <div class="notice-open-btn" title="View Notice Reference">↗</div>
      </article>
    `;
  }).join('');

  host.querySelectorAll('.notice-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-notice-id');
      openNoticeModal(id);
    });
  });
}

// Render Departments / Exploration Grid
function renderDepartments(sections) {
  const container = document.getElementById('departmentGrid');
  if (!container) return;

  const symbols = ['◈', '⌘', '▣', '↗', '✓', '♡', '▤'];
  container.innerHTML = sections.map((section, index) => `
    <article class="department-card">
      <div class="department-top">
        <span class="department-number">SECTION 0${index + 1}</span>
        <span class="department-symbol">${symbols[index] || '◇'}</span>
      </div>
      <h3>${escapeHtml(section.title)}</h3>
      <div class="department-links">
        ${section.items.slice(0, 3).map((item) => `
          <a href="#quickSection" data-dummy-action="${escapeHtml(item.action_type || '')}" data-label="${escapeHtml(item.label)}">
            <span>${escapeHtml(item.label)}</span>
            <span>↗</span>
          </a>
        `).join('')}
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.department-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const action = link.getAttribute('data-dummy-action');
      const label = link.getAttribute('data-label');
      handleActionClick(action, label);
    });
  });
}

// Notice Search & Category Filters
function setupNoticeFilters() {
  const categories = [...new Set(allNotices.map((n) => n.category))].sort();
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="all">All categories</option>' +
    categories.map((c) => `<option value="${escapeHtml(c.toLowerCase())}">${escapeHtml(c)}</option>`).join('');

  if (categories.map(c => c.toLowerCase()).includes(currentVal)) {
    select.value = currentVal;
  }

  const applyFilters = async () => {
    const q = document.getElementById('noticeSearch').value.trim();
    const category = select.value;
    const roleParam = effectiveRole ? `&role=${effectiveRole}` : '';
    try {
      const result = await apiRequest(`/notices?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}${roleParam}`);
      renderNotices(result.data);
    } catch (err) {
      document.getElementById('noticeList').innerHTML = '<div class="loading-row">Unable to filter notices.</div>';
    }
  };

  document.getElementById('noticeSearch').oninput = applyFilters;
  select.onchange = applyFilters;
}

// Global Site Search Handler
function setupSearch() {
  const form = document.getElementById('siteSearch');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('globalSearch').value.trim();
    document.getElementById('noticeSearch').value = val;
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('notices-section')?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('noticeSearch').dispatchEvent(new Event('input'));
  });
}

// Mobile Menu
function setupMobileMenu() {
  const btn = document.getElementById('mobileMenu');
  const nav = document.getElementById('navItems');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('show');
    btn.setAttribute('aria-expanded', String(isOpen));
  });
}

// Global Link Interceptor: Prevent ANY navigation to external original IPU website
function setupGlobalLinkInterception() {
  document.addEventListener('click', (e) => {
    const targetLink = e.target.closest('a');
    if (!targetLink) return;

    const href = targetLink.getAttribute('href') || '';

    // If it's an external link to ipu.ac.in or external domain
    if (href.startsWith('http://') || href.startsWith('https://') || href.includes('ipu.ac.in')) {
      e.preventDefault();
      e.stopPropagation();
      showToast('ℹ External Redirect Intercepted: Browsing is kept within your local reference prototype.');
      
      // If the link has data-dummy-action, trigger it
      const action = targetLink.getAttribute('data-dummy-action');
      if (action) {
        handleActionClick(action, targetLink.textContent.trim());
      }
      return false;
    }

    // If it's a dummy # action
    if (targetLink.hasAttribute('data-dummy-action')) {
      const action = targetLink.getAttribute('data-dummy-action');
      e.preventDefault();
      handleActionClick(action, targetLink.textContent.trim());
      return false;
    }
  }, true);
}

// Setup Event Listeners for Authentication, Quick Personas, and Forms
function setupEventHandlers() {
  // Demo Login Buttons in Modal
  document.querySelectorAll('.demo-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const user = btn.getAttribute('data-user');
      const pass = btn.getAttribute('data-pass');
      loginUser(user, pass);
    });
  });

  // Top Persona Quick Switch Pills
  document.querySelectorAll('.role-pill-btn').forEach((pill) => {
    pill.addEventListener('click', () => {
      const role = pill.getAttribute('data-demo');
      switchRoleDemo(role);
    });
  });

  // Tabs in Auth Modal
  const tabSignIn = document.getElementById('tabSignInBtn');
  const tabSignUp = document.getElementById('tabSignUpBtn');
  const formSignIn = document.getElementById('signInForm');
  const formSignUp = document.getElementById('signUpForm');

  tabSignIn?.addEventListener('click', () => {
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    formSignIn.style.display = 'flex';
    formSignUp.style.display = 'none';
  });

  tabSignUp?.addEventListener('click', () => {
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    formSignUp.style.display = 'flex';
    formSignIn.style.display = 'none';
  });

  // Sign In Form Submission
  formSignIn?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    loginUser(u, p);
  });

  // Sign Up Form Submission
  formSignUp?.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = document.getElementById('regRole').value;
    const name = document.getElementById('regFullName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const departmentOrProgram = document.getElementById('regDepartment').value.trim();
    const enrollmentOrId = document.getElementById('regEnrollment').value.trim();

    registerUserAccount({
      role,
      name,
      username,
      password,
      departmentOrProgram,
      enrollmentOrId
    });
  });

  // Admin Create Notice Form
  const createNoticeForm = document.getElementById('createNoticeForm');
  createNoticeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('noticeFormTitle').value.trim();
    const category = document.getElementById('noticeFormCategory').value;
    const targetRole = document.getElementById('noticeFormTargetRole').value;
    const circularNo = document.getElementById('noticeFormCircular').value.trim();
    const source = document.getElementById('noticeFormSource').value.trim();
    const content = document.getElementById('noticeFormContent').value.trim();

    try {
      await apiRequest('/notices', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          targetRole,
          circularNo,
          source,
          content,
          isNew: true
        })
      });

      closeModal('createNoticeModal');
      createNoticeForm.reset();
      showToast('Notice published successfully to SQLite database!');
      await refreshPortalData();
    } catch (err) {
      alert(err.message || 'Error publishing notice');
    }
  });

  document.getElementById('openCreateNoticeBtn')?.addEventListener('click', () => openModal('createNoticeModal'));

  // Side CTA button
  document.getElementById('sideCtaBtn')?.addEventListener('click', () => {
    handleActionClick('welfare_modal');
  });

  // Notice download simulated button
  document.getElementById('noticeDownloadDummyBtn')?.addEventListener('click', () => {
    showToast('📄 Download simulated: Official University Circular PDF saved locally.');
  });

  // Datesheet download simulated button
  document.getElementById('downloadDatesheetBtn')?.addEventListener('click', () => {
    showToast('⬇ Download simulated: Odd Semester 2026 Examination Schedule PDF saved.');
  });

  // Marksheet print button
  document.getElementById('printMarksheetBtn')?.addEventListener('click', () => {
    window.print();
  });

  // Semester tabs in Results Modal
  document.querySelectorAll('.sem-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const idx = parseInt(tab.getAttribute('data-sem'), 10);
      renderSemesterGrades(idx);
    });
  });

  // Footer About Prototype link
  document.getElementById('footerAboutSimBtn')?.addEventListener('click', () => {
    openGenericModal(
      'About This Prototype',
      `
      <p>This is an independent local reference system built to demonstrate role-based access control and persistent SQLite database integration for university portals.</p>
      <p><strong>Implemented Features:</strong></p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li>Zero external redirection – all university links are simulated locally.</li>
        <li>Native Node.js SQLite persistent database with seeded user accounts.</li>
        <li>Role-based content filtering for Students, Faculty, and Administrators.</li>
        <li>Interactive Results Grade Sheet, Exam Datesheet, and Notice Reader.</li>
      </ul>
      `,
      'ℹ',
      'Understood'
    );
  });
}

// Initializer
async function init() {
  setupModalDismissals();
  setupMobileMenu();
  setupSearch();
  setupGlobalLinkInterception();
  setupEventHandlers();
  await checkAuthSession();
}

init();
