const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// Boljši scale za telefon
const SCALE = Math.min(WIDTH / 420, HEIGHT / 680);

let baseSpeed = 4.8;
let currentSpeed = baseSpeed;
let currentGap = 195;           // večji začetni gap za telefon

const GRAVITY = 0.72;
const FLAP_STRENGTH = -11.2;
const PIPE_WIDTH = 82 * SCALE;

let bird = {
    x: WIDTH * 0.22,
    y: HEIGHT * 0.42,
    width: 48 * SCALE,
    height: 36 * SCALE,
    velocity: 0,
    rotation: 0
};

let pipes = [];
let score = 0;
let highScores = JSON.parse(localStorage.getItem("flappyHighScores")) || [];
let gameOver = false;
let started = false;
let paused = false;
let frame = 0;
let pipeSpawnCounter = 0;

// ================== BACKGROUND ==================
function drawBackground() {
    ctx.fillStyle = "#70c5ee";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.ellipse(WIDTH*0.25, HEIGHT*0.25, 70*SCALE, 40*SCALE, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(WIDTH*0.8, HEIGHT*0.18, 85*SCALE, 45*SCALE, 0, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, HEIGHT - 95 * SCALE, WIDTH, 95 * SCALE);
    ctx.fillStyle = "#5cb85c";
    ctx.fillRect(0, HEIGHT - 115 * SCALE, WIDTH, 28 * SCALE);
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);

    ctx.fillStyle = "#f7d51d";
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);

    ctx.fillStyle = "#e0b000";
    ctx.fillRect(-bird.width / 2 + 6, -bird.height / 2 - 9, bird.width * 0.58, 16 * SCALE);

    ctx.fillStyle = "#ff6600";
    ctx.fillRect(bird.width / 2 - 6, -6 * SCALE, 20 * SCALE, 13 * SCALE);

    ctx.fillStyle = "white";
    ctx.fillRect(6 * SCALE, -13 * SCALE, 16 * SCALE, 16 * SCALE);
    ctx.fillStyle = "#222";
    ctx.fillRect(11 * SCALE, -10 * SCALE, 8 * SCALE, 8 * SCALE);

    ctx.restore();
}

function spawnPipe() {
    const minHeight = 75 * SCALE;
    const maxHeight = HEIGHT - currentGap * SCALE - 180 * SCALE;

    let topHeight;
    if (pipeSpawnCounter < 4) {
        const base = minHeight + (maxHeight - minHeight) * 0.48;
        topHeight = base + (Math.random() - 0.5) * 55 * SCALE;
    } else {
        const rand = Math.random();
        if (rand < 0.20) topHeight = minHeight + (maxHeight - minHeight) * (0.06 + Math.random() * 0.20);
        else if (rand < 0.42) topHeight = minHeight + (maxHeight - minHeight) * (0.70 + Math.random() * 0.22);
        else if (rand < 0.68) topHeight = minHeight + (maxHeight - minHeight) * (0.30 + Math.random() * 0.20);
        else topHeight = minHeight + (maxHeight - minHeight) * (0.55 + Math.random() * 0.20);

        topHeight += (Math.random() - 0.5) * 35 * SCALE;
    }

    topHeight = Math.max(minHeight, Math.min(maxHeight, topHeight));
    pipes.push({ x: WIDTH + 50, top: topHeight, passed: false });
    pipeSpawnCounter++;
}

function update() {
    if (!started || gameOver || paused) return;

    const level = Math.floor(score / 8);
    currentSpeed = baseSpeed + level * 0.52;
    currentSpeed = Math.min(currentSpeed, 9.8);

    currentGap = 195 - level * 12;
    currentGap = Math.max(105, currentGap);

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 4.0, -32), 90);

    const spawnRate = Math.max(24, 55 - level * 6);
    if (frame % spawnRate === 0) spawnPipe();

    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= currentSpeed * SCALE;

        if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
            p.passed = true;
            score++;
        }

        if (bird.x + bird.width > p.x && bird.x < p.x + PIPE_WIDTH &&
            (bird.y + 10*SCALE < p.top || bird.y + bird.height - 10*SCALE > p.top + currentGap*SCALE)) {
            gameOver = true;
            saveHighScore();
        }

        if (p.x < -PIPE_WIDTH) pipes.splice(i, 1);
    }

    if (bird.y < 0 || bird.y + bird.height > HEIGHT - 95 * SCALE) {
        gameOver = true;
        saveHighScore();
    }

    frame++;
}

function saveHighScore() {
    if (score > 0) {
        highScores.push(score);
        highScores.sort((a,b) => b - a);
        highScores = highScores.slice(0, 5);
        localStorage.setItem("flappyHighScores", JSON.stringify(highScores));
    }
}

// draw funkcija ostane enaka kot prej (lahko jo skopiraš iz prejšnje kode)

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controls (boljši za telefon)
function flap() {
    if (!started) started = true;
    if (!gameOver && !paused) bird.velocity = FLAP_STRENGTH;
}

function togglePause() {
    if (started && !gameOver) paused = !paused;
}

canvas.addEventListener("click", () => {
    if (gameOver) resetGame();
    else if (paused) paused = false;
    else flap();
});

canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameOver) resetGame();
    else if (paused) paused = false;
    else flap();
});

document.addEventListener("keydown", e => {
    if (e.code === "Space") flap();
    if (e.code === "KeyP") togglePause();
    if (e.code === "KeyR" && gameOver) resetGame();
});

function resetGame() {
    bird.y = HEIGHT * 0.45;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    currentSpeed = baseSpeed;
    currentGap = 188;
    gameOver = false;
    paused = false;
    frame = 0;
    pipeSpawnCounter = 0;
    started = false;
}

gameLoop();
