// Global references
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = document.getElementById('score');
        const finalScoreDisplay = document.getElementById('final-score');
        const startScreen = document.getElementById('start-screen');
        const gameOverDisplay = document.getElementById('game-over');
        const startButton = document.getElementById('start-button');
        const restartButton = document.getElementById('restart-button');
        const gameContainer = document.getElementById('game-container');

        // Game variables
        let gameState = 'start';
        let gameSpeed = 4;
        let initialGameSpeed = 4;
        let speedIncreaseRate = 0.0005;
        let score = 0;
        let highScore = 0;
        let isJumping = false;
        let gravity = 0.4;
        let obstacleTimer = 0;
        let obstacleInterval = 120;
        let minObstacleInterval = 60;
        let obstacleIntervalDecreaseRate = 0.5;
        let obstacles = [];
        let groundParticles = [];
        let isMobile = window.innerWidth <= 768;
        let pixelSize = isMobile ? 4 : 6;
        let frameCount = 0;
        let animationFrame = 0;

        // Colors
        const COLORS = {
            background: '#222222',
            ground: '#444444',
            character: '#00FF00',
            obstacle: '#FF0000',
            score: '#FFFFFF',
            particles: ['#666666', '#888888', '#AAAAAA']
        };

        // Character properties
        const character = {
            x: 50,
            y: 0,
            width: pixelSize * 4,
            height: pixelSize * 6,
            velocityY: 0
        };

        // Obstacle properties
        const obstacleTypes = [
            {
                width: pixelSize * 3,
                height: pixelSize * 6,
                color: COLORS.obstacle
            },
            {
                width: pixelSize * 5,
                height: pixelSize * 3,
                color: COLORS.obstacle
            }
        ];

        // Adjust character position based on ground height
        function setInitialPosition() {
            const groundHeight = Math.floor(canvas.height * 0.2);
            character.y = canvas.height - groundHeight - character.height;
        }

        // Resize canvas and adjust positions
        function resizeCanvas() {
            canvas.width = gameContainer.offsetWidth;
            canvas.height = gameContainer.offsetHeight;
            
            isMobile = window.innerWidth <= 768;
            pixelSize = isMobile ? 4 : 6;
            
            character.width = pixelSize * 4;
            character.height = pixelSize * 6;
            
            setInitialPosition();
        }

        window.addEventListener('resize', resizeCanvas);

        // Draw character
        function drawCharacter() {
            ctx.fillStyle = COLORS.character;
            
            // Simple animation based on jumping and movement
            if (isJumping) {
                // Jumping pose - compact
                ctx.fillRect(character.x, character.y + pixelSize, pixelSize * 4, pixelSize * 5);
            } else {
                // Running animation
                if (Math.floor(frameCount / 8) % 2 === 0) {
                    // Frame 1
                    ctx.fillRect(character.x, character.y, pixelSize * 4, pixelSize * 4);
                    ctx.fillRect(character.x + pixelSize, character.y + pixelSize * 4, pixelSize * 2, pixelSize * 2);
                } else {
                    // Frame 2
                    ctx.fillRect(character.x, character.y + pixelSize, pixelSize * 4, pixelSize * 4);
                    ctx.fillRect(character.x + pixelSize, character.y + pixelSize * 5, pixelSize * 2, pixelSize);
                }
            }
        }

        // Draw obstacle
        function drawObstacle(obstacle) {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }

        // Draw ground particles
        function createGroundParticles() {
            const groundHeight = Math.floor(canvas.height * 0.2);
            const groundY = canvas.height - groundHeight;
            
            for (let i = 0; i < 3; i++) {
                groundParticles.push({
                    x: canvas.width,
                    y: groundY + Math.random() * groundHeight * 0.8,
                    size: Math.floor(Math.random() * 3) * pixelSize + pixelSize,
                    speed: gameSpeed * (0.2 + Math.random() * 0.3),
                    color: COLORS.particles[Math.floor(Math.random() * COLORS.particles.length)]
                });
            }
        }

        // Update and draw ground particles
        function updateGroundParticles() {
            for (let i = groundParticles.length - 1; i >= 0; i--) {
                const particle = groundParticles[i];
                particle.x -= particle.speed;
                
                // Draw particle
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                
                // Remove off-screen particles
                if (particle.x + particle.size < 0) {
                    groundParticles.splice(i, 1);
                }
            }
            
            // Add new particles occasionally
            if (frameCount % 15 === 0) {
                createGroundParticles();
            }
        }

        // Draw background
        function drawBackground() {
            // Draw sky
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw ground
            const groundHeight = Math.floor(canvas.height * 0.2);
            ctx.fillStyle = COLORS.ground;
            ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
            
            // Draw ground line
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, canvas.height - groundHeight, canvas.width, pixelSize);
            
            // Draw stars
            ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 20; i++) {
                const x = (Math.sin(i * 34.678 + frameCount * 0.01) * 0.5 + 0.5) * canvas.width;
                const y = (Math.cos(i * 23.891 + frameCount * 0.02) * 0.3 + 0.3) * canvas.height;
                const size = Math.floor(Math.random() * 2) + 1;
                ctx.fillRect(x, y, size, size);
            }
        }

        // Format score display
        function formatScore(value) {
            return value.toString().padStart(4, '0');
        }

        // Update game state
        function update() {
            frameCount++;
            if (frameCount % 10 === 0) {
                animationFrame = (animationFrame + 1) % 4;
            }
            
            // Increase game speed over time
            gameSpeed += speedIncreaseRate;

            // Apply gravity
            character.velocityY += gravity;
            character.y += character.velocityY;

            // Ground collision
            const groundHeight = Math.floor(canvas.height * 0.2);
            const groundLevel = canvas.height - groundHeight - character.height;
            if (character.y > groundLevel) {
                character.y = groundLevel;
                character.velocityY = 0;
                isJumping = false;
            }

            // Move obstacles
            obstacles.forEach(obstacle => {
                obstacle.x -= gameSpeed;
            });

            // Remove off-screen obstacles
            obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);

            // Generate new obstacles
            obstacleTimer++;
            if (obstacleTimer >= obstacleInterval) {
                const obsType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
                const groundObstacleY = canvas.height - groundHeight - obsType.height;
                
                obstacles.push({
                    x: canvas.width,
                    y: groundObstacleY,
                    width: obsType.width,
                    height: obsType.height,
                    color: obsType.color
                });
                
                obstacleTimer = 0;
                obstacleInterval = Math.max(minObstacleInterval, obstacleInterval - obstacleIntervalDecreaseRate);
            }

            // Check for collisions
            for (const obstacle of obstacles) {
                if (
                    character.x < obstacle.x + obstacle.width &&
                    character.x + character.width > obstacle.x &&
                    character.y < obstacle.y + obstacle.height &&
                    character.y + character.height > obstacle.y
                ) {
                    gameOver();
                    break;
                }
            }

            // Update score
            score += 1;
            const displayScore = Math.floor(score / 10);
            scoreDisplay.textContent = formatScore(displayScore);
        }

        // Game over
        function gameOver() {
            gameState = 'gameOver';
            const finalScore = Math.floor(score / 10);
            
            if (finalScore > highScore) {
                highScore = finalScore;
            }
            
            finalScoreDisplay.textContent = `SCORE: ${formatScore(finalScore)}`;
            gameOverDisplay.style.display = 'block';
        }

        // Restart game
        function restartGame() {
            gameSpeed = initialGameSpeed;
            score = 0;
            isJumping = false;
            character.velocityY = 0;
            obstacles = [];
            obstacleTimer = 0;
            obstacleInterval = 120;
            groundParticles = [];
            scoreDisplay.textContent = formatScore(0);
            gameOverDisplay.style.display = 'none';
            gameState = 'playing';
            setInitialPosition();
            requestAnimationFrame(gameLoop);
        }

        // Game loop
        function gameLoop() {
            if (gameState === 'playing') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBackground();
                updateGroundParticles();
                update();
                drawCharacter();
                obstacles.forEach(drawObstacle);
                requestAnimationFrame(gameLoop);
            } else if (gameState === 'start') {
                requestAnimationFrame(gameLoop);
            } else if (gameState === 'gameOver') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBackground();
                updateGroundParticles();
                drawCharacter();
                obstacles.forEach(drawObstacle);
            }
        }

        // Handle jump input
        function handleJump() {
            if (!isJumping && gameState === 'playing') {
                character.velocityY = -10;
                isJumping = true;
            }
        }

        // Event listeners - scoped to game canvas and jump keys
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
                if (gameState === 'playing') {
                    e.preventDefault();
                    handleJump();
                }
            }
        });

        canvas.addEventListener('mousedown', () => {
            handleJump();
        });

        canvas.addEventListener('touchstart', (event) => {
            if (gameState === 'playing') {
                event.preventDefault();
                handleJump();
            }
        }, { passive: false });

        restartButton.addEventListener('click', restartGame);
        
        startButton.addEventListener('click', () => {
            startScreen.style.display = 'none';
            gameContainer.style.display = 'block';
            resizeCanvas();
            gameState = 'playing';
            setInitialPosition();
            createGroundParticles();
            requestAnimationFrame(gameLoop);
        });

        gameLoop();