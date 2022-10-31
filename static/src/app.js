/* globals io */

document.getElementById('init-form').addEventListener('submit', onSubmit);

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

    socket.on('error', (err) => { alert(err); });
}

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



function startGame() {
    const board = document.getElementById('board');
    document.getElementById('init').style.display = 'none';
    board.style.display = 'block';
    board.addEventListener('click', onClick);

    newGame();
}

function newGame() {
    [...document.querySelectorAll('.cell')].forEach(e => e.textContent = '');
}

function onClick(e) {
    if (e.target.classList.contains('cell')) {
        if (e.target.textContent == '') {
            const id = e.target.id;
            socket.emit('position', {
                id,
                symbol
            });
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
        socket.emit('newGame');
    }
}