// Game Constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 5;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
const PLATFORM_HEIGHT = 10;

// Game State
let gameState = {
    currentScreen: 'main-menu',
    currentLevel: 1,
    isPaused: false,
    isMobile: false,
    player: null,
    platforms: [],
    canvas: null,
    ctx: null,
    keys: {
        left: false,
        right: false,
        up: false
    },
    gameWidth: 800,
    gameHeight: 600
};

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.color = '#ff6b6b';
    }

    update(platforms) {
        // Apply gravity
        this.velocityY += GRAVITY;

        // Handle horizontal movement
        if (gameState.keys.left) {
            this.velocityX = -PLAYER_SPEED;
        } else if (gameState.keys.right) {
            this.velocityX = PLAYER_SPEED;
        } else {
            this.velocityX = 0;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Check for collisions with platforms
        let onGround = false;
        for (const platform of platforms) {
            if (
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + platform.height &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.velocityY > 0
            ) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                onGround = true;
                this.isJumping = false;
            }
        }

        // Check for wall collisions
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > gameState.gameWidth) {
            this.x = gameState.gameWidth - this.width;
        }

        // Check if player fell off the screen
        if (this.y > gameState.gameHeight) {
            gameOver(false);
        }

        return onGround;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw eyes
        ctx.fillStyle = '#ffffff';
        const eyeOffset = this.velocityX > 0 ? 3 : -3;
        ctx.fillRect(this.x + this.width/2 - 2 + (this.velocityX > 0 ? 2 : 0), this.y + 8, 4, 4);
        ctx.fillRect(this.x + this.width/2 - 2 + (this.velocityX > 0 ? 6 : -4) + eyeOffset, this.y + 8, 4, 4);
    }
}

// Platform Class
class Platform {
    constructor(x, y, width, color = '#4ecdc4') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = PLATFORM_HEIGHT;
        this.color = color;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some pixel art details
        ctx.fillStyle = '#3aa89e';
        for (let i = 0; i < this.width; i += 4) {
            ctx.fillRect(this.x + i, this.y + 2, 2, 2);
        }
    }
}

// Level Designs
const levels = [
    // Level 1 - Basic
    {
        playerStart: { x: 50, y: 300 },
        platforms: [
            new Platform(0, 400, 200),
            new Platform(250, 400, 200),
            new Platform(500, 400, 200),
            new Platform(600, 300, 100),
            new Platform(400, 250, 100),
            new Platform(200, 200, 100),
            new Platform(50, 150, 100, '#ff6b6b') // Goal platform
        ]
    },
    // Level 2 - Gaps
    {
        playerStart: { x: 50, y: 100 },
        platforms: [
            new Platform(0, 150, 100),
            new Platform(150, 150, 100),
            new Platform(300, 150, 100),
            new Platform(450, 150, 100),
            new Platform(600, 150, 100),
            new Platform(600, 300, 100),
            new Platform(450, 300, 100),
            new Platform(300, 300, 100),
            new Platform(150, 300, 100),
            new Platform(0, 300, 100),
            new Platform(0, 450, 100, '#ff6b6b') // Goal platform
        ]
    },
    // Level 3 - Stairs
    {
        playerStart: { x: 50, y: 500 },
        platforms: [
            new Platform(0, 550, 100),
            new Platform(150, 500, 100),
            new Platform(300, 450, 100),
            new Platform(450, 400, 100),
            new Platform(600, 350, 100),
            new Platform(600, 200, 100),
            new Platform(450, 200, 100, '#ff6b6b') // Goal platform
        ]
    },
    // Level 4 - Precision Jumps
    {
        playerStart: { x: 50, y: 550 },
        platforms: [
            new Platform(0, 580, 80),
            new Platform(120, 520, 60),
            new Platform(220, 460, 60),
            new Platform(320, 400, 60),
            new Platform(420, 340, 60),
            new Platform(520, 280, 60),
            new Platform(620, 220, 60),
            new Platform(620, 160, 60, '#ff6b6b') // Goal platform
        ]
    },
    // Level 5 - Expert
    {
        playerStart: { x: 50, y: 550 },
        platforms: [
            new Platform(0, 580, 60),
            new Platform(100, 520, 60),
            new Platform(0, 460, 60),
            new Platform(100, 400, 60),
            new Platform(0, 340, 60),
            new Platform(100, 280, 60),
            new Platform(200, 220, 60),
            new Platform(300, 280, 60),
            new Platform(400, 220, 60),
            new Platform(500, 280, 60),
            new Platform(600, 220, 60),
            new Platform(700, 160, 60, '#ff6b6b') // Goal platform
        ]
    }
];

