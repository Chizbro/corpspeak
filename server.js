import http from 'http';
import { WebSocketServer } from 'ws';
import { handler } from './build/handler.js';
import { addClient, removeClient, broadcast } from './src/lib/ws-clients.js';

const useSupabase = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

// So the API route (running inside the handler) can broadcast (legacy only)
globalThis.__corpspeak_broadcast = useSupabase ? () => {} : broadcast;

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

if (!useSupabase) {
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
} else {
  server.on('upgrade', (request, socket) => {
    const path = request.url?.split('?')[0];
    if (path === '/ws') {
      socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
    }
    socket.destroy();
  });
}

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
