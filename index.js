const WebSocket = require('ws');
const http = require('http');

// Tạo HTTP server để Render không báo lỗi "Port timeout"
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Server WebSocket đang chạy... Hãy kết nối bằng giao thức wss://');
});

// Khởi tạo WebSocket Server gắn vào HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('--- Có kết nối mới ---');

  // Gửi thông báo ngay khi kết nối thành công
  ws.send('Kết nối thành công! Bạn gửi gì server sẽ trả lại nấy.');

  // Xử lý sự kiện nhận tin nhắn
  ws.on('message', (data) => {
    // Chuyển đổi dữ liệu nhận được sang chuỗi (string)
    const message = data.toString();
    console.log('Nhận được từ client:', message);

    // PHẢN HỒI LẠI (Echo): Gửi lại chính nội dung đó
    ws.send(`Server phản hồi: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client đã ngắt kết nối.');
  });

  ws.on('error', (error) => {
    console.error('Lỗi WebSocket:', error);
  });
});

// Lắng nghe cổng do Render cấp hoặc mặc định 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
