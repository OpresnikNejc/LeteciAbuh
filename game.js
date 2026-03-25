const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const SCALE = Math.min(WIDTH / 400, HEIGHT / 600);

let baseSpeed = 4.7;
let currentSpeed = baseSpeed;
let currentGap = 188;

const GRAVITY = 0.68;
const FLAP_STRENGTH = -10.5;
const PIPE_WIDTH = 78 * SCALE;

let bird = {
    x: WIDTH * 0.25,
    y: HEIGHT * 0.45,
    width: 46 * SCALE,
    height: 34 * SCALE,
    velocity: 0,
    rotation: 0
};

let pipes = [];
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let gameOver = false;
let started = false;
let frame = 0;
let pipeSpawnCounter = 0;

function resize() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    bird.x = WIDTH * 0.25;
}
window.addEventListener("resize", resize);

function drawBackground() {
    ctx.fillStyle = "#70c5ee";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, HEIGHT - 90 * SCALE, WIDTH, 90 * SCALE);
    ctx.fillStyle = "#5cb85c";
    ctx.fillRect(0, HEIGHT - 105 * SCALE, WIDTH, 25 * SCALE);
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation * Math.PI / 180);

    ctx.fillStyle = "#f7d51d";
    ctx.fillRect(-bird.width / 2, -bird.height / 2, bird.width, bird.height);

    ctx.fillStyle = "#e0b000";
    ctx.fillRect(-bird.width / 2 + 5, -bird.height / 2 - 8, bird.width * 0.6, 15 * SCALE);

    ctx.fillStyle = "#ff6600";
    ctx.fillRect(bird.width / 2 - 5, -5 * SCALE, 18 * SCALE, 12 * SCALE);

    ctx.fillStyle = "white";
    ctx.fillRect(5 * SCALE, -12 * SCALE, 14 * SCALE, 14 * SCALE);
    ctx.fillStyle = "#222";
    ctx.fillRect(10 * SCALE, -9 * SCALE, 7 * SCALE, 7 * SCALE);

    ctx.restore();
}

function spawnPipe() {
    const minHeight = 70 * SCALE;
    const maxHeight = HEIGHT - currentGap * SCALE - 165 * SCALE;

    let topHeight;

    if (pipeSpawnCounter < 4) {
        const base = minHeight + (maxHeight - minHeight) * 0.5;
        topHeight = base + (Math.random() - 0.5) * 50 * SCALE;
    } else {
        const rand = Math.random();
        if (rand < 0.22) topHeight = minHeight + (maxHeight - minHeight) * (0.08 + Math.random() * 0.22);
        else if (rand < 0.45) topHeight = minHeight + (maxHeight - minHeight) * (0.68 + Math.random() * 0.22);
        else if (rand < 0.70) topHeight = minHeight + (maxHeight - minHeight) * (0.28 + Math.random() * 0.20);
        else topHeight = minHeight + (maxHeight - minHeight) * (0.52 + Math.random() * 0.20);

        topHeight += (Math.random() - 0.5) * 32 * SCALE;
    }

    topHeight = Math.max(minHeight, Math.min(maxHeight, topHeight));

    pipes.push({
        x: WIDTH + 40,
        top: topHeight,
        passed: false
    });

    pipeSpawnCounter++;
}

function update() {
    if (!started || gameOver) return;

    const level = Math.floor(score / 8);

    currentSpeed = baseSpeed + level * 0.55;
    currentSpeed = Math.min(currentSpeed, 10.5);

    currentGap = 188 - level * 13;
    currentGap = Math.max(92, currentGap);

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 4.2, -35), 90);

    // ================== RAZMIK MED OVirami (stebri) - ZMANJŠAN ZA POL ==================
    const baseSpawnRate = 52;                    // začetni razmik (zmanjšan za približno polovico)
    const spawnRate = Math.max(22, baseSpawnRate - level * 7);   // postopno še tesneje

    if (frame % spawnRate === 0) {
        spawnPipe();
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= currentSpeed * SCALE;

        if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
            p.passed = true;
            score++;
        }

        if (
            bird.x + bird.width > p.x && bird.x < p.x + PIPE_WIDTH &&
            (bird.y + 8 * SCALE < p.top || bird.y + bird.height - 8 * SCALE > p.top + currentGap * SCALE)
        ) {
            gameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem("flappyHighScore", highScore);
            }
        }

        if (p.x < -PIPE_WIDTH) pipes.splice(i, 1);
    }

    if (bird.y < 0 || bird.y + bird.height > HEIGHT - 90 * SCALE) {
        gameOver = true;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("flappyHighScore", highScore);
        }
    }

    frame++;
}

function draw() {
    drawBackground();

    ctx.fillStyle = "#5cb85c";
    for (let p of pipes) {
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
        ctx.fillRect(p.x, p.top + currentGap * SCALE, PIPE_WIDTH, HEIGHT);
    }

    drawBird();

    ctx.fillStyle = "white";
    ctx.font = `bold ${50 * SCALE}px Arial`;
    ctx.textAlign = "right";
    ctx.shadowBlur = 10;
    ctx.fillText("Score: " + score, WIDTH - 35 * SCALE, 75 * SCALE);

    ctx.font = `bold ${29 * SCALE}px Arial`;
    ctx.fillText("High Score: " + highScore, WIDTH - 35 * SCALE, 112 * SCALE);
    ctx.shadowBlur = 0;

    if (gameOver) {
        ctx.fillStyle = "rgba(5, 10, 35, 0.92)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.fillStyle = "#ff3333";
        ctx.font = `bold ${82 * SCALE}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT * 0.28);

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${50 * SCALE}px Arial`;
        ctx.fillText("Score: " + score, WIDTH / 2, HEIGHT * 0.46);

        ctx.fillStyle = "#ffdd33";
        ctx.font = `bold ${42 * SCALE}px Arial`;
        ctx.fillText("High Score: " + highScore, WIDTH / 2, HEIGHT * 0.55);

        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(WIDTH / 2 - 170 * SCALE, HEIGHT * 0.67, 340 * SCALE, 85 * SCALE);

        ctx.fillStyle = "#000000";
        ctx.font = `bold ${32 * SCALE}px Arial`;
        ctx.fillText("PONOVNO POSKUSI", WIDTH / 2, HEIGHT * 0.725);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function flap() {
    if (!started) started = true;
    if (!gameOver) bird.velocity = FLAP_STRENGTH;
}

function handleClick(e) {
    if (!gameOver) {
        flap();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const clickY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    const btnX = WIDTH / 2 - 170 * SCALE;
    const btnY = HEIGHT * 0.67;
    const btnW = 340 * SCALE;
    const btnH = 85 * SCALE;

    if (clickX > btnX && clickX < btnX + btnW && clickY > btnY && clickY < btnY + btnH) {
        resetGame();
    }
}

canvas.addEventListener("click", handleClick);
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    handleClick(e);
});

document.addEventListener("keydown", e => {
    if (e.code === "Space") flap();
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
    frame = 0;
    pipeSpawnCounter = 0;
}

gameLoop();