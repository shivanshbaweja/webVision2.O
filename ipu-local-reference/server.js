const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { sections, quickLinks, notices } = require('./data');

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
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const normalizedPath = path.normalize(requestedPath).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, normalizedPath);

  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(file);
  });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (pathname === '/api/health') {
    sendJson(res, 200, { status: 'ok', app: 'IPU local reference replica', mode: 'mock-data' });
    return;
  }

  if (pathname === '/api/site-sections') {
    sendJson(res, 200, { count: sections.length, data: sections });
    return;
  }

  if (pathname === '/api/quick-links') {
    sendJson(res, 200, { count: quickLinks.length, data: quickLinks });
    return;
  }

  if (pathname === '/api/notices') {
    const search = (requestUrl.searchParams.get('q') || '').trim().toLowerCase();
    const category = (requestUrl.searchParams.get('category') || 'all').trim().toLowerCase();
    const filtered = notices.filter((notice) => {
      const matchesSearch = !search || `${notice.title} ${notice.category} ${notice.date}`.toLowerCase().includes(search);
      const matchesCategory = category === 'all' || notice.category.toLowerCase() === category;
      return matchesSearch && matchesCategory;
    });
    sendJson(res, 200, { count: filtered.length, data: filtered });
    return;
  }

  const noticeMatch = pathname.match(/^\/api\/notices\/([\w-]+)$/);
  if (noticeMatch) {
    const notice = notices.find((item) => item.id === noticeMatch[1]);
    if (!notice) {
      sendJson(res, 404, { error: 'Notice not found' });
      return;
    }
    sendJson(res, 200, { data: notice });
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`IPU local reference replica running at http://localhost:${PORT}`);
  console.log('Local API: /api/health, /api/site-sections, /api/quick-links, /api/notices');
});
