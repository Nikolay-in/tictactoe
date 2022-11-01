/* globals io */
const board = document.getElementById('board');
const chatForm = document.getElementById('chatForm');
const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('message');

document.getElementById('init-form').addEventListener('submit', onSubmit);
chatForm.addEventListener('submit', onChat);

let symbol = '';
let socket = null;

function onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const roomId = formData.get('room');

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
        socket.on('newGame', newGame);
        startGame();
    });

    socket.on('message', (msg) => {
        chatArea.value += `${msg}\n`;
    });

    socket.on('error', (err) => { alert(err); });
}


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



function startGame() {
    document.getElementById('init').style.display = 'none';
    board.style.display = 'inline-block';
    chatForm.classList.remove('invisible');
    board.addEventListener('click', onClick);

    newGame();
}

function newGame() {
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
    setTimeout(hasCombination, 0);
}

function hasCombination() {
    for (let combination of combinations) {
        const result = combination.map(pos => document.getElementById(pos).textContent).join('');

        if (result == 'XXX') {
            return endGame('X');
        } else if (result == 'OOO') {
            return endGame('O');
        }
    }
}

function endGame(winner) {
    const choice = confirm(`Player ${winner} wins!\nDo you want a rematch`);
    if (choice) {
        chatArea.value = '';
        socket.emit('newGame');
    }
}

function onChat(e) {
    e.preventDefault();
    if (messageInput.value !== '') {
        socket.emit('message', messageInput.value);
        messageInput.value = '';
    }
}