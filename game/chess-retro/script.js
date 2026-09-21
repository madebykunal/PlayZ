// --- DOM Elements ---
        const startScreen = document.querySelector('.start-screen');
        const gameScreen = document.querySelector('.game-screen');
        const vsPlayerBtn = document.getElementById('vs-player-btn');
        const vsComputerBtn = document.getElementById('vs-computer-btn');
        const chessboardDiv = document.getElementById('chessboard');
        const statusBar = document.getElementById('status-bar');
        const resetGameBtn = document.getElementById('reset-game-btn');
        const mainMenuBtn = document.getElementById('main-menu-btn');

        const promotionModal = document.getElementById('promotion-modal');
        const promotionOptions = promotionModal.querySelector('.promotion-options');

        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');
        const messageOkBtn = document.getElementById('message-ok-btn');

        // --- Game State ---
        let board = []; 
        let currentPlayer = 'white'; 
        let gameMode = 'pvp'; 
        let selectedPiece = null; 
        let gameOver = false;
        let whiteKingPosition = { row: 7, col: 4 };
        let blackKingPosition = { row: 0, col: 4 };
        let enPassantTarget = null; 
        let fiftyMoveRuleCounter = 0; 
        let whiteCastlingRights = [true, true]; 
        let blackCastlingRights = [true, true];


        // --- Piece Unicode Representation ---
        const pieces = {
            'K': { white: '♔', black: '♚', type: 'king' },
            'Q': { white: '♕', black: '♛', type: 'queen' },
            'R': { white: '♖', black: '♜', type: 'rook' },
            'B': { white: '♗', black: '♝', type: 'bishop' },
            'N': { white: '♘', black: '♞', type: 'knight' },
            'P': { white: '♙', black: '♟', type: 'pawn' }
        };

        // --- Game Setup ---
        function initializeBoard() {
            board = [
                [{piece: 'R', color: 'black'}, {piece: 'N', color: 'black'}, {piece: 'B', color: 'black'}, {piece: 'Q', color: 'black'}, {piece: 'K', color: 'black'}, {piece: 'B', color: 'black'}, {piece: 'N', color: 'black'}, {piece: 'R', color: 'black'}],
                [{piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}, {piece: 'P', color: 'black'}],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [null, null, null, null, null, null, null, null],
                [{piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}, {piece: 'P', color: 'white'}],
                [{piece: 'R', color: 'white'}, {piece: 'N', color: 'white'}, {piece: 'B', color: 'white'}, {piece: 'Q', color: 'white'}, {piece: 'K', color: 'white'}, {piece: 'B', color: 'white'}, {piece: 'N', color: 'white'}, {piece: 'R', color: 'white'}]
            ];
            whiteKingPosition = { row: 7, col: 4 };
            blackKingPosition = { row: 0, col: 4 };
            whiteCastlingRights = [true, true]; 
            blackCastlingRights = [true, true];
            enPassantTarget = null;
            fiftyMoveRuleCounter = 0;
        }
        
        function renderBoard() {
            chessboardDiv.innerHTML = ''; 
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const square = document.createElement('div');
                    square.classList.add('square');
                    square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');
                    square.dataset.row = r;
                    square.dataset.col = c;

                    const pieceData = board[r][c];
                    if (pieceData) {
                        const pieceSpan = document.createElement('span');
                        pieceSpan.classList.add('piece', pieceData.color);
                        pieceSpan.textContent = pieces[pieceData.piece][pieceData.color];
                        square.appendChild(pieceSpan);
                    }
                    square.addEventListener('click', () => handleSquareClick(r, c));
                    chessboardDiv.appendChild(square);
                }
            }
            // updateStatus is called after renderBoard in functions like makeMove, startGame, etc.
            // to ensure the board is drawn before the status reflecting the new state is shown.
        }

        // --- UI Interaction ---
        vsPlayerBtn.addEventListener('click', () => startGame('pvp'));
        vsComputerBtn.addEventListener('click', () => startGame('pvc'));
        
        resetGameBtn.addEventListener('click', () => {
            startGame(gameMode); 
        });

        mainMenuBtn.addEventListener('click', () => {
            gameScreen.style.display = 'none';
            startScreen.style.display = 'flex';
            promotionModal.style.display = 'none'; 
            messageBox.style.display = 'none';
            gameOver = true; 
        });

        messageOkBtn.addEventListener('click', () => {
            messageBox.style.display = 'none';
        });

        function showMessage(msg) {
            messageText.textContent = msg;
            messageBox.style.display = 'block';
        }

        function startGame(mode) {
            gameMode = mode;
            currentPlayer = 'white';
            gameOver = false;
            selectedPiece = null;
            
            initializeBoard(); 
            renderBoard(); // Render the board first
            
            startScreen.style.display = 'none';
            gameScreen.style.display = 'flex';
            promotionModal.style.display = 'none'; 
            messageBox.style.display = 'none';   
            
            updateStatus(); // Then update the status
            
            // AI logic for starting as black is not standard, white always starts.
        }

        function updateStatus() {
            if (gameOver) return;
            let statusText = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}'s Turn`;
            if (isKingInCheck(currentPlayer)) {
                statusText += " - Check!";
            }
            statusBar.textContent = statusText;
        }
        
        function handleSquareClick(row, col) {
            if (gameOver) return;
            if (promotionModal.style.display === 'block') return; 

            const clickedSquarePiece = board[row][col];

            if (selectedPiece) {
                const { piece, sRow, sCol } = selectedPiece;
                const validMoves = getValidMoves(piece.piece, piece.color, sRow, sCol, true); 
                
                const isMoveValid = validMoves.some(move => move.row === row && move.col === col);

                if (isMoveValid) {
                    makeMove(sRow, sCol, row, col, piece); // This will render and then switch player/update status
                    // AI move is triggered after makeMove completes and if it's AI's turn
                } else if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
                    selectPiece(clickedSquarePiece, row, col);
                } else {
                    deselectPiece();
                }
            } else if (clickedSquarePiece && clickedSquarePiece.color === currentPlayer) {
                selectPiece(clickedSquarePiece, row, col);
            }
        }

        function selectPiece(pieceData, row, col) {
            deselectPiece(); 
            selectedPiece = { piece: pieceData, sRow: row, sCol: col };
            const squareDiv = chessboardDiv.querySelector(`.square[data-row='${row}'][data-col='${col}']`);
            if (squareDiv) squareDiv.classList.add('selected');
            highlightValidMoves(pieceData.piece, pieceData.color, row, col, true); 
        }

        function deselectPiece() {
            if (selectedPiece) {
                const { sRow, sCol } = selectedPiece;
                const squareDiv = chessboardDiv.querySelector(`.square[data-row='${sRow}'][data-col='${sCol}']`);
                if (squareDiv) squareDiv.classList.remove('selected');
            }
            selectedPiece = null;
            document.querySelectorAll('.square.valid-move, .square.capture-move').forEach(sq => {
                sq.classList.remove('valid-move');
                sq.classList.remove('capture-move');
            });
        }
        
        function highlightValidMoves(pieceType, color, r, c, checkSelfCheck = true) {
            const moves = getValidMoves(pieceType, color, r, c, checkSelfCheck);
            moves.forEach(move => {
                const squareDiv = chessboardDiv.querySelector(`.square[data-row='${move.row}'][data-col='${move.col}']`);
                if (squareDiv) {
                    if (board[move.row][move.col]) { 
                        squareDiv.classList.add('capture-move');
                    } else {
                        squareDiv.classList.add('valid-move');
                    }
                }
            });
        }

        function makeMove(startRow, startCol, endRow, endCol, pieceToMove, promotionPieceType = null) {
            const capturedPiece = board[endRow][endCol];
            
            if (pieceToMove.piece === 'P' || capturedPiece) {
                fiftyMoveRuleCounter = 0;
            } else {
                fiftyMoveRuleCounter++;
            }

            if (pieceToMove.piece === 'P' && enPassantTarget && endRow === enPassantTarget.row && endCol === enPassantTarget.col) {
                const capturedPawnRow = currentPlayer === 'white' ? endRow + 1 : endRow - 1;
                board[capturedPawnRow][endCol] = null; 
            }
            
            enPassantTarget = null; 
            if (pieceToMove.piece === 'P' && Math.abs(startRow - endRow) === 2) {
                 enPassantTarget = { row: (startRow + endRow) / 2, col: startCol, forPlayer: currentPlayer === 'white' ? 'black' : 'white' };
            }

            board[endRow][endCol] = { ...pieceToMove }; 
            board[startRow][startCol] = null;

            if (pieceToMove.piece === 'K') {
                if (pieceToMove.color === 'white') {
                    whiteKingPosition = { row: endRow, col: endCol };
                    whiteCastlingRights = [false, false]; 
                } else {
                    blackKingPosition = { row: endRow, col: endCol };
                    blackCastlingRights = [false, false];
                }
                if (Math.abs(startCol - endCol) === 2) { 
                    const rookStartCol = endCol > startCol ? 7 : 0; 
                    const rookEndCol = endCol > startCol ? endCol - 1 : endCol + 1;
                    const rook = board[endRow][rookStartCol]; 
                    board[endRow][rookEndCol] = rook;
                    board[endRow][rookStartCol] = null;
                }
            }
            
            if (pieceToMove.piece === 'R') {
                const rRow = pieceToMove.color === 'white' ? 7 : 0;
                if (startRow === rRow) {
                    if (startCol === 0) pieceToMove.color === 'white' ? (whiteCastlingRights[1] = false) : (blackCastlingRights[1] = false);
                    if (startCol === 7) pieceToMove.color === 'white' ? (whiteCastlingRights[0] = false) : (blackCastlingRights[0] = false);
                }
            }
            if (capturedPiece && capturedPiece.piece === 'R') {
                const rRow = capturedPiece.color === 'white' ? 7 : 0;
                 if (endRow === rRow) {
                    if (endCol === 0) capturedPiece.color === 'white' ? (whiteCastlingRights[1] = false) : (blackCastlingRights[1] = false);
                    if (endCol === 7) capturedPiece.color === 'white' ? (whiteCastlingRights[0] = false) : (blackCastlingRights[0] = false);
                }
            }

            // Handle Pawn Promotion
            if (pieceToMove.piece === 'P' && ((pieceToMove.color === 'white' && endRow === 0) || (pieceToMove.color === 'black' && endRow === 7))) {
                deselectPiece(); // Deselect before showing modal or proceeding
                renderBoard();   // Render the board to show the pawn on the promotion square

                if (promotionPieceType) { // AI or pre-selected promotion
                    board[endRow][endCol].piece = promotionPieceType;
                    switchPlayerAndCheckEnd(); 
                } else if (gameMode === 'pvc' && currentPlayer === 'black') { // AI needs to promote
                     board[endRow][endCol].piece = 'Q'; 
                     switchPlayerAndCheckEnd();
                } else { // Human player needs to choose
                    showPromotionModal(endRow, endCol, pieceToMove.color);
                    return; // Stop further processing until promotion is chosen
                }
            } else {
                // Normal move (not a promotion that needs a modal)
                deselectPiece();
                renderBoard(); 
                switchPlayerAndCheckEnd(); // This also calls updateStatus and checkGameEnd
            }
        }
        
        function switchPlayerAndCheckEnd() {
            currentPlayer = (currentPlayer === 'white') ? 'black' : 'white';
            updateStatus(); 
            checkGameEndConditions();

            // If it's now AI's turn (Player vs Computer mode, current player is black, game not over)
            if (gameMode === 'pvc' && currentPlayer === 'black' && !gameOver) {
                statusBar.textContent = "Computer is thinking..."; // Show thinking message
                // Use requestAnimationFrame to ensure "Computer is thinking..." renders before AI calculation
                requestAnimationFrame(() => {
                    setTimeout(computerMove, 600); // AI makes its move after a delay
                });
            }
        }

        function showPromotionModal(row, col, color) {
            promotionModal.style.display = 'block';
            promotionOptions.innerHTML = ''; 

            ['Q', 'R', 'B', 'N'].forEach(pType => {
                const button = document.createElement('button');
                button.dataset.piece = pType;
                button.textContent = pieces[pType][color]; 
                button.onclick = () => {
                    board[row][col].piece = pType; 
                    promotionModal.style.display = 'none';
                    renderBoard(); // Render with the new piece
                    switchPlayerAndCheckEnd(); // Then switch player and check game state
                };
                promotionOptions.appendChild(button);
            });
        }

        function getValidMoves(pieceType, color, r, c, checkSelfCheck = true) {
            let moves = [];
            const opponentColor = color === 'white' ? 'black' : 'white';

            switch (pieceType) {
                case 'P': 
                    const direction = color === 'white' ? -1 : 1;
                    const startRowPawn = color === 'white' ? 6 : 1;

                    if (r + direction >= 0 && r + direction < 8 && !board[r + direction][c]) {
                        moves.push({ row: r + direction, col: c });
                        if (r === startRowPawn && !board[r + 2 * direction][c]) {
                            moves.push({ row: r + 2 * direction, col: c });
                        }
                    }
                    [-1, 1].forEach(dc => {
                        if (c + dc >= 0 && c + dc < 8 && r + direction >=0 && r+direction < 8) {
                            const target = board[r + direction][c + dc];
                            if (target && target.color === opponentColor) {
                                moves.push({ row: r + direction, col: c + dc });
                            }
                            if (enPassantTarget && enPassantTarget.row === r + direction && enPassantTarget.col === c + dc && enPassantTarget.forPlayer === color) {
                                moves.push({ row: r + direction, col: c + dc, enPassant: true });
                            }
                        }
                    });
                    break;
                case 'R': 
                case 'Q': 
                    const rookDirections = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                    rookDirections.forEach(([dr, dc]) => {
                        for (let i = 1; i < 8; i++) {
                            const nr = r + dr * i;
                            const nc = c + dc * i;
                            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                            if (board[nr][nc]) {
                                if (board[nr][nc].color === opponentColor) moves.push({ row: nr, col: nc });
                                break;
                            }
                            moves.push({ row: nr, col: nc });
                        }
                    });
                    if (pieceType === 'R') break; 
                case 'B': 
                    const bishopDirections = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                     bishopDirections.forEach(([dr, dc]) => {
                        for (let i = 1; i < 8; i++) {
                            const nr = r + dr * i;
                            const nc = c + dc * i;
                            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                            if (board[nr][nc]) {
                                if (board[nr][nc].color === opponentColor) moves.push({ row: nr, col: nc });
                                break;
                            }
                            moves.push({ row: nr, col: nc });
                        }
                    });
                    break;
                case 'N': 
                    const knightMoves = [
                        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                        [1, -2], [1, 2], [2, -1], [2, 1]
                    ];
                    knightMoves.forEach(([dr, dc]) => {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            if (!board[nr][nc] || board[nr][nc].color === opponentColor) {
                                moves.push({ row: nr, col: nc });
                            }
                        }
                    });
                    break;
                case 'K': 
                    const kingMoves = [
                        [-1, -1], [-1, 0], [-1, 1], [0, -1],
                        [0, 1], [1, -1], [1, 0], [1, 1]
                    ];
                    kingMoves.forEach(([dr, dc]) => {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
                            if (!board[nr][nc] || board[nr][nc].color === opponentColor) {
                                moves.push({ row: nr, col: nc });
                            }
                        }
                    });
                    
                    const castlingRts = color === 'white' ? whiteCastlingRights : blackCastlingRights;
                    const kingR = color === 'white' ? 7 : 0;

                    if (castlingRts[0] && !board[kingR][c+1] && !board[kingR][c+2] && 
                        board[kingR][c+3]?.piece === 'R' && board[kingR][c+3]?.color === color) { 
                         if (!isSquareAttacked(kingR, c, opponentColor) && 
                             !isSquareAttacked(kingR, c+1, opponentColor) && 
                             !isSquareAttacked(kingR, c+2, opponentColor)) {
                            moves.push({ row: kingR, col: c + 2, castling: 'kingside' });
                        }
                    }
                    if (castlingRts[1] && !board[kingR][c-1] && !board[kingR][c-2] && !board[kingR][c-3] &&
                        board[kingR][c-4]?.piece === 'R' && board[kingR][c-4]?.color === color) {
                         if (!isSquareAttacked(kingR, c, opponentColor) && 
                             !isSquareAttacked(kingR, c-1, opponentColor) && 
                             !isSquareAttacked(kingR, c-2, opponentColor)) {
                           moves.push({ row: kingR, col: c - 2, castling: 'queenside' });
                        }
                    }
                    break;
            }

            if (checkSelfCheck) {
                moves = moves.filter(move => {
                    const originalPieceAtTarget = board[move.row][move.col];
                    const originalPieceAtSource = board[r][c]; 
                    
                    board[move.row][move.col] = { piece: pieceType, color: color }; 
                    board[r][c] = null; 

                    let tempKingPos;
                    if (pieceType === 'K') {
                        tempKingPos = { row: move.row, col: move.col };
                    } else {
                        tempKingPos = (color === 'white') ? whiteKingPosition : blackKingPosition;
                    }
                    
                    const selfInCheck = isKingInCheck(color, tempKingPos.row, tempKingPos.col);

                    board[r][c] = originalPieceAtSource;
                    board[move.row][move.col] = originalPieceAtTarget;
                    
                    return !selfInCheck;
                });
            }
            return moves;
        }

        function isSquareAttacked(r, c, attackerColor) {
            const defenderColor = attackerColor === 'white' ? 'black' : 'white';
            
            const pawnDir = attackerColor === 'white' ? 1 : -1; 
            if (r - pawnDir >= 0 && r - pawnDir < 8) {
                if (c - 1 >= 0 && board[r - pawnDir][c - 1]?.piece === 'P' && board[r - pawnDir][c - 1]?.color === attackerColor) return true;
                if (c + 1 < 8 && board[r - pawnDir][c + 1]?.piece === 'P' && board[r - pawnDir][c + 1]?.color === attackerColor) return true;
            }

            const knightDeltas = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
            for (const [dr, dc] of knightDeltas) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]?.piece === 'N' && board[nr][nc]?.color === attackerColor) return true;
            }

            const slideDirs = [
                [-1, 0], [1, 0], [0, -1], [0, 1], 
                [-1, -1], [-1, 1], [1, -1], [1, 1]  
            ];
            for (const [dr, dc] of slideDirs) {
                for (let i = 1; i < 8; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;
                    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
                    const pieceAtSq = board[nr][nc];
                    if (pieceAtSq) {
                        if (pieceAtSq.color === attackerColor) {
                            if (pieceAtSq.piece === 'Q') return true;
                            if (pieceAtSq.piece === 'R' && (dr === 0 || dc === 0)) return true; 
                            if (pieceAtSq.piece === 'B' && (dr !== 0 && dc !== 0)) return true; 
                        }
                        break; 
                    }
                }
            }
            
            const kingDeltas = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
            for (const [dr, dc] of kingDeltas) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc]?.piece === 'K' && board[nr][nc]?.color === attackerColor) return true;
            }
            return false;
        }

        function isKingInCheck(playerColor, kingR, kingC) {
            let r, c;
            if (kingR !== undefined && kingC !== undefined) { 
                r = kingR; c = kingC;
            } else { 
                const kingPos = playerColor === 'white' ? whiteKingPosition : blackKingPosition;
                r = kingPos.row; c = kingPos.col;
            }
            const opponentColor = playerColor === 'white' ? 'black' : 'white';
            return isSquareAttacked(r, c, opponentColor);
        }

        function checkGameEndConditions() {
            const playerToMove = currentPlayer; 
            const opponent = playerToMove === 'white' ? 'black' : 'white';
            let hasAnyValidMoves = false;

            for (let r_idx = 0; r_idx < 8; r_idx++) {
                for (let c_idx = 0; c_idx < 8; c_idx++) {
                    const pieceData = board[r_idx][c_idx];
                    if (pieceData && pieceData.color === playerToMove) {
                        const validMoves = getValidMoves(pieceData.piece, pieceData.color, r_idx, c_idx, true); 
                        if (validMoves.length > 0) {
                            hasAnyValidMoves = true;
                            break;
                        }
                    }
                }
                if (hasAnyValidMoves) break;
            }

            const kingIsCurrentlyInCheck = isKingInCheck(playerToMove);

            if (!hasAnyValidMoves) {
                gameOver = true;
                if (kingIsCurrentlyInCheck) {
                    statusBar.textContent = `Checkmate! ${opponent.charAt(0).toUpperCase() + opponent.slice(1)} wins!`;
                    showMessage(`Checkmate! ${opponent.charAt(0).toUpperCase() + opponent.slice(1)} wins!`);
                } else {
                    statusBar.textContent = "Stalemate! It's a draw.";
                    showMessage("Stalemate! It's a draw.");
                }
            } else if (fiftyMoveRuleCounter >= 100) { 
                gameOver = true;
                statusBar.textContent = "Draw by 50-move rule!";
                showMessage("Draw by 50-move rule!");
            }
        }

        function computerMove() {
            if (gameOver || currentPlayer !== 'black' || gameMode !== 'pvc') return;

            let allPossibleMoves = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const pieceData = board[r][c];
                    if (pieceData && pieceData.color === 'black') { 
                        const validMoves = getValidMoves(pieceData.piece, pieceData.color, r, c, true); 
                        validMoves.forEach(move => {
                            allPossibleMoves.push({
                                startRow: r, startCol: c,
                                endRow: move.row, endCol: move.col,
                                piece: pieceData,
                            });
                        });
                    }
                }
            }

            if (allPossibleMoves.length === 0) {
                return; // Should be caught by checkGameEndConditions
            }
            
            const pieceValues = { 'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 100 }; 

            allPossibleMoves.forEach(move => {
                move.score = 0;
                const targetCell = board[move.endRow][move.endCol];
                if (targetCell && targetCell.color === 'white') { 
                    move.score += pieceValues[targetCell.piece] || 1; 
                }
                move.score += Math.random() * 0.1; // Small random factor
            });

            allPossibleMoves.sort((a, b) => b.score - a.score); 

            let bestMove = allPossibleMoves[0];

            if (bestMove) {
                let promotionChoiceAI = null;
                if (bestMove.piece.piece === 'P' && bestMove.endRow === 7) { 
                    promotionChoiceAI = 'Q'; 
                }
                // makeMove will handle render, status update, and player switch
                makeMove(bestMove.startRow, bestMove.startCol, bestMove.endRow, bestMove.endCol, bestMove.piece, promotionChoiceAI);
            }
        }