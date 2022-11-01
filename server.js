const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
app.use('/', express.static('static'));
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};
let rematchVotes = 0;

io.on('connect', socket => {
    socket.on('selectRoom', roomId => {
        if (rooms[roomId] == undefined) {
            rooms[roomId] = new Map();
        }
        const players = rooms[roomId];

        if (players.size >= 2) {
            socket.emit('error', 'Room is full!');
            socket.disconnect();
        } else {
            socket.join(roomId);

            initGame(roomId, players, socket);
        }
    });
});

function initGame(roomId, players, socket) {
    let symbol = 'X';
    if (players.size > 0) {
        const otherSymbol = [...players.values()][0];
        if (otherSymbol == 'X') {
            symbol = 'O';
        }
    }

    players.set(socket, symbol);
    socket.emit('symbol', symbol);

    io.to(roomId).emit('message', `Player ${players.get(socket)} has joined.`);

    socket.on('message', (msg) => {
        io.to(roomId).emit('message', `Player ${players.get(socket)}: ${msg}`);
    });

    socket.on('position', pos => {
        io.to(roomId).emit('position', pos);
    });

    socket.on('disconnect', onDisconnect);

    socket.on('newGame', newGame);

    function onDisconnect() {
        const player = players.get(socket);
        players.delete(socket);

        io.to(roomId).emit('message', `Player ${player} has left.`);
        io.to(roomId).emit('boardStatus', false);
        rematchVotes = 0;
    }

    function newGame(rematchConfirmation) {
        if (rematchConfirmation == true && players.size == 2) {
            rematchVotes++;
        }

        if (players.size == 1 || rematchVotes == 1) {
            socket.emit('message', `System: Awaiting opponent. Your symbol is: ${symbol}`);
            io.to(roomId).emit('boardStatus', false);
        } else if (players.size == 2 && rematchVotes == 0 || rematchVotes == 2) {
            socket.emit('message', `System: New Game initiated. Your symbol is: ${players.get(socket)}`);
            io.to(roomId).emit('message', `System: Game started!`);
            io.to(roomId).emit('boardStatus', true);
            io.to(roomId).emit('newGame');
            rematchVotes = 0;
        }
    }

    newGame();
}

server.listen(3000, () => console.log('Server started on: http://localhost:3000'));