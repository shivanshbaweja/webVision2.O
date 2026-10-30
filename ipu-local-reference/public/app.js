const API = '/api';
const OFFICIAL_NOTICE_PAGE = 'https://www.ipu.ac.in/notices.php';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

async function getJson(endpoint) {
  const response = await fetch(`${API}${endpoint}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function renderNavigation(sections) {
  const host = document.getElementById('navSections');
  host.innerHTML = sections.map((section) => `
    <div class="nav-entry">
      <button class="nav-trigger" type="button" aria-expanded="false">${escapeHtml(section.title)}</button>
      <div class="dropdown">
        ${section.items.map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)} ↗</a>`).join('')}
      </div>
    </div>
  `).join('');

  host.querySelectorAll('.nav-trigger').forEach((button) => {
    button.addEventListener('click', () => {
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
}

function renderQuickLinks(items) {
  document.getElementById('quickLinks').innerHTML = items.map((item) => `
    <a class="quick-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
      <div class="quick-icon tone-${escapeHtml(item.tone)}">${escapeHtml(item.icon)}</div>
      <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div>
      <span class="quick-arrow">↗</span>
    </a>
  `).join('');
}

function renderDepartments(sections) {
  const symbols = ['◈', '⌘', '▣', '↗', '✓', '♡', '▤'];
  document.getElementById('departmentGrid').innerHTML = sections.map((section, index) => `
    <article class="department-card">
      <div class="department-top"><span class="department-number">SECTION 0${index + 1}</span><span class="department-symbol">${symbols[index] || '◇'}</span></div>
      <h3>${escapeHtml(section.title)}</h3>
      <div class="department-links">
        ${section.items.slice(0, 3).map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`).join('')}
      </div>
    </article>
  `).join('');
}

let allNotices = [];

function renderNotices(items) {
  const host = document.getElementById('noticeList');
  document.getElementById('noticeCount').textContent = `Showing ${items.length} sample notices`;
  if (!items.length) {
    host.innerHTML = '<div class="empty-state">No matching notices in this local sample. Try another keyword or category.</div>';
    return;
  }
  host.innerHTML = items.map((notice) => {
    const [day, month, year] = notice.date.split(' ');
    return `
      <article class="notice-row">
        <div class="notice-date"><strong>${escapeHtml(day)}</strong>${escapeHtml(month)}<br>${escapeHtml(year)}</div>
        <div class="notice-info">
          <div class="notice-meta"><span class="category-label">${escapeHtml(notice.category)}</span>${notice.isNew ? '<span class="new-label">● NEW</span>' : ''}</div>
          <a href="${escapeHtml(notice.url)}" target="_blank" rel="noreferrer"><h3>${escapeHtml(notice.title)}</h3></a>
          <div class="notice-source">${escapeHtml(notice.source)}</div>
        </div>
        <a class="notice-open" href="${escapeHtml(notice.url)}" target="_blank" rel="noreferrer" aria-label="Open original notice">↗</a>
      </article>
    `;
  }).join('');
}

function setupNoticeFilters() {
  const categories = [...new Set(allNotices.map((notice) => notice.category))].sort();
  const select = document.getElementById('categoryFilter');
  select.innerHTML = '<option value="all">All categories</option>' + categories.map((category) => `<option value="${escapeHtml(category.toLowerCase())}">${escapeHtml(category)}</option>`).join('');

  const applyFilters = async () => {
    const q = document.getElementById('noticeSearch').value.trim();
    const category = select.value;
    try {
      const result = await getJson(`/notices?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
      renderNotices(result.data);
    } catch (error) {
      document.getElementById('noticeList').innerHTML = '<div class="empty-state">Unable to load notices. Check that the local server is running.</div>';
    }
  };
  document.getElementById('noticeSearch').addEventListener('input', applyFilters);
  select.addEventListener('change', applyFilters);
}

function setupSearch() {
  const form = document.getElementById('siteSearch');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = document.getElementById('globalSearch').value.trim();
    document.getElementById('noticeSearch').value = value;
    document.getElementById('categoryFilter').value = 'all';
    document.querySelector('.notice-band').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('noticeSearch').dispatchEvent(new Event('input'));
  });
}

function setupMobileMenu() {
  const button = document.getElementById('mobileMenu');
  const nav = document.getElementById('navItems');
  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('show');
    button.setAttribute('aria-expanded', String(isOpen));
  });
}

async function init() {
  setupMobileMenu();
  setupSearch();
  try {
    const [sectionResult, quickResult, noticeResult] = await Promise.all([
      getJson('/site-sections'), getJson('/quick-links'), getJson('/notices')
    ]);
    renderNavigation(sectionResult.data);
    renderDepartments(sectionResult.data);
    renderQuickLinks(quickResult.data);
    allNotices = noticeResult.data;
    renderNotices(allNotices);
    setupNoticeFilters();
  } catch (error) {
    console.error(error);
    document.getElementById('quickLinks').innerHTML = '<div class="loading-card">Could not load local API data. Start the project using <strong>node server.js</strong>.</div>';
    document.getElementById('noticeList').innerHTML = '<div class="empty-state">Local API unavailable.</div>';
  }
}

init();
