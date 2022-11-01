const initDiv = document.getElementById('init');
const board = document.getElementById('board');
const game = document.getElementById('game');
const chatForm = document.getElementById('chatForm');
const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('message');
const roomName = document.getElementById('roomname');

document.getElementById('init-form').addEventListener('submit', onSubmit);
document.getElementById('leave').addEventListener('click', onLeave);
chatForm.addEventListener('submit', onChat);

let symbol = '';
let socket = null;

const combinations = [
    ['00', '01', '02'],
    ['10', '11', '12'],
    ['20', '21', '22'],
    ['00', '10', '20'],
    ['01', '11', '21'],
    ['02', '12', '22'],
    ['00', '11', '22'],
    ['02', '11', '20']
];

function onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roomId = formData.get('room');
    roomName.textContent = roomId;
    init(roomId);
}

function init(roomId) {
    socket = io();

    socket.on('connect', () => {
        socket.emit('selectRoom', roomId);
    });

    socket.on('symbol', newSymbol => {
        symbol = newSymbol;
        socket.on('position', place);
        socket.on('newGame', clearBoard);
        startGame();
    });

    socket.on('message', (msg) => {
        chatArea.value += `${msg}\n`;
        chatArea.scrollTop = chatArea.scrollHeight;
    });

    socket.on('boardStatus', (status) => {
        if (status == true) {
            board.classList.remove('inactive');
        } else {
            board.classList.add('inactive');
        }
    });

    socket.on('error', (err) => { alert(err); });
}

function startGame() {
    initDiv.style.display = 'none';
    game.classList.remove('invisible');
    board.addEventListener('click', onClick);
    clearBoard();
}

function clearBoard() {
    [...document.querySelectorAll('.cell')].forEach(e => e.textContent = '');
}

function onClick(e) {
    if (e.target.classList.contains('cell') && board.classList.contains('inactive') == false) {
        if (e.target.textContent == '') {
            const id = e.target.id;
            socket.emit('position', {
                id,
                symbol
            });
            board.classList.add('inactive');
        }
    }
}

function place(data) {
    document.getElementById(data.id).textContent = data.symbol;
    if (data.symbol != symbol) {
        board.classList.remove('inactive');

    }
    setTimeout(hasCombination, 0);
}

function hasCombination() {
    let draw = true;

    for (let combination of combinations) {
        const result = combination.map(pos => document.getElementById(pos).textContent).join('');

        if (result == 'XXX') {
            return endGame('X');
        } else if (result == 'OOO') {
            return endGame('O');
        }

        if (result.length < 3) {
            draw = false;
        }
    }

    if (draw == true) {
        endGame('draw');
    }
}

function endGame(winner) {
    let msg;
    if (winner == 'draw') {
        msg = `Game ended as draw!\nDo you want a rematch?`;
    } else {
        msg = `Player ${winner} wins!\nDo you want a rematch?`;
    }

    const choice = confirm(msg);

    if (choice) {
        socket.emit('newGame', true);
        clearBoard();
    } else {
        onLeave();
    }
}

function onChat(e) {
    e.preventDefault();
    if (messageInput.value !== '') {
        socket.emit('message', messageInput.value);
        messageInput.value = '';
    }
};

function onLeave() {
    chatArea.value = '';
    socket.disconnect();
    initDiv.style.display = '';
    game.classList.add('invisible');
    board.classList.add('inactive');
    clearBoard();
}