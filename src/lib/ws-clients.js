/**
 * Shared WebSocket client set and broadcast. Loaded by server.js to add/remove
 * clients; server.js sets globalThis.__corpspeak_broadcast so the API route can broadcast.
 */
const clients = new Set();

/** @param {import('ws').WebSocket} ws */
export function addClient(ws) {
  clients.add(ws);
}

/** @param {import('ws').WebSocket} ws */
export function removeClient(ws) {
  clients.delete(ws);
}

/** @param {object} data */
export function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const ws of clients) {
    if (ws.readyState === 1) {
      ws.send(payload);
    }
  }
}
