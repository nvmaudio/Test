// worker.js
export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Vui lòng kết nối qua WebSocket', { status: 426 });
    }

    // Tạo cặp WebSocket
    const [client, server] = Object.values(new WebSocketPair());

    server.accept();
    
    server.addEventListener('message', event => {
      // Echo tin nhắn lại để test
      server.send(`Server nhận được: ${event.data}`);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
};
