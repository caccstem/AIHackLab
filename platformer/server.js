const http = require('http');
const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 8080);
const roomCode = '6147';
const colors = ['#f29a55', '#65c8ff', '#cf7cff', '#ffe36e', '#72dc8c', '#ff7c9c', '#9c8cff'];
const players = new Map();
let nextPlayerId = 1;
let winner = null;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Skybound room server is running.');
});
const webSocketServer = new WebSocketServer({ server });

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of webSocketServer.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

function playerList() {
  return [...players.values()].map(({ socket, ...player }) => player);
}

webSocketServer.on('connection', (socket) => {
  socket.on('message', (rawMessage) => {
    let message;
    try { message = JSON.parse(rawMessage.toString()); } catch { return; }

    if (message.type === 'join') {
      if (message.code !== roomCode) {
        socket.send(JSON.stringify({ type: 'join-error', message: 'That code is not available.' }));
        return;
      }
      const playerNumber = nextPlayerId;
      const player = { id: `nico${playerNumber}`, name: playerNumber === 1 ? 'Nico' : `Nico${playerNumber}`, color: colors[(playerNumber - 1) % colors.length], x: 100, y: 1340, level: 1, socket };
      nextPlayerId += 1;
      players.set(socket, player);
      socket.send(JSON.stringify({ type: 'joined', player: { id: player.id, name: player.name, color: player.color }, players: playerList(), winner }));
      broadcast({ type: 'players', players: playerList() });
      return;
    }

    const player = players.get(socket);
    if (!player) return;

    if (message.type === 'state') {
      player.x = Number(message.x) || 0;
      player.y = Number(message.y) || 0;
      player.level = Number(message.level) || 1;
      broadcast({ type: 'players', players: playerList() });
    }

    if (message.type === 'finish' && !winner) {
      winner = { id: player.id, name: player.name, color: player.color };
      broadcast({ type: 'winner', winner });
    }
  });

  socket.on('close', () => {
    players.delete(socket);
    broadcast({ type: 'players', players: playerList() });
  });
});

server.listen(port, () => console.log(`Skybound room ${roomCode} listening on port ${port}`));
