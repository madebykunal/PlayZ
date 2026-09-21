// Canvas and context
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // UI Elements
        const scoreDisplay = document.getElementById('score-display');
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over-screen');
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const finalScoreDisplay = document.getElementById('final-score');
        const touchControlsContainer = document.getElementById('touch-controls');

        // Game constants and variables
        const foodChar = '🍎';
        let actualSnakeHeadColor = '#2ecc71'; // Default Green, will be updated from CSS
        const snakeBodyColor = '#27ae60'; // Darker Green (direct hex is fine)

        let gridSize; // Size of each cell in the grid
        let tileCountX, tileCountY; // Number of tiles in X and Y direction
        
        let snake, food, score, direction, nextDirection, gameSpeed, gameLoopTimeoutId;
        let gameRunning = false;

        const INITIAL_SPEED = 160; // Milliseconds per update, lower is faster
        const SPEED_INCREMENT = 2.5; // Milliseconds to decrease per food item, making game faster

        // Function to get the actual color value from CSS variables for the snake's head
        function updateColorsFromCSS() {
            try {
                const rootStyle = getComputedStyle(document.documentElement);
                const colorValue = rootStyle.getPropertyValue('--secondary-color').trim();
                if (colorValue) { 
                    actualSnakeHeadColor = colorValue;
                } else {
                    console.warn("Could not retrieve --secondary-color from CSS, using default.");
                    actualSnakeHeadColor = '#2ecc71'; // Fallback
                }
            } catch (e) {
                console.error("Error retrieving color from CSS:", e);
                actualSnakeHeadColor = '#2ecc71'; // Fallback
            }
        }

        // Calculate canvas and grid dimensions based on available screen space
        function calculateGrid() {
            const gameContainer = document.getElementById('game-container');
            // Calculate heights of elements outside the game canvas to determine available space
            const scoreDisplayHeight = scoreDisplay.offsetHeight + parseInt(getComputedStyle(scoreDisplay).marginBottom);
            const titleEl = document.getElementById('game-title');
            const titleHeight = titleEl ? (titleEl.offsetHeight + parseInt(getComputedStyle(titleEl).marginBottom || 0)) : 0;
            const touchControlsHeight = isTouchDevice() && touchControlsContainer ? (touchControlsContainer.offsetHeight + parseInt(getComputedStyle(touchControlsContainer).marginTop || 0)) : 0;
            
            // Calculate available space for the canvas, considering padding and other elements
            let availableHeightForCanvas = window.innerHeight - titleHeight - scoreDisplayHeight - touchControlsHeight - 40; // 40px for body padding and buffer
            let availableWidthForCanvas = window.innerWidth - 20; // 20px for body padding

            // Determine canvas size, aiming for a square-ish canvas, fitting the smaller dimension, max 500px
            let canvasSize = Math.min(availableWidthForCanvas, availableHeightForCanvas, 500); 

            if (canvasSize <= 0) { // Fallback if calculation is off
                canvasSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.5, 300);
            }

            // Determine grid cell size based on canvas size
            if (canvasSize < 200) gridSize = 10; 
            else if (canvasSize < 300) gridSize = 15;
            else if (canvasSize < 400) gridSize = 20;
            else gridSize = 25;

            // Ensure canvas dimensions are multiples of gridSize for a clean grid
            canvas.width = Math.floor(canvasSize / gridSize) * gridSize;
            canvas.height = Math.floor(canvasSize / gridSize) * gridSize;

            // Set game container dimensions to fit the canvas
            gameContainer.style.width = `${canvas.width}px`;
            gameContainer.style.height = `${canvas.height}px`;

            // Update tile counts based on new dimensions
            tileCountX = canvas.width / gridSize;
            tileCountY = canvas.height / gridSize;
        }

        // Initialize game state (or reset for a new game)
        function initGame() {
            updateColorsFromCSS(); // Ensure snake head color is current
            // Start snake in the middle of the grid
            snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
            placeFood(); // Place the first food item
            score = 0;
            direction = 'RIGHT'; // Initial direction
            nextDirection = 'RIGHT'; // Buffer for next direction input
            gameSpeed = INITIAL_SPEED;
            updateScoreDisplay();
            if (gameLoopTimeoutId) clearTimeout(gameLoopTimeoutId); // Clear any existing game loop
        }

        // Place food at a random position on the grid, not on the snake
        function placeFood() {
            if (tileCountX <=0 || tileCountY <=0) return; // Avoid error if grid not ready
            food = {
                x: Math.floor(Math.random() * tileCountX),
                y: Math.floor(Math.random() * tileCountY)
            };
            // Ensure food doesn't spawn on the snake
            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    placeFood(); // Try placing again
                    return;
                }
            }
        }

        // Draw all game elements on the canvas
        function drawGame() {
            // Ensure canvas has valid dimensions before trying to draw
            if (canvas.width <= 0 || canvas.height <= 0 || tileCountX <= 0 || tileCountY <= 0) {
                return; 
            }

            // Clear canvas with black background
            ctx.fillStyle = '#000'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw snake only if game is running and snake exists
            if (gameRunning && snake && snake.length > 0) {
                snake.forEach((segment, index) => {
                    ctx.fillStyle = (index === 0) ? actualSnakeHeadColor : snakeBodyColor; // Head is different color
                    // Draw segment, slightly smaller than grid cell for a visual gap
                    ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1); 
                    
                    // Draw eyes on the snake's head
                    if (index === 0) { 
                        ctx.fillStyle = '#000'; // Eye color
                        let eyeSize = Math.max(2, gridSize / 6); // Scale eye size
                        let eyeOffset = gridSize / 3.5; // Offset from cell edge
                        let eye1X, eye1Y, eye2X, eye2Y; // Coordinates for the two eyes

                        // Position eyes based on current direction of the snake
                        const segX = segment.x * gridSize; // Current segment's X position on canvas
                        const segY = segment.y * gridSize; // Current segment's Y position on canvas

                        if (direction === 'UP') {
                            eye1X = segX + eyeOffset;
                            eye1Y = segY + eyeOffset;
                            eye2X = segX + gridSize - eyeOffset - eyeSize; 
                            eye2Y = segY + eyeOffset;
                        } else if (direction === 'DOWN') {
                            eye1X = segX + eyeOffset;
                            eye1Y = segY + gridSize - eyeOffset - eyeSize; 
                            eye2X = segX + gridSize - eyeOffset - eyeSize; 
                            eye2Y = segY + gridSize - eyeOffset - eyeSize; 
                        } else if (direction === 'LEFT') {
                            eye1X = segX + eyeOffset;
                            eye1Y = segY + eyeOffset;
                            eye2X = segX + eyeOffset;
                            eye2Y = segY + gridSize - eyeOffset - eyeSize; 
                        } else { // RIGHT
                            eye1X = segX + gridSize - eyeOffset - eyeSize; 
                            eye1Y = segY + eyeOffset;
                            eye2X = segX + gridSize - eyeOffset - eyeSize; 
                            eye2Y = segY + gridSize - eyeOffset - eyeSize; 
                        }
                        ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
                        ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
                    }
                });
            }

            // Draw food only if game is running and food exists
            if (gameRunning && food) {
                ctx.font = `${gridSize * 0.8}px Arial`; // Scale food emoji with grid size
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Adjust Y offset for emoji to center it better within the cell
                ctx.fillText(foodChar, food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2 + gridSize * 0.1);
            }
        }

        // Main game loop: updates game state and redraws
        function updateGame() {
            if (!gameRunning) return; // Stop loop if game is not running

            direction = nextDirection; // Apply the buffered direction change

            // Calculate new head position
            let headX = snake[0].x;
            let headY = snake[0].y;

            if (direction === 'UP') headY--;
            if (direction === 'DOWN') headY++;
            if (direction === 'LEFT') headX--;
            if (direction === 'RIGHT') headX++;

            // Check for wall collision
            if (headX < 0 || headX >= tileCountX || headY < 0 || headY >= tileCountY) {
                gameOver();
                return;
            }

            // Check for self-collision (hitting its own body)
            for (let i = 1; i < snake.length; i++) {
                if (headX === snake[i].x && headY === snake[i].y) {
                    gameOver();
                    return;
                }
            }

            // Add new head to the snake
            const newHead = { x: headX, y: headY };
            snake.unshift(newHead);

            // Check for food consumption
            if (headX === food.x && headY === food.y) {
                score++;
                updateScoreDisplay();
                placeFood(); // Place new food
                if (gameSpeed > 60) { // Increase speed, with a max speed cap
                    gameSpeed -= SPEED_INCREMENT;
                }
            } else {
                snake.pop(); // Remove tail if no food eaten (snake moves)
            }

            drawGame(); // Redraw the game state
            gameLoopTimeoutId = setTimeout(updateGame, gameSpeed); // Schedule next update
        }

        // Update the score display on the screen
        function updateScoreDisplay() {
            scoreDisplay.textContent = `Score: ${score}`;
        }

        // Handles the flow of starting a new game
        function startGameFlow() {
            calculateGrid(); // Ensure grid is correct for current screen size
            initGame(); 
            gameRunning = true;
            // Hide start/game over screens, show score
            startScreen.style.display = 'none';
            gameOverScreen.style.display = 'none';
            scoreDisplay.style.display = 'block';
            // Show touch controls if on a touch device
            if (isTouchDevice()) {
                touchControlsContainer.style.display = 'grid';
            }
            updateGame(); // Start the game loop
        }
        
        // Handles the game over state
        function gameOver() {
            gameRunning = false;
            if (gameLoopTimeoutId) clearTimeout(gameLoopTimeoutId); // Stop the game loop
            finalScoreDisplay.textContent = score; // Show final score
            gameOverScreen.style.display = 'flex'; // Show game over message box
            scoreDisplay.style.display = 'block'; // Keep score visible
            // Hide touch controls on game over
            if (isTouchDevice()) { 
                 touchControlsContainer.style.display = 'none';
            }
        }

        // Handle keyboard input for snake movement
        function handleKeyPress(e) {
            const key = e.key;
            // Allow starting game with Enter/Space from start or game over screens
            if (!gameRunning && (startScreen.style.display === 'flex' || gameOverScreen.style.display === 'flex')) {
                if (key === 'Enter' || key === ' ') {
                    e.preventDefault(); // Prevent space from scrolling page
                    startGameFlow();
                }
                return;
            }

            if (!gameRunning) return; // Ignore input if game not running

            // Update nextDirection based on arrow keys or WASD, preventing 180-degree turns
            if ((key === 'ArrowUp' || key.toLowerCase() === 'w') && direction !== 'DOWN') nextDirection = 'UP';
            else if ((key === 'ArrowDown' || key.toLowerCase() === 's') && direction !== 'UP') nextDirection = 'DOWN';
            else if ((key === 'ArrowLeft' || key.toLowerCase() === 'a') && direction !== 'RIGHT') nextDirection = 'LEFT';
            else if ((key === 'ArrowRight' || key.toLowerCase() === 'd') && direction !== 'LEFT') nextDirection = 'RIGHT';
        }
        
        // Check if the device supports touch events
        function isTouchDevice() {
            return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        }

        // --- Event Listeners ---
        startButton.addEventListener('click', startGameFlow);
        restartButton.addEventListener('click', startGameFlow);
        document.addEventListener('keydown', handleKeyPress);

        // Setup touch control buttons if on a touch device
        if (isTouchDevice()) {
            document.getElementById('btn-up').addEventListener('click', () => { if (gameRunning && direction !== 'DOWN') nextDirection = 'UP'; });
            document.getElementById('btn-down').addEventListener('click', () => { if (gameRunning && direction !== 'UP') nextDirection = 'DOWN'; });
            document.getElementById('btn-left').addEventListener('click', () => { if (gameRunning && direction !== 'RIGHT') nextDirection = 'LEFT'; });
            document.getElementById('btn-right').addEventListener('click', () => { if (gameRunning && direction !== 'LEFT') nextDirection = 'RIGHT'; });
        } else {
            touchControlsContainer.style.display = 'none'; // Ensure controls are hidden on non-touch devices
        }
        
        // Handle window resize events
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout); // Debounce resize event to avoid rapid calls
            resizeTimeout = setTimeout(() => {
                // *** FIX: Store old tile counts BEFORE calculateGrid updates them globally ***
                const oldTilesX = tileCountX; 
                const oldTilesY = tileCountY;

                calculateGrid(); // Recalculate grid and canvas size for new window size
                
                if (gameRunning && snake && snake.length > 0) {
                    // If game is running, attempt to scale snake and food positions
                    if (oldTilesX > 0 && oldTilesY > 0) { // Ensure old dimensions were valid
                        snake.forEach(segment => {
                            // Scale position by the ratio of new tile count to old tile count
                            segment.x = Math.round(segment.x * (tileCountX / oldTilesX));
                            segment.y = Math.round(segment.y * (tileCountY / oldTilesY));
                            // Clamp positions to stay within new grid boundaries
                            segment.x = Math.max(0, Math.min(segment.x, tileCountX - 1));
                            segment.y = Math.max(0, Math.min(segment.y, tileCountY - 1));
                        });
                        if (food) { // Scale food position similarly
                            food.x = Math.round(food.x * (tileCountX / oldTilesX));
                            food.y = Math.round(food.y * (tileCountY / oldTilesY));
                            food.x = Math.max(0, Math.min(food.x, tileCountX - 1));
                            food.y = Math.max(0, Math.min(food.y, tileCountY - 1));
                        }
                    } else {
                        // Fallback if old dimensions were invalid: re-center snake and place new food
                        snake = [{ x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) }];
                        if (food) placeFood(); 
                    }
                    drawGame(); // Redraw game with new positions
                } else {
                    // If game not running (e.g., on start or game over screen), just redraw the static state
                    drawGame(); 
                }

                // Ensure touch controls are displayed correctly based on device type and game state
                if (isTouchDevice() && gameRunning) {
                    touchControlsContainer.style.display = 'grid';
                } else if (isTouchDevice() && !gameRunning && startScreen.style.display === 'flex') {
                     touchControlsContainer.style.display = 'grid'; // Show on start screen for touch
                }
                else if (!isTouchDevice()){
                    touchControlsContainer.style.display = 'none';
                }
            }, 250); // Debounce timeout of 250ms
        });

        // --- Initial Setup ---
        calculateGrid(); // Calculate initial grid and canvas size
        updateColorsFromCSS(); // Get snake head color from CSS variables
        drawGame(); // Draw initial empty board (snake/food won't be drawn as gameRunning is false)
        
        // Show touch controls on start screen if it's a touch device
        if (isTouchDevice() && startScreen.style.display === 'flex') {
            touchControlsContainer.style.display = 'grid';
        }
