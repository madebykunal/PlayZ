// Game elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const winnerInfo = document.getElementById('winner-info');
const gameOverMainMenuButton = document.getElementById('game-over-main-menu-button');
const inGameMenuButton = document.getElementById('in-game-menu-button');
const gameInfo = document.getElementById('game-info');
const mobileControlsContainer = document.getElementById('mobile-controls-container');
const player1MobileControls = document.getElementById('player1-mobile-controls');
const player2MobileControls = document.getElementById('player2-mobile-controls');
const controlButtons = mobileControlsContainer.querySelectorAll('.control-button');

const singlePlayerBtn = document.getElementById('single-player-btn');
const twoPlayerBtn = document.getElementById('two-player-btn');

// Game state variables
let gameMode = null; // 'single' or 'two'
let gameRunning = false;

// Game settings
const GRID_SIZE = 8; // 8x8 grid
const BLOCK_SIZE = 60; // Size of each block in pixels
const BLOCK_GAP = 5; // Gap between blocks
const BREAK_TIME = 2000; // Time in ms before a block breaks after being left
const WARNING_TIME = 1000; // Time in ms for warning color shift before breaking

// Colors (monochrome palette)
const COLORS = {
    BLOCK_SOLID: '#aaaaaa', // Light grey for solid blocks
    BLOCK_WARNING: '#777777', // Darker grey for warning
    BLOCK_BROKEN: '#444444', // Even darker grey for broken
    PLAYER1: '#00ffff', // Cyan for Player 1
    PLAYER2: '#ffff00', // Yellow for Player 2
    BACKGROUND: '#222222' // Canvas background
};

let grid = [];
let players = [];
let playerSize = BLOCK_SIZE * 0.6; // Player size relative to block

// Sound Effects - Declare variables here, initialize in initGame
let moveSynth;
let breakSynth;

// Player object structure
class Player {
    constructor(id, x, y, color, controls, colorName) {
        this.id = id;
        this.gridX = x;
        this.gridY = y;
        this.color = color;
        this.controls = controls; // Object with key codes or null for AI
        this.isAlive = true;
        this.moveTimer = 0; // Timer to prevent rapid movement
        this.moveDelay = 150; // Delay between moves in ms
        this.colorName = colorName; // Store color name for display
    }

    draw() {
        if (!this.isAlive) return;
        const centerX = this.gridX * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_SIZE / 2 + BLOCK_GAP;
        const centerY = this.gridY * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_SIZE / 2 + BLOCK_GAP;

        ctx.fillStyle = this.color;
        ctx.fillRect(
            centerX - playerSize / 2,
            centerY - playerSize / 2,
            playerSize,
            playerSize
        );

        // Simple pixelated effect for players
        ctx.fillStyle = '#000'; // Black eyes/details
        if (this.isAlive) {
            // Example pixel eyes
            ctx.fillRect(centerX - playerSize / 4, centerY - playerSize / 8, playerSize / 8, playerSize / 8);
            ctx.fillRect(centerX + playerSize / 8, centerY - playerSize / 8, playerSize / 8, playerSize / 8);
        }
    }

    move(dx, dy) {
        if (!this.isAlive || Date.now() - this.moveTimer < this.moveDelay) return;

        const newGridX = this.gridX + dx;
        const newGridY = this.gridY + dy;

        // Check bounds
        if (newGridX >= 0 && newGridX < GRID_SIZE && newGridY >= 0 && newGridY < GRID_SIZE) {
            const oldGridX = this.gridX;
            const oldGridY = this.gridY;

            this.gridX = newGridX;
            this.gridY = newGridY;
            this.moveTimer = Date.now();

            // Play move sound if synths are initialized
            if (moveSynth) {
                moveSynth.triggerAttackRelease('C4', '8n');
            }

            // --- Block Breaking Logic Fix ---

            // Handle the block the player just left
            const prevBlockIndex = oldGridY * GRID_SIZE + oldGridX;
            if (prevBlockIndex >= 0 && prevBlockIndex < grid.length) { // Check if index is valid
                const prevBlock = grid[prevBlockIndex];
                if (prevBlock.state !== 'broken') { // Only start timer if not already broken
                    // Check if any other player is still on the block being left
                    const otherPlayerPresent = players.some(p =>
                        p.isAlive && p !== this && p.gridX === oldGridX && p.gridY === oldGridY
                    );

                    if (!otherPlayerPresent) {
                        // If no other player is on the block being left, start its break timer
                        if (prevBlock.state === 'solid') { // Only transition from solid
                            prevBlock.state = 'warning';
                            prevBlock.breakTime = Date.now() + BREAK_TIME;
                            prevBlock.warningTime = Date.now() + WARNING_TIME;
                        }
                    }
                }
            }

            // Handle the block the player landed on
            const currentBlockIndex = this.gridY * GRID_SIZE + this.gridX;
            if (currentBlockIndex >= 0 && currentBlockIndex < grid.length) { // Check if index is valid
                const currentBlock = grid[currentBlockIndex];
                if (currentBlock.state === 'solid') {
                    // If the block is solid, start its break timer immediately upon landing
                    currentBlock.state = 'warning';
                    currentBlock.breakTime = Date.now() + BREAK_TIME;
                    currentBlock.warningTime = Date.now() + WARNING_TIME;
                }
                // If the block is already in 'warning' state, its timer is already running, no need to reset.
            }

            // --- End Block Breaking Logic Fix ---
        }
    }
}

