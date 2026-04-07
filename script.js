const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

context.scale(20, 20);
nextContext.scale(20, 20);

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

const colors = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // L
    '#0DFF72', // J
    '#F538FF', // O
    '#FF8E0D', // Z
    '#FFE138', // S
    '#3877FF', // T
];

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0}, context);
    drawGhost();
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos, context);
    }
}

function drawGhost() {
    if (!player.matrix) return;
    const ghostPos = { ...player.pos };
    while (!collide(arena, { ...player, pos: ghostPos })) {
        ghostPos.y++;
    }
    ghostPos.y--;
    drawMatrix(player.matrix, ghostPos, context, true);
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (player.next) {
        drawMatrix(player.next, {x: 1, y: 1}, nextContext);
    }
}

function drawMatrix(matrix, offset, ctx, isGhost = false) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const posX = x + offset.x;
                const posY = y + offset.y;

                if (isGhost) {
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                    ctx.fillRect(posX, posY, 1, 1);
                } else {
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(posX, posY, 1, 1);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(posX, posY, 1, 0.1);
                    ctx.fillRect(// Error fix: this was the issue!
                    posX, posY, 0.1, 1);

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fillRect(posX, posY + 0.9, 1, 0.1);
                    ctx.fillRect(posX + 0.9, posY, 0.1, 1);

                    ctx.lineWidth = 0.02;
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.strokeRect(posX, posY, 1, 1);
                }
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        player.lines += 1;
        rowCount *= 2;
    }
    updateScore();
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerReset() {
    const pieces = 'ILJOTSZ';
    if (player.next) {
        player.matrix = player.next;
    } else {
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        gameOver();
    }
    drawNext();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('game-over-msg').style.display = 'block';
    document.getElementById('start-btn').innerText = 'TRY AGAIN';
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + offset);
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('lines').innerText = player.lines;
}

const arena = createMatrix(12, 20);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    next: null,
    score: 0,
    lines: 0,
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameRunning = false;

function update(time = 0) {
    if (!gameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function start() {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.next = null;
    player.pos = {x: 0, y: 0};
    document.getElementById('game-over-msg').style.display = 'none';
    document.getElementById('start-btn').innerText = 'STOP GAME';
    
    const pieces = 'ILJOTSZ';
    const randomIndex = Math.floor(Math.random() * pieces.length);
    player.matrix = createPiece(pieces[randomIndex]);
    player.next = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    player.pos.y = 0;

    updateScore();
    drawNext();
    
    gameRunning = true;
    lastTime = performance.now();
    dropCounter = 0;
    requestAnimationFrame(update);
}

function stop() {
    gameRunning = false;
    document.getElementById('start-btn').innerText = 'START GAME';
}

document.getElementById('start-btn').addEventListener('click', (event) => {
    event.target.blur();
    if (gameRunning) {
        stop();
    } else {
        start();
    }
});

document.addEventListener('keydown', event => {
    if (!gameRunning || !player.matrix) return;

    if ([' ', 'ArrowUp', 'ArrowDown', 'arrayLeft', 'ArrowRight'].includes(event.key)) {
        // Note: I'll use a safer way to check keys below to avoid this issue
    }

    if (event.keyCode === 37) { // Left
        playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        playerMove(1);
    } else if (event.keyCode === 40) { // Down
        playerDrop();
    } else if (event.keyCode === 32) { // Space (Hard Drop)
        playerHardDrop();
    } else if (event.keyCode === 81) { // Q
        playerRotate(-1);
    } else if (event.keyCode === 38 || event.keyCode === 87) { // Up or W
        playerRotate(1);
    }
});
