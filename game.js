const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
let gameState = 'waiting'; // waiting, playing, gameOver
let score = 0;
let highScore = localStorage.getItem('flappyGregHighScore') || 0;
let frameCount = 0;

// Greg (the player)
const greg = {
    x: 150,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    gravity: 0.6,
    jumpPower: -12,
    rotation: 0
};

// Pipes
let pipes = [];
const pipeWidth = 80;
const pipeGap = 180;
const pipeSpeed = 3;

// Particles for poop effects
let particles = [];

// Initialize high score display
document.getElementById('highScore').textContent = highScore;

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleInput();
    }
});

canvas.addEventListener('click', handleInput);

function handleInput() {
    if (gameState === 'waiting') {
        startGame();
    } else if (gameState === 'playing') {
        gregJump();
    } else if (gameState === 'gameOver') {
        resetGame();
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    greg.y = canvas.height / 2;
    greg.velocity = 0;
    pipes = [];
    particles = [];
    document.querySelector('.instructions').style.display = 'none';
    addPipe();
}

function gregJump() {
    greg.velocity = greg.jumpPower;
    
    // Add poop particles!
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: greg.x - 10,
            y: greg.y + greg.height,
            vx: Math.random() * -4 - 2,
            vy: Math.random() * 4 - 2,
            life: 30,
            maxLife: 30
        });
    }
}

function addPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        bottomHeight: canvas.height - (topHeight + pipeGap),
        passed: false
    });
}

function updateGame() {
    if (gameState !== 'playing') return;
    
    frameCount++;
    
    // Update Greg
    greg.velocity += greg.gravity;
    greg.y += greg.velocity;
    
    // Greg's rotation based on velocity
    greg.rotation = Math.min(Math.max(greg.velocity * 3, -30), 90);
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3; // gravity on poop
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    // Update pipes
    pipes.forEach((pipe, index) => {
        pipe.x -= pipeSpeed;
        
        // Score when passing pipe
        if (!pipe.passed && pipe.x + pipeWidth < greg.x) {
            pipe.passed = true;
            score++;
            document.getElementById('score').textContent = score;
        }
        
        // Remove off-screen pipes
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(index, 1);
        }
        
        // Check collision
        if (checkCollision(greg, pipe)) {
            gameOver();
        }
    });
    
    // Add new pipes
    if (frameCount % 120 === 0) {
        addPipe();
    }
    
    // Check if Greg hit ground or ceiling
    if (greg.y + greg.height > canvas.height || greg.y < 0) {
        gameOver();
    }
}

function checkCollision(greg, pipe) {
    if (greg.x + greg.width > pipe.x && greg.x < pipe.x + pipeWidth) {
        if (greg.y < pipe.topHeight || greg.y + greg.height > pipe.bottomY) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameState = 'gameOver';
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyGregHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function resetGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.querySelector('.instructions').style.display = 'block';
    gameState = 'waiting';
    frameCount = 0;
}

function drawGreg() {
    ctx.save();
    ctx.translate(greg.x + greg.width/2, greg.y + greg.height/2);
    ctx.rotate(greg.rotation * Math.PI / 180);
    
    // Draw Greg's body (brown oval)
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.ellipse(0, 0, greg.width/2, greg.height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw Greg's eyes (always terrified)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-8, -5, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -5, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(-8, -3, 2, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(8, -3, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw mouth (screaming)
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(0, 5, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawPipes() {
    ctx.fillStyle = '#228B22';
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
        
        // Pipe caps
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipeWidth + 10, 30);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 30);
        ctx.fillStyle = '#228B22';
    });
}

function drawParticles() {
    particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Draw poop particle
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function drawBackground() {
    // Sky and ground already set in CSS
    
    // Draw some clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const x = (frameCount * 0.5 + i * 200) % (canvas.width + 100) - 50;
        const y = 50 + i * 30;
        
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw everything
    drawBackground();
    drawPipes();
    drawParticles();
    drawGreg();
    
    // Update game state
    updateGame();
    
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();