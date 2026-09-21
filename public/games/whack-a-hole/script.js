const gameBoard = document.getElementById('gameBoard');
        const scoreDisplay = document.getElementById('score');
        const timeDisplay = document.getElementById('time');
        const startButton = document.getElementById('startButton');
        const messageBox = document.getElementById('messageBox');
        const difficultySelect = document.getElementById('difficulty');
        const goodSound = document.getElementById('goodSound');

        // Create a pool of audio elements for the bad sound
        const badSoundPoolSize = 5; // Number of instances for the bad sound
        const badSoundPool = [];
        const badSoundSrc = "https://www.soundjay.com/button/button-3.mp3"; // Updated example bad sound URL

        // Populate the bad sound pool
        for (let i = 0; i < badSoundPoolSize; i++) {
            const audio = new Audio(badSoundSrc);
            badSoundPool.push(audio);
        }

        // Function to get an available bad sound audio element
        function getAvailableBadSound() {
            for (let i = 0; i < badSoundPoolSize; i++) {
                // Check if the audio is paused or has finished playing
                if (badSoundPool[i].paused || badSoundPool[i].ended) {
                    return badSoundPool[i];
                }
            }
            // If all are playing, return null or the first one to potentially interrupt it
            // Returning null means the sound won't play if all instances are busy
            return null;
        }


        let score = 0;
        let time = 30;
        let gameInterval;
        let moleTimeout;
        let lastHole;
        let gameRunning = false;
        let moleSpeed = { easy: [700, 2000], medium: [500, 1500], hard: [300, 1000] }; // [min, max] time mole is visible
        let gameDuration = { easy: 45, medium: 30, hard: 20 }; // Game duration in seconds

        // Pixelated character SVG
        const moleSVG = `
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <rect x="4" y="10" width="8" height="6" fill="#5A2D2D"/>
                <rect x="5" y="9" width="6" height="1" fill="#5A2D2D"/>
                <rect x="6" y="8" width="4" height="1" fill="#5A2D2D"/>
                <rect x="7" y="7" width="2" height="1" fill="#5A2D2D"/>
                <rect x="6" y="5" width="1" height="2" fill="#000000"/>
                <rect x="9" y="5" width="1" height="2" fill="#000000"/>
                <rect x="5" y="3" width="6" height="2" fill="#5A2D2D"/>
                <rect x="4" y="4" width="1" height="1" fill="#5A2D2D"/>
                <rect x="11" y="4" width="1" height="1" fill="#5A2D2D"/>
            </svg>
        `;


        // Create the holes dynamically
        function createBoard() {
            gameBoard.innerHTML = ''; // Clear existing board
            for (let i = 0; i < 9; i++) {
                const hole = document.createElement('div');
                hole.classList.add('hole');
                hole.dataset.index = i; // Add index for reference
                const mole = document.createElement('div');
                mole.classList.add('mole');
                mole.innerHTML = moleSVG; // Add the SVG character
                hole.appendChild(mole);
                gameBoard.appendChild(hole);

                // Add click listener to the hole
                hole.addEventListener('click', whack);
            }
        }

        // Function to get a random time for mole appearance based on difficulty
        function randomTime(difficulty) {
            const [min, max] = moleSpeed[difficulty];
            return Math.round(Math.random() * (max - min) + min);
        }

        // Function to get a random hole
        function randomHole(holes) {
            const idx = Math.floor(Math.random() * holes.length);
            const hole = holes[idx];
            // Prevent the same hole from appearing twice in a row
            if (hole === lastHole) {
                return randomHole(holes);
            }
            lastHole = hole;
            return hole;
        }

        // Function to make the mole appear
        function peek() {
            const holes = document.querySelectorAll('.hole');
            const difficulty = difficultySelect.value;
            const time = randomTime(difficulty);
            const hole = randomHole(Array.from(holes)); // Convert NodeList to Array
            hole.classList.add('active'); // Show the mole

            moleTimeout = setTimeout(() => {
                hole.classList.remove('active'); // Hide the mole
                if (gameRunning) {
                    peek(); // Make another mole appear if game is running
                }
            }, time);
        }

        // Function to handle a whack
        function whack(event) {
            // Check if the clicked element or its parent is the mole AND the game is running
            const isMoleElement = event.target.classList.contains('mole') || event.target.closest('.mole');
            const holeElement = event.target.classList.contains('hole') ? event.target : event.target.closest('.hole');

            if (!gameRunning || !holeElement) return; // Only whack if game is running and a hole was clicked

            if (holeElement.classList.contains('active')) {
                // Hit the mole!
                score++;
                scoreDisplay.textContent = score;
                holeElement.classList.remove('active'); // Hide the mole

                // Add hit feedback class and remove after a short delay
                holeElement.classList.add('hit');
                setTimeout(() => {
                    holeElement.classList.remove('hit');
                }, 150); // Change color for 150 milliseconds

                try {
                    goodSound.currentTime = 0;
                    const p = goodSound.play();
                    if (p && p.catch) p.catch(() => {});
                } catch (e) {}

                // Clear the timeout for the current mole to prevent it from hiding itself later
                clearTimeout(moleTimeout);
                // Immediately peek another mole to keep the game going
                if (gameRunning) {
                     peek();
                }

            } else {
                // Missed! Hit an empty hole
                const badSound = getAvailableBadSound();
                if (badSound) {
                    try {
                        badSound.currentTime = 0;
                        const p = badSound.play();
                        if (p && p.catch) p.catch(() => {});
                    } catch (e) {}
                }
            }
        }


        // Function to start the game
        function startGame() {
            score = 0;
            const difficulty = difficultySelect.value;
            time = gameDuration[difficulty]; // Set game duration based on difficulty
            scoreDisplay.textContent = score;
            timeDisplay.textContent = time;
            messageBox.textContent = ''; // Clear any previous messages
            gameRunning = true;
            startButton.disabled = true; // Disable start button during game
            difficultySelect.disabled = true; // Disable difficulty select during game

            createBoard(); // Create the game board

            // Start the timer
            gameInterval = setInterval(() => {
                time--;
                timeDisplay.textContent = time;
                if (time <= 0) {
                    endGame();
                }
            }, 1000);

            // Start the moles appearing
            peek();
        }

        // Function to end the game
        function endGame() {
            gameRunning = false;
            clearInterval(gameInterval);
            clearTimeout(moleTimeout); // Clear any pending mole timeouts

            // Hide all moles
            document.querySelectorAll('.hole').forEach(hole => hole.classList.remove('active'));

            messageBox.textContent = `Game Over! Your final score is ${score}.`;
            startButton.disabled = false; // Enable start button
            difficultySelect.disabled = false; // Enable difficulty select
        }

        // Event listener for the start button
        startButton.addEventListener('click', startGame);

        // Initial board creation on page load
        createBoard();
