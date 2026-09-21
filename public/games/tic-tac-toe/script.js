 document.addEventListener('DOMContentLoaded', function() {
      // DOM elements
      const menuScreen = document.querySelector('.menu-screen');
      const gameScreen = document.querySelector('.game-screen');
      const singlePlayerBtn = document.getElementById('single-player');
      const twoPlayerBtn = document.getElementById('two-player');
      const backBtn = document.getElementById('back-btn');
      const statusDisplay = document.getElementById('status');
      const boardElement = document.getElementById('board');
      
      // Game variables
      let gameActive = false;
      let currentPlayer = 'X';
      let gameMode = '';
      let gameState = ['', '', '', '', '', '', '', '', ''];
      
      // Winning combinations
      const winningConditions = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal top-left to bottom-right
        [2, 4, 6]  // Diagonal top-right to bottom-left
      ];
      
      // Sounds (empty for now - could add retro sounds later)
      const sounds = {
        click: () => {},
        win: () => {},
        draw: () => {},
        computerMove: () => {}
      };
      
      // Initialize the board
      function initBoard() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
          const cell = document.createElement('div');
          cell.classList.add('cell');
          cell.dataset.index = i;
          cell.addEventListener('click', handleCellClick);
          boardElement.appendChild(cell);
        }
      }
      
      // Handle cell click
      function handleCellClick(event) {
        const clickedCell = event.target;
        const clickedCellIndex = parseInt(clickedCell.dataset.index);
        
        if (gameState[clickedCellIndex] !== '' || !gameActive) return;
        
        updateCell(clickedCell, clickedCellIndex);
        checkForWin();
        
        if (gameMode === 'single' && gameActive && currentPlayer === 'O') {
          // Computer's turn
          setTimeout(() => {
            computerMove();
            checkForWin();
          }, 500);
        }
      }
      
      // Computer move
      function computerMove() {
        // Try to win
        for (let i = 0; i < 9; i++) {
          if (gameState[i] === '') {
            gameState[i] = 'O';
            if (checkWinCondition()) {
              updateCell(document.querySelector(`[data-index="${i}"]`), i);
              return;
            }
            gameState[i] = '';
          }
        }
        
        // Try to block player
        for (let i = 0; i < 9; i++) {
          if (gameState[i] === '') {
            gameState[i] = 'X';
            if (checkWinCondition()) {
              gameState[i] = 'O';
              updateCell(document.querySelector(`[data-index="${i}"]`), i);
              return;
            }
            gameState[i] = '';
          }
        }
        
        // Take center if available
        if (gameState[4] === '') {
          gameState[4] = 'O';
          updateCell(document.querySelector('[data-index="4"]'), 4);
          return;
        }
        
        // Take a corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(corner => gameState[corner] === '');
        if (availableCorners.length > 0) {
          const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
          gameState[randomCorner] = 'O';
          updateCell(document.querySelector(`[data-index="${randomCorner}"]`), randomCorner);
          return;
        }
        
        // Take any available cell
        const availableCells = gameState.map((cell, index) => cell === '' ? index : null).filter(cell => cell !== null);
        if (availableCells.length > 0) {
          const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
          gameState[randomCell] = 'O';
          updateCell(document.querySelector(`[data-index="${randomCell}"]`), randomCell);
        }
      }
      
      // Update cell
      function updateCell(cell, index) {
        sounds.click();
        gameState[index] = currentPlayer;
        
        cell.classList.add('pixel-appear');
        cell.classList.add(`cell-${currentPlayer.toLowerCase()}`);
        
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        statusDisplay.textContent = `${currentPlayer}'s turn`;
      }
      
      // Check for win or draw
      function checkForWin() {
        let roundWon = checkWinCondition();
        
        if (roundWon) {
          const winInfo = getWinInfo();
          drawWinLine(winInfo.combo, winInfo.type);
          
          statusDisplay.textContent = `${currentPlayer === 'X' ? 'O' : 'X'} Wins!`;
          statusDisplay.classList.add('blink');
          gameActive = false;
          sounds.win();
          
          // Auto-start new game after delay
          setTimeout(() => {
            resetGame();
          }, 2000);
          return;
        }
        
        let roundDraw = !gameState.includes('');
        if (roundDraw) {
          statusDisplay.textContent = 'Draw!';
          statusDisplay.classList.add('blink');
          gameActive = false;
          sounds.draw();
          
          // Auto-start new game after delay
          setTimeout(() => {
            resetGame();
          }, 2000);
          return;
        }
      }
      
      // Check win condition
      function checkWinCondition() {
        for (let i = 0; i < winningConditions.length; i++) {
          const [a, b, c] = winningConditions[i];
          if (gameState[a] !== '' && 
              gameState[a] === gameState[b] && 
              gameState[b] === gameState[c]) {
            return true;
          }
        }
        return false;
      }
      
      // Get winning line info
      function getWinInfo() {
        for (let i = 0; i < winningConditions.length; i++) {
          const [a, b, c] = winningConditions[i];
          if (gameState[a] !== '' && 
              gameState[a] === gameState[b] && 
              gameState[b] === gameState[c]) {
            
            let type;
            // Determine win type
            if (i < 3) type = { class: 'horizontal', pos: `row-${i}` }; // Rows
            else if (i < 6) type = { class: 'vertical', pos: `col-${i-3}` }; // Columns
            else if (i === 6) type = { class: 'diagonal-1', pos: '' }; // Diagonal 1
            else type = { class: 'diagonal-2', pos: '' }; // Diagonal 2
            
            return { combo: winningConditions[i], type };
          }
        }
        return null;
      }
      
      // Draw win line
      function drawWinLine(combo, type) {
        const line = document.createElement('div');
        line.classList.add('win-line', type.class);
        if (type.pos) line.classList.add(type.pos);
        
        const firstCell = document.querySelector(`[data-index="${combo[0]}"]`);
        firstCell.appendChild(line);
        
        // Highlight winning cells
        combo.forEach(index => {
          const cell = document.querySelector(`[data-index="${index}"]`);
          cell.classList.add('win-cell');
        });
      }
      
      // Reset game
      function resetGame() {
        gameActive = true;
        currentPlayer = 'X';
        gameState = ['', '', '', '', '', '', '', '', ''];
        statusDisplay.textContent = `${currentPlayer}'s turn`;
        statusDisplay.classList.remove('blink');
        
        document.querySelectorAll('.cell').forEach(cell => {
          cell.classList.remove('cell-x', 'cell-o', 'pixel-appear', 'win-cell');
          cell.innerHTML = '';
        });
        
        // Remove any win lines
        document.querySelectorAll('.win-line').forEach(line => {
          line.remove();
        });
        
        if (gameMode === 'single' && currentPlayer === 'O') {
          setTimeout(computerMove, 400);
        }
      }
      
      // Event listeners for menu buttons
      singlePlayerBtn.addEventListener('click', () => {
        sounds.click();
        gameMode = 'single';
        menuScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initBoard();
        resetGame();
      });
      
      twoPlayerBtn.addEventListener('click', () => {
        sounds.click();
        gameMode = 'two';
        menuScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        initBoard();
        resetGame();
      });
      
      backBtn.addEventListener('click', () => {
        sounds.click();
        menuScreen.style.display = 'flex';
        gameScreen.style.display = 'none';
      });
    });