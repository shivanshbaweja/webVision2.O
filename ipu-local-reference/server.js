const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const db = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = req.headers['cookie'];
  if (cookies) {
    const match = cookies.match(/(?:^|;\s*)session_token=([a-f0-9]+)/);
    if (match) return match[1];
  }
  return null;
}

function resolveUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  return db.getUserByToken(token);
}

function serveStatic(req, res, pathname) {
  let requestedPath = pathname === '/' || pathname === '/login' ? '/index.html' : pathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      // Fallback for SPA routing if needed
      if (path.extname(filePath) === '') {
        const indexFallback = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexFallback, (errFallback, fallbackFile) => {
          if (!errFallback) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fallbackFile);
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(file);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const currentUser = resolveUser(req);
  const explicitRoleParam = requestUrl.searchParams.get('role');
  const effectiveRole = explicitRoleParam || (currentUser ? currentUser.role : null);

  // 1. Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      app: 'IPU Local Reference & Role-Based Portal',
      mode: 'sqlite-database',
      currentUser: currentUser ? { username: currentUser.username, role: currentUser.role } : null
    });
    return;
  }

  // 2. Auth: Current User Profile
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    if (!currentUser) {
      sendJson(res, 200, { authenticated: false, user: null });
      return;
    }
    sendJson(res, 200, { authenticated: true, user: currentUser });
    return;
  }

  // 3. Auth: Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { username, password } = body;
      if (!username || !password) {
        sendJson(res, 400, { error: 'Please provide both username and password.' });
        return;
      }
      const authResult = db.authenticateUser(username.trim(), password);
      if (!authResult) {
        sendJson(res, 401, { error: 'Invalid username or password. Try demo accounts below.' });
        return;
      }

      sendJson(res, 200, {
        success: true,
        token: authResult.token,
        user: authResult.user,
        message: `Welcome back, ${authResult.user.name}!`
      });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Error processing login.' });
    }
    return;
  }

  // 4. Auth: Register
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { username, password, role, name, email, departmentOrProgram, enrollmentOrId } = body;
      if (!username || !password || !name) {
        sendJson(res, 400, { error: 'Username, password, and full name are required.' });
        return;
      }
      const authResult = db.registerUser({
        username: username.trim(),
        password,
        role: role || 'student',
        name: name.trim(),
        email: email ? email.trim() : `${username.trim()}@ipu.ac.in`,
        departmentOrProgram: departmentOrProgram ? departmentOrProgram.trim() : 'General',
        enrollmentOrId: enrollmentOrId ? enrollmentOrId.trim() : 'N/A'
      });

      sendJson(res, 201, {
        success: true,
        token: authResult.token,
        user: authResult.user,
        message: 'Account created and logged in successfully!'
      });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Error during registration.' });
    }
    return;
  }

  // 5. Auth: Logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = extractToken(req);
    if (token) {
      db.removeSession(token);
    }
    sendJson(res, 200, { success: true, message: 'Logged out successfully.' });
    return;
  }

  // 6. Site Sections (Role-filtered)
  if (pathname === '/api/site-sections' && req.method === 'GET') {
    const sections = db.getSections(effectiveRole);
    sendJson(res, 200, {
      count: sections.length,
      roleApplied: effectiveRole || 'guest',
      data: sections
    });
    return;
  }

  // 7. Quick Links (Role-filtered)
  if (pathname === '/api/quick-links' && req.method === 'GET') {
    const links = db.getQuickLinks(effectiveRole);
    sendJson(res, 200, {
      count: links.length,
      roleApplied: effectiveRole || 'guest',
      data: links
    });
    return;
  }

  // 8. Notices List (Role-filtered)
  if (pathname === '/api/notices' && req.method === 'GET') {
    const search = (requestUrl.searchParams.get('q') || '').trim();
    const category = (requestUrl.searchParams.get('category') || 'all').trim();
    const filtered = db.getNotices(effectiveRole, search, category);
    sendJson(res, 200, {
      count: filtered.length,
      roleApplied: effectiveRole || 'guest',
      data: filtered
    });
    return;
  }

  // 9. Single Notice Details
  const noticeMatch = pathname.match(/^\/api\/notices\/([\w-]+)$/);
  if (noticeMatch && req.method === 'GET') {
    const notice = db.getNoticeById(noticeMatch[1]);
    if (!notice) {
      sendJson(res, 404, { error: 'Notice not found' });
      return;
    }
    sendJson(res, 200, { data: notice });
    return;
  }

  // 10. Admin Create Notice
  if (pathname === '/api/notices' && req.method === 'POST') {
    if (!currentUser || currentUser.role !== 'admin') {
      sendJson(res, 403, { error: 'Only administrators can publish university notices.' });
      return;
    }
    try {
      const body = await readBody(req);
      const newNotice = db.createNotice(body);
      sendJson(res, 201, { success: true, data: newNotice });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Failed to create notice.' });
    }
    return;
  }

  // 11. Student Academic Record / Results Simulation
  if (pathname === '/api/student/academic-record' && req.method === 'GET') {
    const requestedUserId = currentUser ? currentUser.id : 1; // default to student id 1 for demo
    const record = db.getStudentAcademicRecord(requestedUserId);
    if (!record) {
      // Fallback demo student record
      const demoRecord = db.getStudentAcademicRecord(1);
      sendJson(res, 200, { data: demoRecord });
      return;
    }
    sendJson(res, 200, { data: record });
    return;
  }

  // Fallback to static files
  if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res, pathname);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`IPU Local Reference & Role-Based Portal running at http://localhost:${PORT}`);
  console.log('Database: SQLite persistent store with role-based authentication');
  console.log('Local API: /api/health, /api/auth/login, /api/site-sections, /api/quick-links, /api/notices, /api/student/academic-record');
});
