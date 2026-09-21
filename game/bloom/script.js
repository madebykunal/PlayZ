 const gameGrid = document.getElementById('game-grid');
        const levelValue = document.getElementById('level-value');
        const scoreValue = document.getElementById('score-value');
        const clicksValue = document.getElementById('clicks-value');
        const startScreen = document.getElementById('start-screen'); // Get start screen element
        const startButton = document.getElementById('start-button'); // Get start button element
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScoreValue = document.getElementById('final-score-value');
        const nextLevelButton = document.getElementById('next-level-button');
        const restartButton = document.getElementById('restart-button');
        const gameOverTitle = document.getElementById('game-over-title');

        // Game variables
        let currentLevel = 1;
        let score = 0;
        let GRID_SIZE = 8; // Initial grid size (e.g., 8x8)
        let clicksLeft = 0; // Clicks remaining for the level
        const BLOOM_STAGES = 3; // Number of bloom stages/colors
        let bloomDurationPerStage = 150; // ms for each bloom stage transition (will decrease)

        let pixels = []; // Array to hold pixel elements
        let activeBlooms = 0; // Counter for pixels currently blooming

        // --- Game Initialization and Setup ---

        // Creates the grid of pixels dynamically
        function createGrid() {
            gameGrid.innerHTML = '';
            gameGrid.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
            gameGrid.style.gridTemplateRows = `repeat(${GRID_SIZE}, 1fr)`;

            pixels = []; // Reset pixels array
            for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
                const pixel = document.createElement('div');
                pixel.classList.add('pixel');
                pixel.dataset.index = i; // Store index (0 to GRID_SIZE*GRID_SIZE - 1)
                pixel.dataset.row = Math.floor(i / GRID_SIZE);
                pixel.dataset.col = i % GRID_SIZE;
                pixel.dataset.state = 'idle'; // Initial state
                pixel.addEventListener('click', handlePixelClick);
                gameGrid.appendChild(pixel);
                pixels.push(pixel);
            }
        }

        // Starts a new level or restarts from level 1
        function startGame(level = 1) {
            currentLevel = level;
            levelValue.textContent = currentLevel;

            // Reset score only if starting from level 1
            if (level === 1) {
                score = 0;
            }
            scoreValue.textContent = score;

            // Determine grid size, clicks, and bloom speed based on level
            GRID_SIZE = 8 + Math.floor((currentLevel - 1) / 2); // Increase grid size every 2 levels
            if (GRID_SIZE > 12) GRID_SIZE = 12; // Cap max grid size

            // Calculate clicks allowed: Start low (3-4) and increase gradually
            clicksLeft = Math.max(3, Math.ceil(GRID_SIZE * GRID_SIZE * 0.03 + (currentLevel - 1) * 0.3));
            clicksValue.textContent = clicksLeft; // Update clicks display

            // Calculate bloom duration: Decrease as level increases (faster blooming)
            // Start at 150ms, decrease by 10ms per level, minimum 50ms
            bloomDurationPerStage = Math.max(50, 150 - (currentLevel - 1) * 10);


            createGrid(); // Create the grid for the new level
            startScreen.classList.add('hidden'); // Hide start screen
            gameOverScreen.classList.add('hidden'); // Hide game over screen
            gameOverTitle.textContent = 'Level Complete!'; // Reset title
            nextLevelButton.classList.remove('hidden'); // Show next level button
            restartButton.classList.add('hidden'); // Hide restart button
        }

        // Ends the game (either level complete or game over)
        function endGame(isGameOver = false) {
            gameOverScreen.classList.remove('hidden');
            finalScoreValue.textContent = score;

            if (isGameOver) {
                gameOverTitle.textContent = 'Game Over!';
                nextLevelButton.classList.add('hidden'); // Hide next level button
                restartButton.classList.remove('hidden'); // Show restart button
            } else {
                gameOverTitle.textContent = 'Level Complete!';
                nextLevelButton.classList.remove('hidden'); // Show next level button
                restartButton.classList.add('hidden'); // Hide restart button
            }
        }

        // --- Game Logic ---

        // Handles a click on a pixel
        function handlePixelClick(event) {
            const pixel = event.target;
            const state = pixel.dataset.state;

            // Only interact with idle pixels AND if clicks are available
            if (state === 'idle' && clicksLeft > 0) {
                startBloom(pixel, 1); // Start the bloom sequence from stage 1
                updateScore(10); // Award points for starting a bloom (can adjust)

                clicksLeft--; // Decrement clicks
                clicksValue.textContent = clicksLeft; // Update clicks display

                // The checkWinCondition is called after a bloom finishes,
                // which is where we check for the win/loss state based on clicks and cleared pixels.
            } else if (state === 'idle' && clicksLeft <= 0) {
                 // Optional: Provide feedback that no clicks are left
                 // console.log("No clicks left!");
            }
            // Clicks on blooming or cleared pixels are ignored by this logic
        }

        // Starts the bloom sequence for a pixel
        function startBloom(pixel, stage) {
            // Added check for state again inside setTimeout callback to prevent issues
            // if a pixel was somehow clicked/changed state during the delay
            if (!pixel || (pixel.dataset.state !== 'idle' && !pixel.dataset.state.startsWith('blooming-'))) {
                return; // Only bloom idle pixels or continue blooming sequence
            }

             // If it's the first stage, change state from 'idle'
            if (stage === 1 && pixel.dataset.state === 'idle') {
                pixel.dataset.state = `blooming-${stage}`;
                pixel.classList.remove('idle', 'cleared'); // Clean up previous states
                pixel.classList.add(`blooming-${stage}`);
                activeBlooms++; // Increment active blooms counter ONLY when starting a new bloom
            } else if (pixel.dataset.state.startsWith('blooming-')) {
                 // If already blooming, update to the next stage
                 pixel.dataset.state = `blooming-${stage}`;
                 pixel.classList.remove('blooming-1', 'blooming-2', 'blooming-3');
                 pixel.classList.add(`blooming-${stage}`);
            } else {
                 return; // Should not happen with the checks above, but good practice
            }


            // Schedule the next stage of blooming or clearing using the current bloomDurationPerStage
            setTimeout(() => {
                if (stage < BLOOM_STAGES) {
                    startBloom(pixel, stage + 1); // Move to the next bloom stage
                } else {
                    // Pixel has finished blooming
                    pixel.dataset.state = 'cleared';
                    pixel.classList.remove('blooming-1', 'blooming-2', 'blooming-3');
                    pixel.classList.add('cleared');
                    activeBlooms--; // Decrement active blooms counter

                    // Trigger neighbors to bloom
                    triggerNeighbors(pixel);

                    // Check for win condition after a short delay to allow chain reactions to propagate
                    setTimeout(checkWinCondition, 100);
                }
            }, bloomDurationPerStage); // Use the dynamic bloom duration here
        }

        // Triggers the neighbors of a bloomed pixel
        function triggerNeighbors(pixel) {
            const row = parseInt(pixel.dataset.row);
            const col = parseInt(pixel.dataset.col);

            const neighbors = [
                { r: row - 1, c: col }, // Up
                { r: row + 1, c: col }, // Down
                { r: row, c: col - 1 }, // Left
                { r: row, c: col + 1 }  // Right
            ];

            neighbors.forEach(neighborPos => {
                // Check if neighbor is within grid bounds
                if (neighborPos.r >= 0 && neighborPos.r < GRID_SIZE && neighborPos.c >= 0 && neighborPos.c < GRID_SIZE) {
                    const neighborIndex = neighborPos.r * GRID_SIZE + neighborPos.c;
                    const neighborPixel = pixels[neighborIndex];

                    // If the neighbor is idle, start its bloom sequence from stage 1
                    if (neighborPixel && neighborPixel.dataset.state === 'idle') {
                        startBloom(neighborPixel, 1);
                        updateScore(5); // Award fewer points for triggered blooms
                    }
                }
            });
        }

        // Updates the score display
        function updateScore(points) {
            score += points;
            scoreValue.textContent = score;
        }

        // Checks if all pixels have been cleared and if clicks are exactly 0 for a win
        function checkWinCondition() {
            // Wait until all active bloom animations have finished
            if (activeBlooms > 0) {
                setTimeout(checkWinCondition, 50); // Check again shortly
                return;
            }

            const allCleared = pixels.every(pixel => pixel.dataset.state === 'cleared');

            if (allCleared) {
                // All pixels are cleared. Now check if clicks are exactly 0.
                if (clicksLeft === 0) {
                    endGame(false); // Level complete! (Cleared AND used all clicks)
                } else {
                    // All pixels cleared, but clicks are left over. Game Over!
                    endGame(true); // Game Over! (Cleared but didn't use all clicks)
                }
            } else if (clicksLeft <= 0) {
                // Not all cleared AND no clicks left, it's game over
                endGame(true); // Game Over! (Ran out of clicks before clearing)
            }
            // If not all cleared but clicks are left, game continues
        }

        // --- Event Listeners ---
        startButton.addEventListener('click', () => startGame(1)); // Start from level 1
        nextLevelButton.addEventListener('click', () => startGame(currentLevel + 1)); // Go to next level
        restartButton.addEventListener('click', () => startGame(1)); // Restart from level 1

        // Initial state: Show the start screen when the page loads
        // createGrid(); // No need to create grid until game starts
        // startLevel(1); // No need to start level until game starts