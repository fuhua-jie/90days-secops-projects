/* 开发用静态服务器：禁用缓存，方便迭代 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = fs.realpathSync(__dirname);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const target = path.resolve(ROOT, '.' + p);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    res.writeHead(403); return res.end('403');
  }
  fs.readFile(target, (err, data) => {
    if (err) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8642, '127.0.0.1', () => console.log('serving on http://127.0.0.1:8642'));
