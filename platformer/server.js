const http = require('http');
const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 8080);
const colors = ['#f29a55', '#65c8ff', '#cf7cff', '#ffe36e', '#72dc8c', '#ff7c9c', '#9c8cff'];
const rooms = new Map();
let nextPlayerId = 1;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Skybound room server is running.');
});
const webSocketServer = new WebSocketServer({ server });

function broadcast(room, message) {
  const payload = JSON.stringify(message);
  for (const client of room.players.keys()) {
    if (client.readyState === 1) client.send(payload);
  }
}

function playerList(room) {
  return [...room.players.values()].map(({ socket, ...player }) => player);
}

webSocketServer.on('connection', (socket) => {
  socket.on('message', (rawMessage) => {
    let message;
    try { message = JSON.parse(rawMessage.toString()); } catch { return; }

    if (message.type === 'host' || message.type === 'join') {
      const code = String(message.code || '').trim().toLowerCase();
      if (!/^[a-z0-9]{4,24}$/.test(code)) {
        socket.send(JSON.stringify({ type: 'room-error', message: 'Use 4-24 letters or numbers for the code.' }));
        return;
      }
      let room = rooms.get(code);
      if (message.type === 'host' && room) {
        socket.send(JSON.stringify({ type: 'room-error', message: 'That game code is already in use.' }));
        return;
      }
      if (message.type === 'join' && !room) {
        socket.send(JSON.stringify({ type: 'room-error', message: 'That game is not available.' }));
        return;
      }
      if (!room) { room = { players: new Map(), winner: null }; rooms.set(code, room); }
      const playerNumber = nextPlayerId;
      const player = { id: `nico${playerNumber}`, name: playerNumber === 1 ? 'Nico' : `Nico${playerNumber}`, color: colors[(playerNumber - 1) % colors.length], x: 100, y: 1340, level: 1, socket };
      nextPlayerId += 1;
      socket.room = room;
      socket.roomCode = code;
      room.players.set(socket, player);
      socket.send(JSON.stringify({ type: 'joined', code, player: { id: player.id, name: player.name, color: player.color }, players: playerList(room), winner: room.winner }));
      broadcast(room, { type: 'players', players: playerList(room) });
      return;
    }

    const room = socket.room;
    const player = room?.players.get(socket);
    if (!player) return;

    if (message.type === 'state') {
      player.x = Number(message.x) || 0;
      player.y = Number(message.y) || 0;
      player.level = Number(message.level) || 1;
      broadcast(room, { type: 'players', players: playerList(room) });
    }

    if (message.type === 'finish' && !room.winner) {
      room.winner = { id: player.id, name: player.name, color: player.color };
      broadcast(room, { type: 'winner', winner: room.winner });
    }
  });

  socket.on('close', () => {
    const room = socket.room;
    if (!room) return;
    room.players.delete(socket);
    broadcast(room, { type: 'players', players: playerList(room) });
    if (room.players.size === 0) rooms.delete(socket.roomCode);
  });
});

server.listen(port, () => console.log(`Skybound room server listening on port ${port}`));
