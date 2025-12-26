export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Vui lòng kết nối bằng WebSocket!', { status: 426 });
    }

    // Tạo cặp WebSocket: client (trình duyệt) và server (worker)
    const [client, server] = Object.values(new WebSocketPair());

    server.accept();

    // Sự kiện khi nhận tin nhắn
    server.addEventListener('message', event => {
      const message = event.data;
      console.log(`Đã nhận: ${message}`);

      // Phản hồi lại cho người gửi (Echo) để test
      server.send(`Server đã nhận: ${message} vào lúc ${new Date().toLocaleTimeString()}`);
      
      // Tại đây bạn có thể thêm fetch() để bắn sang host thật (cPanel)
      /*
      fetch('https://your-cpanel.com/api/log', {
        method: 'POST',
        body: JSON.stringify({ msg: message })
      });
      */
    });

    server.addEventListener('close', () => {
      console.log('Kết nối đã đóng');
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
