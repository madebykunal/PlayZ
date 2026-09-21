const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = document.getElementById('score');
        const startScreen = document.getElementById('start-screen');
        const startGameButton = document.getElementById('start-button');
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScoreDisplay = document.getElementById('final-score');
        const restartButton = document.getElementById('restart-button');
        const touchControlsHint = document.getElementById('touch-controls-hint');

        // Game variables
        let player;
        let obstacles = [];
        let score = 0;
        let gameRunning = false;
        let obstacleSpeed = 4;
        // MODIFICATION: Reduced initial obstacle frequency for more obstacles
        let obstacleFrequency = 400; // Original was 500
        let lastObstacleTime = 0;
        let keys = {};

        // NEW: Variables for stationary player detection and targeted obstacle spawn
        let lastPlayerXForStationaryCheck; // Stores player's X position from the end of the previous frame
        let playerStationaryDuration = 0;  // How long (in ms) the player has been at lastPlayerXForStationaryCheck
        const PLAYER_STATIONARY_THRESHOLD = 2000; // 2 seconds in milliseconds

        // Player properties
        const playerSize = 20;
        const playerSpeed = 5;

        // Obstacle properties
        const obstacleSize = 20;

        // Function to resize canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth * 0.8;
            canvas.height = window.innerHeight * 0.6;
            canvas.width = Math.floor(canvas.width / playerSize) * playerSize;
            canvas.height = Math.floor(canvas.height / playerSize) * playerSize;

            if (player) {
                 player.x = canvas.width / 2 - playerSize / 2;
                 player.y = canvas.height - playerSize * 2;
            } else {
                player = {
                    x: canvas.width / 2 - playerSize / 2,
                    y: canvas.height - playerSize * 2,
                    size: playerSize,
                    speed: playerSpeed
                };
            }

             if (gameRunning) {
                draw();
             }
        }

        player = null; 

        class Obstacle {
            constructor(x, y, size, speed) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.speed = speed;
            }

            update() {
                this.y += this.speed;
            }

            draw() {
                ctx.fillStyle = '#ff0000'; // Red obstacle
                ctx.fillRect(this.x, this.y, this.size, this.size);
            }
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (player) {
                ctx.fillStyle = '#00ff00'; // Green player
                ctx.fillRect(player.x, player.y, player.size, player.size);
            }
            obstacles.forEach(obstacle => {
                obstacle.draw();
            });
        }

        function update(deltaTime) {
            if (!gameRunning || !player) return; // Ensure player exists

            score += deltaTime / 100; 
            scoreDisplay.textContent = `Score: ${Math.floor(score)}`;

            // Player movement
            if (keys['ArrowLeft'] || keys['a']) {
                player.x -= player.speed;
            }
            if (keys['ArrowRight'] || keys['d']) {
                player.x += player.speed;
            }

            player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));

            // Generate new random obstacles
            const currentTime = Date.now();
            if (currentTime - lastObstacleTime > obstacleFrequency) {
                const obstacleX = Math.random() * (canvas.width - obstacleSize);
                obstacles.push(new Obstacle(obstacleX, -obstacleSize, obstacleSize, obstacleSpeed));
                lastObstacleTime = currentTime;

                obstacleSpeed += 0.02;
                // MODIFICATION: Increase obstacle frequency more aggressively
                obstacleFrequency = Math.max(200, obstacleFrequency - 12); // Original: Math.max(300, obstacleFrequency - 10)
            }

            obstacles.forEach((obstacle, index) => {
                obstacle.update();
                if (obstacle.y > canvas.height) {
                    obstacles.splice(index, 1);
                }
            });

            checkCollisions();

            // NEW: Stationary player check and targeted obstacle spawn
            // This check uses the player's final position for the current frame
            // and compares it to their final position from the previous frame.
            if (player.x === lastPlayerXForStationaryCheck) {
                playerStationaryDuration += deltaTime; // Accumulate time spent stationary
                if (playerStationaryDuration >= PLAYER_STATIONARY_THRESHOLD) {
                    // Player has been stationary for too long, spawn an obstacle above them
                    obstacles.push(new Obstacle(player.x, -obstacleSize, obstacleSize, obstacleSpeed * 1.1)); // Spawn targeted obstacle (slightly faster)
                    playerStationaryDuration = 0; // Reset timer to prevent immediate re-spawn
                }
            } else {
                // Player moved, reset stationary timer and update last known position
                playerStationaryDuration = 0;
                lastPlayerXForStationaryCheck = player.x; // Update for the next frame's comparison
            }
        }

        function checkCollisions() {
            if (!player) return;
            obstacles.forEach(obstacle => {
                if (player.x < obstacle.x + obstacle.size &&
                    player.x + player.size > obstacle.x &&
                    player.y < obstacle.y + obstacle.size &&
                    player.y + player.size > obstacle.y) {
                    gameOver();
                }
            });
        }

        function gameOver() {
            gameRunning = false;
            finalScoreDisplay.textContent = `Final Score: ${Math.floor(score)}`;
            canvas.style.display = 'none';
            scoreDisplay.style.display = 'none';
            touchControlsHint.style.display = 'none';
            gameOverScreen.style.display = 'flex';
        }

        function resetGameVariables() {
            score = 0;
            obstacles = [];
            obstacleSpeed = 4; // Reset base speed
            obstacleFrequency = 400; // MODIFICATION: Reset to new initial frequency
            lastObstacleTime = 0;
            // NEW: Reset stationary player detection variables
            if (player) { // Ensure player is available from resizeCanvas
                 lastPlayerXForStationaryCheck = player.x;
            }
            playerStationaryDuration = 0;
        }
        
        function startGame() {
            gameRunning = true;
            startScreen.style.display = 'none';
            canvas.style.display = 'block';
            scoreDisplay.style.display = 'block';
            if ('ontouchstart' in window || navigator.maxTouchPoints) {
                touchControlsHint.style.display = 'block';
            }
            resizeCanvas(); // Critical: Initializes/resets player
            resetGameVariables(); // Now safe to access player.x if needed
            gameLoop(0);
        }

        function restartGame() {
            gameRunning = true;
            gameOverScreen.style.display = 'none';
            canvas.style.display = 'block';
            scoreDisplay.style.display = 'block';
             if ('ontouchstart' in window || navigator.maxTouchPoints) {
                touchControlsHint.style.display = 'block';
            }
            resizeCanvas(); // Critical: Initializes/resets player
            resetGameVariables(); // Now safe to access player.x if needed
            gameLoop(0);
        }

        window.addEventListener('keydown', (e) => {
            if (gameRunning) {
                 keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
             if (gameRunning) {
                keys[e.key] = false;
             }
        });

        canvas.addEventListener('touchstart', (e) => {
            if (gameRunning) {
                e.preventDefault();
                const touchX = e.touches[0].clientX;
                const canvasRect = canvas.getBoundingClientRect();

                if (touchX < canvasRect.left + canvasRect.width / 2) {
                    keys['ArrowLeft'] = true;
                    keys['ArrowRight'] = false;
                } else {
                    keys['ArrowRight'] = true;
                    keys['ArrowLeft'] = false;
                }
            }
        });

         canvas.addEventListener('touchend', (e) => {
             if (gameRunning) {
                e.preventDefault();
                keys['ArrowLeft'] = false;
                keys['ArrowRight'] = false;
             }
         });

        startGameButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', restartGame);

        let lastTime = 0;
        function gameLoop(currentTime) {
            if (!gameRunning) return;

            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            update(deltaTime);
            draw();

            requestAnimationFrame(gameLoop);
        }

        window.onload = function () {
            if ('ontouchstart' in window || navigator.maxTouchPoints) {
                // Hint shown when game starts
            } else {
                touchControlsHint.style.display = 'none';
            }
        }