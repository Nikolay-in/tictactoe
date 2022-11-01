const http = require('http');
const express = require('express');
const socketIO = require('socket.io');


const app = express();
app.use('/', express.static('static'));
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};

io.on('connect', socket => {
    console.log('Player connected');

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
    socket.on('position', pos => {
        console.log('Position:', pos);
        io.to(roomId).emit('position', pos);
    });

    socket.on('message', (msg) => {
        const msgFrom = players.get(socket);

        for (let eachSocket of players.keys()) {
            eachSocket.emit('message', `Player ${msgFrom}: ${msg}`);
        }
    });

    socket.on('newGame', () => {
        console.log('New game initiated');

        for (let [socket, symbol] of players.entries()) {
            socket.emit('message', `System: New Game initiated. Your symbol is: ${symbol}\n`);
        }

        io.to(roomId).emit('newGame');
    });

    socket.on('disconnect', () => {
        console.log('Player left');
        players.delete(socket);
    });

    let symbol = 'X';
    if (players.size > 0) {
        const otherSymbol = [...players.values()][0];
        if (otherSymbol == 'X') {
            symbol = 'O';
        }
    }

    players.set(socket, symbol);
    console.log('Symbol: ', symbol);
    socket.emit('symbol', symbol);
    socket.emit('message', `System: New Game initiated. Your symbol is: ${symbol}\n`);
}

server.listen(3000, () => console.log('Server started on 3000'));