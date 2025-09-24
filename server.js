const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // URL에서 쿼리 파라미터 제거 (예: ?v=3.4.26)
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = '.' + url.pathname;
  
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`404 Not Found: ${filePath} (Original URL: ${req.url})`);
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        console.log(`Server Error: ${error.code} for ${filePath}`);
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      console.log(`200 OK: ${filePath}`);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log('🚀 Phase 4 검증 서버가 실행되었습니다!');
  console.log(`📄 메인 앱: http://localhost:${PORT}/index.html`);
  console.log(`🔍 검증 테스트: http://localhost:${PORT}/test_phase4_verification.html`);
  console.log('⚠️  서버 종료: Ctrl+C');
});