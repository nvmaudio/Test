const http = require('http');

const server = http.createServer((req, res) => {
  // Cấu hình Header để trình duyệt đọc được tiếng Việt
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  
  // Trả về dòng chữ này khi truy cập link HTTPS
  res.end('Chúc mừng! Server Node.js của bạn đã chạy online qua HTTPS thành công.');
});

// Render sẽ gán cổng tự động qua biến PORT
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is active on port ${PORT}`);
});