// Block object structure
class Block {
    constructor(x, y) {
        this.gridX = x;
        this.gridY = y;
        this.state = 'solid'; // 'solid', 'warning', 'broken'
        this.breakTime = null; // Timestamp when the block should break
        this.warningTime = null; // Timestamp when the block should show warning color
        this.animationTimer = 0; // For simple animation effects
        this.animationDuration = 100; // Duration of animation
    }

    draw() {
        let color = COLORS.BLOCK_SOLID;
        if (this.state === 'warning') {
            color = COLORS.BLOCK_WARNING;
        } else if (this.state === 'broken') {
            color = COLORS.BLOCK_BROKEN;
        }

        ctx.fillStyle = color;
        ctx.fillRect(
            this.gridX * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_GAP,
            this.gridY * (BLOCK_GAP + BLOCK_SIZE) + BLOCK_GAP,
            BLOCK_SIZE,
            BLOCK_SIZE
        );

        // Simple animation: quick fade/pulse effect when warning
        if (this.state === 'warning') {
            const elapsed = Date.now() - (this.breakTime - BREAK_TIME);
            const progress = elapsed / BREAK_TIME;
            const alpha = 1 - Math.sin(progress * Math.PI); // Simple pulsing effect

            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`; // Green pulse
            ctx.fillRect(
                this.gridX * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_GAP,
                this.gridY * (BLOCK_GAP + BLOCK_SIZE) + BLOCK_GAP,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
        }
    }

    update() {
        if (this.state === 'broken') return;

        const now = Date.now();

        if (this.state === 'warning' && this.breakTime && now >= this.breakTime) {
            this.state = 'broken';
            this.breakTime = null; // Reset break time
            this.warningTime = null; // Reset warning time
            // Play break sound if synth is initialized
            if (breakSynth) {
                breakSynth.triggerAttackRelease('8n');
            }
        } else if (this.state === 'solid' && this.warningTime && now >= this.warningTime) {
            // This transition is now handled in player.move when landing on a solid block
            this.warningTime = null; // Reset warning time after transition
        }
    }
}

function initGame(mode) {
    gameMode = mode;
    gameRunning = true;
    startScreen.classList.add('hidden'); // Hide start screen
    gameOverScreen.classList.add('hidden'); // Hide game over screen
    canvas.classList.remove('hidden'); // Show canvas
    inGameMenuButton.classList.remove('hidden'); // Show in-game menu button
    inGameMenuButton.style.display = 'block'; // Ensure it's visible

    // Show/hide mobile controls based on mode and screen size
    if (window.innerWidth <= 768) {
        mobileControlsContainer.classList.remove('hidden');
        player1MobileControls.classList.remove('hidden');
        if (gameMode === 'two') {
            player2MobileControls.classList.remove('hidden');
        } else {
            player2MobileControls.classList.add('hidden');
        }
    } else {
        mobileControlsContainer.classList.add('hidden'); // Hide mobile controls on desktop
    }

    // Initialize Sound Effects Synths here to ensure Tone.js is loaded
    if (typeof Tone !== 'undefined') {
        // Check if context is running, if not, start it (needed for some browsers)
        if (Tone.context.state !== 'running') {
            Tone.context.resume();
        }
        moveSynth = new Tone.Synth().toDestination();
        breakSynth = new Tone.NoiseSynth().toDestination();
    } else {
        console.warn("Tone.js not loaded. Sound effects will be disabled.");
        moveSynth = null; // Ensure synths are null if Tone is not available
        breakSynth = null;
    }

    // Initialize grid
    grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            grid.push(new Block(x, y));
        }
    }

    // Initialize players
    players = [];
    // Player 1 (Top-left corner)
    players.push(new Player(1, 0, 0, COLORS.PLAYER1, {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight'
    }, 'Cyan Player')); // Added color name

    if (gameMode === 'two') {
        // Player 2 (Bottom-right corner)
        players.push(new Player(2, GRID_SIZE - 1, GRID_SIZE - 1, COLORS.PLAYER2, {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd'
        }, 'Yellow Player')); // Added color name
    } else {
        // Simple AI player for single player mode (Bottom-right corner)
        players.push(new Player(2, GRID_SIZE - 1, GRID_SIZE - 1, COLORS.PLAYER2, null, 'Yellow Player (AI)')); // No controls for AI, added color name
    }

    // Set canvas size based on grid and block size
    canvas.width = GRID_SIZE * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_GAP;
    canvas.height = GRID_SIZE * (BLOCK_SIZE + BLOCK_GAP) + BLOCK_GAP;

    gameInfo.style.display = window.innerWidth > 768 ? 'block' : 'none'; // Show keyboard info only on desktop

    gameLoop(); // Start the game loop
}

function update() {
    if (!gameRunning) return;

    // Update blocks
    grid.forEach(block => block.update());

    // Check if players are on broken blocks
    players.forEach(player => {
        if (!player.isAlive) return;

        const blockIndex = player.gridY * GRID_SIZE + player.gridX;
        if (grid[blockIndex] && grid[blockIndex].state === 'broken') {
            player.isAlive = false;
        }
    });

    // AI logic for single player mode
    if (gameMode === 'single' && players[1].isAlive) {
        const aiPlayer = players[1];
        // Smarter AI: Try to move to an adjacent solid block that is not already a warning
        if (Date.now() - aiPlayer.moveTimer >= aiPlayer.moveDelay * 1.5) { // AI moves slightly slower
            const possibleMoves = [];
            const moves = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // Up, Down, Left, Right

            // Prioritize moves to solid blocks
            moves.forEach(move => {
                const newX = aiPlayer.gridX + move[0];
                const newY = aiPlayer.gridY + move[1];
                const blockIndex = newY * GRID_SIZE + newX;

                if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                    if (grid[blockIndex] && grid[blockIndex].state === 'solid') {
                        possibleMoves.push(move);
                    }
                }
            });

            // If no solid blocks, consider warning blocks as a last resort
            if (possibleMoves.length === 0) {
                moves.forEach(move => {
                    const newX = aiPlayer.gridX + move[0];
                    const newY = aiPlayer.gridY + move[1];
                    const blockIndex = newY * GRID_SIZE + newX;

                    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                        if (grid[blockIndex] && grid[blockIndex].state === 'warning') {
                            possibleMoves.push(move);
                        }
                    }
                });
            }

            if (possibleMoves.length > 0) {
                // Choose a random move from the possible moves
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                aiPlayer.move(randomMove[0], randomMove[1]);
            } else {
                // If no solid or warning adjacent blocks, the AI is trapped and will eventually fall
            }
        }
    }

    // Check for game over
    const alivePlayers = players.filter(player => player.isAlive);
    if (alivePlayers.length <= 1) {
        gameRunning = false;
        setTimeout(() => { // Delay game over screen slightly
            showGameOver(alivePlayers.length === 1 ? alivePlayers[0] : null);
        }, 500);
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw blocks
    grid.forEach(block => block.draw());

    // Draw players
    players.forEach(player => player.draw());
}

function gameLoop() {
    update();
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function showGameOver(winner) {
    canvas.classList.add('hidden'); // Hide canvas
    inGameMenuButton.classList.add('hidden'); // Hide in-game menu button
    mobileControlsContainer.classList.add('hidden'); // Hide mobile controls
    
    // Set the winner text clearly with the proper colorName
    if (winner) {
        winnerInfo.textContent = `${winner.colorName} Wins!`;
        winnerInfo.style.color = winner.color; // Set text color to match winner's color
    } else {
        winnerInfo.textContent = 'It\'s a Draw!';
        winnerInfo.style.color = '#ffffff'; // Default white for draw
    }
    
    // Show game over screen with proper styling
    gameOverScreen.style.display = 'flex'; // Use flex to center content
    gameOverScreen.classList.remove('hidden');
    
    // Ensure the main menu button is visible and properly positioned
    gameOverMainMenuButton.style.display = 'block';
    gameOverMainMenuButton.style.margin = '20px auto'; // Center horizontally with margin
}

function resetGame() {
    gameMode = null;
    gameRunning = false;
    grid = [];
    players = [];
    canvas.classList.add('hidden'); // Hide canvas
    inGameMenuButton.classList.add('hidden'); // Hide in-game menu button
    inGameMenuButton.style.display = 'none'; // Ensure it's hidden
    mobileControlsContainer.classList.add('hidden'); // Hide mobile controls
    gameOverScreen.classList.add('hidden'); // Hide game over screen
    gameOverScreen.style.display = 'none'; // Ensure it's hidden
    startScreen.classList.remove('hidden'); // Show start screen
    gameInfo.style.display = 'block'; // Show game info (keyboard controls) in main menu
}

// Event Listeners
singlePlayerBtn.addEventListener('click', () => initGame('single'));
twoPlayerBtn.addEventListener('click', () => initGame('two'));

// Game Over Main Menu button event listener
gameOverMainMenuButton.addEventListener('click', resetGame);

// In-game Main Menu button event listener
inGameMenuButton.addEventListener('click', resetGame);

// Keyboard Controls
document.addEventListener('keydown', (event) => {
    if (!gameRunning) return;

    players.forEach(player => {
        if (player.isAlive && player.controls) {
            switch (event.key) {
                case player.controls.up:
                    player.move(0, -1);
                    break;
                case player.controls.down:
                    player.move(0, 1);
                    break;
                case player.controls.left:
                    player.move(-1, 0);
                    break;
                case player.controls.right:
                    player.move(1, 0);
                    break;
            }
        }
    });
});

// Mobile Touch Controls
controlButtons.forEach(button => {
    button.addEventListener('touchstart', (event) => {
        event.preventDefault(); // Prevent scrolling/zooming
        if (!gameRunning) return;

        const playerNumber = parseInt(button.dataset.player);
        const direction = button.dataset.direction;
        const controlledPlayer = players.find(p => p.id === playerNumber);

        if (controlledPlayer && controlledPlayer.isAlive) {
            switch (direction) {
                case 'up':
                    controlledPlayer.move(0, -1);
                    break;
                case 'down':
                    controlledPlayer.move(0, 1);
                    break;
                case 'left':
                    controlledPlayer.move(-1, 0);
                    break;
                case 'right':
                    controlledPlayer.move(1, 0);
                    break;
            }
        }
    });
    // Add touchend to prevent continuous movement
    button.addEventListener('touchend', (event) => { 
        event.preventDefault(); 
    });
});

// Handle window resize to maintain responsiveness
window.addEventListener('resize', () => {
    if (gameRunning) {
        // Redraw to ensure everything is centered correctly
        draw();
    }
    // Adjust visibility of mobile controls based on window size and game state
    if (window.innerWidth <= 768 && gameRunning) {
        mobileControlsContainer.classList.remove('hidden');
        player1MobileControls.classList.remove('hidden');
        if (gameMode === 'two') {
            player2MobileControls.classList.remove('hidden');
        } else {
            player2MobileControls.classList.add('hidden');
        }
    } else {
        mobileControlsContainer.classList.add('hidden');
    }
    gameInfo.style.display = window.innerWidth > 768 && gameRunning ? 'block' : 'none';
});

// Ensure Tone.js audio context is resumed on a user gesture (like button click)
document.addEventListener('click', () => {
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        Tone.context.resume();
    }
});

// Initial state setup
canvas.classList.add('hidden'); // Hide canvas initially
inGameMenuButton.classList.add('hidden'); // Hide in-game menu button initially
inGameMenuButton.style.display = 'none'; // Ensure it's not visible at start
mobileControlsContainer.classList.add('hidden'); // Hide mobile controls initially
gameInfo.style.display = 'block'; // Show keyboard info in main menu