// Initialize Game
function initGame() {
    // Check if mobile
    gameState.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (gameState.isMobile) {
        document.getElementById('mobile-controls').classList.remove('hidden');
    }

    // Get canvas and context
    gameState.canvas = document.getElementById('game-canvas');
    gameState.ctx = gameState.canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Setup event listeners
    setupEventListeners();

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Resize canvas to fit window
function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Maintain 4:3 aspect ratio
    const aspectRatio = 4 / 3;
    let canvasWidth = windowWidth;
    let canvasHeight = windowWidth / aspectRatio;
    
    if (canvasHeight > windowHeight) {
        canvasHeight = windowHeight;
        canvasWidth = windowHeight * aspectRatio;
    }
    
    gameState.canvas.width = gameState.gameWidth;
    gameState.canvas.height = gameState.gameHeight;
    
    // Scale canvas for display
    gameState.canvas.style.width = `${canvasWidth}px`;
    gameState.canvas.style.height = `${canvasHeight}px`;
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            gameState.keys.left = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            gameState.keys.right = true;
        } else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !gameState.keys.up) {
            gameState.keys.up = true;
            if (gameState.player && !gameState.player.isJumping) {
                gameState.player.velocityY = JUMP_FORCE;
                gameState.player.isJumping = true;
            }
        } else if (e.key === 'Escape') {
            togglePause();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            gameState.keys.left = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            gameState.keys.right = false;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
            gameState.keys.up = false;
        }
    });

    // Mobile controls
    document.getElementById('left-button').addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.keys.left = true;
    });
    document.getElementById('left-button').addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.keys.left = false;
    });
    document.getElementById('left-button').addEventListener('mousedown', (e) => {
        e.preventDefault();
        gameState.keys.left = true;
    });
    document.getElementById('left-button').addEventListener('mouseup', (e) => {
        e.preventDefault();
        gameState.keys.left = false;
    });

    document.getElementById('right-button').addEventListener('touchstart', (e) => {
        e.preventDefault();
        gameState.keys.right = true;
    });
    document.getElementById('right-button').addEventListener('touchend', (e) => {
        e.preventDefault();
        gameState.keys.right = false;
    });
    document.getElementById('right-button').addEventListener('mousedown', (e) => {
        e.preventDefault();
        gameState.keys.right = true;
    });
    document.getElementById('right-button').addEventListener('mouseup', (e) => {
        e.preventDefault();
        gameState.keys.right = false;
    });

    document.getElementById('jump-button').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameState.player && !gameState.player.isJumping) {
            gameState.player.velocityY = JUMP_FORCE;
            gameState.player.isJumping = true;
        }
    });
    document.getElementById('jump-button').addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (gameState.player && !gameState.player.isJumping) {
            gameState.player.velocityY = JUMP_FORCE;
            gameState.player.isJumping = true;
        }
    });

    // UI buttons
    document.getElementById('start-button').addEventListener('click', () => {
        showScreen('level-select');
    });

    document.getElementById('back-button').addEventListener('click', () => {
        showScreen('main-menu');
    });

    document.querySelectorAll('.level-button').forEach(button => {
        button.addEventListener('click', () => {
            const level = parseInt(button.dataset.level);
            startLevel(level);
        });
    });

    document.getElementById('pause-button').addEventListener('click', togglePause);
    document.getElementById('resume-button').addEventListener('click', togglePause);
    document.getElementById('quit-button').addEventListener('click', () => {
        showScreen('level-select');
        gameState.isPaused = false;
    });

    document.getElementById('retry-button').addEventListener('click', () => {
        startLevel(gameState.currentLevel);
    });

    document.getElementById('level-select-button').addEventListener('click', () => {
        showScreen('level-select');
    });
}

// Show a specific screen
function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    gameState.currentScreen = screenName;
    document.getElementById(`${screenName.replace(' ', '-')}`).classList.remove('hidden');
    
    if (screenName === 'game-screen') {
        gameState.isPaused = false;
    }
}

// Start a level
function startLevel(level) {
    gameState.currentLevel = level;
    document.getElementById('current-level').textContent = level;
    
    // Load level data
    const levelData = levels[level - 1];
    gameState.player = new Player(levelData.playerStart.x, levelData.playerStart.y);
    gameState.platforms = levelData.platforms;
    
    showScreen('game-screen');
}

// Toggle pause
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    if (gameState.isPaused) {
        showScreen('pause-screen');
    } else {
        showScreen('game-screen');
    }
}

// Game over
function gameOver(success) {
    const gameOverScreen = document.getElementById('game-over-screen');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    
    if (success) {
        title.textContent = 'LEVEL COMPLETE!';
        message.textContent = `You mastered Level ${gameState.currentLevel}!`;
    } else {
        title.textContent = 'GAME OVER';
        message.textContent = `Try again!`;
    }
    
    showScreen('game-over-screen');
}

// Main game loop
function gameLoop() {
    if (gameState.currentScreen === 'game-screen' && !gameState.isPaused) {
        // Clear canvas
        gameState.ctx.clearRect(0, 0, gameState.gameWidth, gameState.gameHeight);
        
        // Update player
        const onGround = gameState.player.update(gameState.platforms);
        
        // Check if player reached the goal (red platform)
        const goalPlatform = gameState.platforms.find(p => p.color === '#ff6b6b');
        if (
            gameState.player.y + gameState.player.height >= goalPlatform.y &&
            gameState.player.y + gameState.player.height <= goalPlatform.y + goalPlatform.height &&
            gameState.player.x + gameState.player.width > goalPlatform.x &&
            gameState.player.x < goalPlatform.x + goalPlatform.width
        ) {
            if (gameState.currentLevel < levels.length) {
                // Show level complete message
                gameOver(true);
            } else {
                // Game complete
                const gameOverScreen = document.getElementById('game-over-screen');
                const title = document.getElementById('game-over-title');
                const message = document.getElementById('game-over-message');
                
                title.textContent = 'GAME COMPLETE!';
                message.textContent = 'You mastered all levels!';
                
                showScreen('game-over-screen');
            }
            return;
        }
        
        // Draw platforms
        gameState.platforms.forEach(platform => {
            platform.draw(gameState.ctx);
        });
        
        // Draw player
        gameState.player.draw(gameState.ctx);
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
