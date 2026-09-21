const game = {
            score: 0,
            highScore: localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0,
            level: 1,
            lives: 3,
            gameInterval: null,
            obstacleInterval: null,
            audioContext: null,
            isPlaying: false,
            isPaused: false,
            difficulty: 'medium',
            difficultyThresholds: {
                medium: 0,  // Start at medium
                hard: 25    // Switch to hard at 25 points
            },
            difficultySettings: {
                medium: {
                    targetInterval: 1000,
                    obstacleInterval: 2000,
                    obstacleChance: 0.4,
                    fadeOutTime: 2.5
                },
                hard: {
                    targetInterval: 800,
                    obstacleInterval: 1500,
                    obstacleChance: 0.5,
                    fadeOutTime: 2
                }
            },

            initAudio: function() {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.log('Audio context not supported');
                }
            },

            // Play different sounds based on type and frequency
            playSound: function(type, frequency) {
                if (!this.audioContext) return;

                try {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();

                    if (type === 'score') {
                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2); // Shorter sound
                    } else if (type === 'obstacle') {
                        oscillator.type = 'sawtooth';
                        oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime); // Lower pitch
                        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2); // Shorter sound
                    } else if (type === 'levelUp') {
                        oscillator.type = 'square';
                        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

                        setTimeout(() => {
                            oscillator.frequency.setValueAtTime(550, this.audioContext.currentTime); // Simple pitch change
                        }, 100);


                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4); // Shorter sound
                    }

                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);

                    oscillator.start();

                    if (type === 'levelUp') {
                        oscillator.stop(this.audioContext.currentTime + 0.4);
                    } else {
                        oscillator.stop(this.audioContext.currentTime + 0.2);
                    }
                } catch (e) {
                    console.log('Error playing sound');
                }
            },

            // Create a target (colored ball to tap)
            createTarget: function() {
                if (!this.isPlaying || this.isPaused) return;

                // Use a limited monochrome-friendly palette or just primary color
                const colors = [
                    '#00FF00', /* Green */
                     '#FFFF00', /* Yellow */
                     '#00FFFF', /* Cyan */
                     '#FF00FF'  /* Magenta */
                ];
                const target = document.createElement('div');
                const gameContainer = document.getElementById('gameContainer');
                const color = colors[Math.floor(Math.random() * colors.length)];

                const size = Math.max(25, Math.min(35, gameContainer.offsetWidth * 0.08));
                target.className = 'target';
                target.dataset.type = 'target';
                target.style.backgroundColor = color;
                target.style.width = `${size}px`;
                target.style.height = `${size}px`;

                const maxX = gameContainer.offsetWidth - size;
                const maxY = gameContainer.offsetHeight - size;
                target.style.left = Math.random() * maxX + 'px';
                target.style.top = Math.random() * maxY + 'px';

                // Set animation duration based on difficulty and level
                const settings = this.difficultySettings[this.difficulty];
                const fadeOutTime = Math.max(0.8, settings.fadeOutTime - ((this.level - 1) * 0.05)); // Slightly faster fade
                target.style.animationDuration = `${fadeOutTime}s`;
                target.style.setProperty('--target-fade-time', `${fadeOutTime}s`); // Set CSS variable for animation

                target.addEventListener('click', () => {
                    if (this.isPaused) return;

                    this.score += 1;
                    document.getElementById('scoreValue').textContent = this.score;

                    // Check for level up
                    const newLevel = Math.floor(this.score / 10) + 1;
                    if (newLevel > this.level) {
                        this.level = newLevel;
                        document.getElementById('levelValue').textContent = this.level;
                        this.playSound('levelUp', 440);
                        this.updateGameSpeed();

                        // No pulsing animation in retro style
                        // const levelValue = document.getElementById('levelValue');
                        // levelValue.classList.add('pulsing');
                        // setTimeout(() => {
                        //     levelValue.classList.remove('pulsing');
                        // }, 2000);
                    }

                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        document.getElementById('highScore').textContent = this.highScore;
                        localStorage.setItem('highScore', this.highScore);
                    }

                    // Update difficulty based on score
                    this.updateDifficulty();

                    if (target.parentElement) {
                       gameContainer.removeChild(target);
                    }
                    this.playSound('score', 440 + this.score * 5); // Pitch increases slower
                });

                target.addEventListener('animationend', () => {
                    // If the target still exists when the animation ends, it was missed
                    if (target.parentElement) {
                        if (target.dataset.type === 'target') { // Only lose life for colored targets
                            this.loseLife();
                            this.playSound('obstacle', 110); // Play obstacle sound when colored target is missed
                        }
                        gameContainer.removeChild(target);
                    }
                });

                gameContainer.appendChild(target);
            },

            // Create an obstacle (white ball that shouldn't be tapped)
            createObstacle: function() {
                if (!this.isPlaying || this.isPaused) return;

                // Check obstacle chance based on difficulty
                const settings = this.difficultySettings[this.difficulty];
                const shouldCreateObstacle = Math.random() < settings.obstacleChance + ((this.level - 1) * 0.05);

                if (!shouldCreateObstacle) return;

                const obstacle = document.createElement('div');
                const gameContainer = document.getElementById('gameContainer');

                const size = Math.max(25, Math.min(35, gameContainer.offsetWidth * 0.08));
                obstacle.className = 'target obstacle';
                obstacle.dataset.type = 'obstacle';
                 // Background color is set by CSS class now
                obstacle.style.width = `${size}px`;
                obstacle.style.height = `${size}px`;

                const maxX = gameContainer.offsetWidth - size;
                const maxY = gameContainer.offsetHeight - size;
                obstacle.style.left = Math.random() * maxX + 'px';
                obstacle.style.top = Math.random() * maxY + 'px';

                // Set animation duration based on difficulty and level
                const fadeOutTime = Math.max(1, settings.fadeOutTime + 0.5 - ((this.level - 1) * 0.05)); // Slightly faster fade
                obstacle.style.animationDuration = `${fadeOutTime}s`;
                 obstacle.style.setProperty('--target-fade-time', `${fadeOutTime}s`); // Set CSS variable for animation


                obstacle.addEventListener('click', () => {
                    if (this.isPaused) return;

                    this.loseLife();
                    if (obstacle.parentElement) {
                        gameContainer.removeChild(obstacle);
                    }
                    this.playSound('obstacle', 110);
                });

                obstacle.addEventListener('animationend', () => {
                    if (obstacle.parentElement) {
                        gameContainer.removeChild(obstacle);
                    }
                });

                gameContainer.appendChild(obstacle);
            },

            // Lose a life when tapping a white ball
            loseLife: function() {
                this.lives -= 1;
                this.updateLivesDisplay();

                if (this.lives <= 0) {
                    this.gameOver();
                }
            },

            // Update the lives display
            updateLivesDisplay: function() {
                const livesContainer = document.getElementById('livesContainer');
                livesContainer.innerHTML = '';

                for (let i = 0; i < 3; i++) {
                    const lifeElement = document.createElement('div');
                    lifeElement.className = i < this.lives ? 'life' : 'life lost';
                    livesContainer.appendChild(lifeElement);
                }
            },

            // Update game speed based on level and difficulty
            updateGameSpeed: function() {
                if (this.gameInterval) {
                    clearInterval(this.gameInterval);
                }

                if (this.obstacleInterval) {
                    clearInterval(this.obstacleInterval);
                }

                const settings = this.difficultySettings[this.difficulty];
                const targetSpeed = Math.max(200, settings.targetInterval - ((this.level - 1) * 40)); // Faster speed increase
                const obstacleSpeed = Math.max(400, settings.obstacleInterval - ((this.level - 1) * 80)); // Faster speed increase

                this.gameInterval = setInterval(() => {
                    this.createTarget();
                }, targetSpeed);

                this.obstacleInterval = setInterval(() => {
                    this.createObstacle();
                }, obstacleSpeed);
            },

            toggleGame: function() {
                if (!this.isPlaying) {
                    this.startGame();
                } else if (this.isPaused) {
                    this.resumeGame();
                } else {
                    this.pauseGame();
                }
            },

            startGame: function() {
                if (!this.audioContext) {
                    this.initAudio();
                }

                this.isPlaying = true;
                this.isPaused = false;
                this.score = 0;
                this.level = 1;
                this.lives = 3;
                this.difficulty = 'medium';

                document.getElementById('scoreValue').textContent = this.score;
                document.getElementById('levelValue').textContent = this.level;
                document.getElementById('highScore').textContent = this.highScore;
                document.getElementById('difficultyDisplay').textContent = 'Medium';
                document.getElementById('progressBar').style.width = '0%';

                const resumeButton = document.getElementById('resumeButton');
                resumeButton.classList.add('inactive');

                this.updateLivesDisplay();
                this.updateGameSpeed();
            },

            pauseGame: function() {
                this.isPaused = true;
                if (this.gameInterval) {
                    clearInterval(this.gameInterval);
                }
                if (this.obstacleInterval) {
                    clearInterval(this.obstacleInterval);
                }

                const targets = document.querySelectorAll('.target');
                targets.forEach(target => {
                    target.style.animationPlayState = 'paused';
                });

                document.getElementById('resumeButton').classList.remove('inactive');
            },

            resumeGame: function() {
                this.isPaused = false;
                const targets = document.querySelectorAll('.target');
                targets.forEach(target => {
                    target.style.animationPlayState = 'running';
                });

                document.getElementById('resumeButton').classList.add('inactive');
                this.updateGameSpeed();
            },

            // Stop the game
            stopGame: function() {
                if (this.gameInterval) {
                    clearInterval(this.gameInterval);
                }

                if (this.obstacleInterval) {
                    clearInterval(this.obstacleInterval);
                }

                // Clear all targets and obstacles
                const gameContainer = document.getElementById('gameContainer');
                const targets = document.querySelectorAll('.target');
                targets.forEach(target => {
                    if (target.parentElement) {
                        gameContainer.removeChild(target);
                    }
                });

                this.isPlaying = false;
                document.getElementById('resumeButton').classList.remove('inactive');
            },

            // Game over
            gameOver: function() {
                this.stopGame();

                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('finalLevel').textContent = this.level;

                const gameOverModal = document.getElementById('gameOverModal');
                gameOverModal.classList.add('active');
            },

            // Update difficulty based on score
            updateDifficulty: function() {
                let newDifficulty = 'medium';
                let progressPercent = 0;

                if (this.score >= this.difficultyThresholds.hard) {
                    newDifficulty = 'hard';
                    progressPercent = 100;
                } else {
                    // Calculate progress toward hard difficulty
                    progressPercent = Math.min(100, (this.score / this.difficultyThresholds.hard) * 100);
                }

                // Update progress bar
                document.getElementById('progressBar').style.width = `${progressPercent}%`;

                if (this.difficulty !== newDifficulty) {
                    this.difficulty = newDifficulty;
                    document.getElementById('difficultyDisplay').textContent =
                        newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1);

                    // No pulsing animation in retro style
                    // const difficultyDisplay = document.getElementById('difficultyDisplay');
                    // difficultyDisplay.classList.add('pulsing');
                    // setTimeout(() => {
                    //     difficultyDisplay.classList.remove('pulsing');
                    // }, 2000);

                    // Play special sound for difficulty change
                    if (this.isPlaying) {
                        this.playSound('levelUp', 660);
                        this.updateGameSpeed();
                    }
                }
            }
        };

        // Initialize high score from local storage
        document.getElementById('highScore').textContent = game.highScore;

        // Event Listeners
        document.getElementById('resumeButton').addEventListener('click', () => {
            game.toggleGame();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && game.isPlaying && !game.isPaused) {
                game.pauseGame();
            }
        });

        // Instructions modal functionality
        const instructionsModal = document.getElementById('instructionsModal');
        const instructionsButton = document.getElementById('instructionsButton');
        const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

        instructionsButton.addEventListener('click', () => {
            instructionsModal.classList.add('active');
            if (game.isPlaying && !game.isPaused) {
                game.pauseGame();
            }
        });

        closeInstructionsBtn.addEventListener('click', () => {
            instructionsModal.classList.remove('active');
        });

        // Game over modal functionality
        const gameOverModal = document.getElementById('gameOverModal');
        const playAgainBtn = document.getElementById('playAgainBtn');

        playAgainBtn.addEventListener('click', () => {
            gameOverModal.classList.remove('active');
            game.startGame();
        });

        // Initialize lives display
        game.updateLivesDisplay();

        // Start the game when the page loads
        window.addEventListener('load', () => {
            // Show instructions modal on first visit
            if (!localStorage.getItem('instructionsShown')) {
                instructionsModal.classList.add('active');
                localStorage.setItem('instructionsShown', true);
            }
            // Don't start game automatically - make resume button visible
            document.getElementById('resumeButton').classList.remove('inactive');
        });

        // Handle keyboard events
        document.addEventListener('keydown', (e) => {
            // Space bar or Enter to pause/resume
            if (e.code === 'Space' || e.code === 'Enter') {
                if (game.isPlaying) {
                    game.toggleGame();
                } else if (document.getElementById('gameOverModal').classList.contains('active')) {
                    gameOverModal.classList.remove('active');
                    game.startGame();
                } else if (document.getElementById('instructionsModal').classList.contains('active')) {
                    instructionsModal.classList.remove('active');
                    if (!game.isPlaying) {
                        game.startGame();
                    }
                }
            }
        });

        // Make sure game is properly sized on window resize
        window.addEventListener('resize', () => {
            if (game.isPlaying && !game.isPaused) {
                // Adjust position of existing targets if window is resized
                const gameContainer = document.getElementById('gameContainer');
                const targets = document.querySelectorAll('.target');

                targets.forEach(target => {
                    const maxX = gameContainer.offsetWidth - target.offsetWidth;
                    const maxY = gameContainer.offsetHeight - target.offsetHeight;

                    const currentX = parseInt(target.style.left);
                    const currentY = parseInt(target.style.top);

                    if (currentX > maxX) {
                        target.style.left = maxX + 'px';
                    }

                    if (currentY > maxY) {
                        target.style.top = maxY + 'px';
                    }
                });
            }
        });