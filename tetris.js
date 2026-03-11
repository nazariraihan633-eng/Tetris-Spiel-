const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;

const boardCanvas = document.getElementById('board');
const ctx = boardCanvas.getContext('2d');

const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

const scoreElem = document.getElementById('score');
const levelElem = document.getElementById('level');
const linesElem = document.getElementById('lines');
const statsElem = document.getElementById('stats');

// Board matrix: 0=empty, other= color string
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));

// Tetromino shapes & colors
const tetrominos = [
  { shape: [ [0,1], [1,1], [2,1], [3,1] ], color: '#00f0f0' }, // I
  { shape: [ [1,0], [2,0], [1,1], [2,1] ], color: '#ffff00' }, // O
  { shape: [ [1,0], [0,1], [1,1], [2,1] ], color: '#8000ff' }, // T
  { shape: [ [0,0], [0,1], [1,1], [2,1] ], color: '#ff8000' }, // L
  { shape: [ [2,0], [0,1], [1,1], [2,1] ], color: '#0000ff' }, // J
  { shape: [ [1,0], [2,0], [0,1], [1,1] ], color: '#00ff00' }, // S
  { shape: [ [0,0], [1,0], [1,1], [2,1] ], color: '#ff0000' }  // Z
];

function randomTetromino() {
  return JSON.parse(JSON.stringify(tetrominos[Math.floor(Math.random() * tetrominos.length)]));
}

let current = randomTetromino();
let next = randomTetromino();

let posX = 3;
let posY = 0;

let score = 0;
let level = 0;
let linesCleared = 0;

// Statistics: count how many times each piece landed
const statistics = {
  I: 0,
  O: 0,
  T: 0,
  L: 0,
  J: 0,
  S: 0,
  Z: 0
};

function getTetrominoName(t) {
  switch (t.color) {
    case '#00f0f0': return 'I';
    case '#ffff00': return 'O';
    case '#8000ff': return 'T';
    case '#ff8000': return 'L';
    case '#0000ff': return 'J';
    case '#00ff00': return 'S';
    case '#ff0000': return 'Z';
    default: return '?';
  }
}

function drawGrid() {
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  ctx.strokeStyle = '#0ff';
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL_SIZE);
    ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
    ctx.stroke();
  }
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL_SIZE, 0);
    ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
    ctx.stroke();
  }
}

function highlightCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
}

function drawBoard() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        highlightCell(x, y, board[y][x]);
      }
    }
  }
}

function drawPiece(tetromino, offsetX, offsetY) {
  tetromino.shape.forEach(([x, y]) => {
    highlightCell(x + offsetX, y + offsetY, tetromino.color);
  });
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  next.shape.forEach(([x, y]) => {
    nextCtx.fillStyle = next.color;
    nextCtx.fillRect((x + 1) * 20, (y + 1) * 20, 18, 18);
  });
}

function render() {
  drawGrid();
  drawBoard();
  drawPiece(current, posX, posY);
  drawNext();
  updateUI();
}

function updateUI() {
  scoreElem.textContent = score;
  levelElem.textContent = level;
  linesElem.textContent = linesCleared;
  updateStatistics();
}

function updateStatistics() {
  let html = '';
  for (const [key, val] of Object.entries(statistics)) {
    html += `${key}: ${val}<br>`;
  }
  statsElem.innerHTML = html;
}

function isCollision(newX, newY, shape = current.shape) {
  return shape.some(([x, y]) => {
    let bx = x + newX;
    let by = y + newY;
    return by >= ROWS || bx < 0 || bx >= COLS || (by >= 0 && board[by][bx]);
  });
}

function saveTetromino() {
  current.shape.forEach(([x, y]) => {
    let bx = x + posX;
    let by = y + posY;
    if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
      board[by][bx] = current.color;
    }
  });
  // Statistik erhöhen
  let name = getTetrominoName(current);
  if (statistics.hasOwnProperty(name)) statistics[name]++;
}

function clearFullRows() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
      y++;
    }
  }
  if (cleared > 0) {
    linesCleared += cleared;
    score += cleared * 100;
    level = Math.floor(linesCleared / 10);
  }
}

function rotateShape(shape) {
  return shape.map(([x, y]) => [y, -x]);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    if (!isCollision(posX - 1, posY)) posX--;
  } else if (e.key === 'ArrowRight') {
    if (!isCollision(posX + 1, posY)) posX++;
  } else if (e.key === 'ArrowDown') {
    moveDown();
  } else if (e.key === 'e' || e.key === 'E') {
    let rotated = rotateShape(current.shape);
    let oldShape = current.shape;
    current.shape = rotated;
    if (isCollision(posX, posY)) {
      current.shape = oldShape;
    }
  }
  render();
});

function moveDown() {
  if (!isCollision(posX, posY + 1)) {
    posY++;
  } else {
    saveTetromino();
    clearFullRows();
    if (isCollision(3, 0)) {
      alert('Game Over!');
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      score = 0;
      level = 0;
      linesCleared = 0;
      for (let key in statistics) statistics[key] = 0;
    }
    current = next;
    next = randomTetromino();
    posX = 3;
    posY = 0;
  }
}

let intervalId = setInterval(() => {
  moveDown();
  render();
}, 700);

render();