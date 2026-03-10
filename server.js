import http from 'http';
import { WebSocketServer } from 'ws';
import { handler } from './build/handler.js';
import { addClient, removeClient, broadcast } from './src/lib/ws-clients.js';

// So the API route (running inside the handler) can broadcast
globalThis.__corpspeak_broadcast = broadcast;

const PORT = parseInt(process.env.PORT || '3000', 10);

// Handler is Polka middleware (req, res, next); wrap for createServer
const requestListener = (req, res) => {
  const next = (err) => {
    if (res.headersSent) return;
    res.statusCode = err?.status || 500;
    res.end(err?.message || 'Internal Server Error');
  };
  handler(req, res, next);
};

const server = http.createServer(requestListener);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const path = request.url?.split('?')[0];
  if (path === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  addClient(ws);
  ws.on('close', () => removeClient(ws));
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
