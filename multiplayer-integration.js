/**
 * Lines of Action - Multiplayer Integration
 * Watch for board changes to detect and sync moves
 */

(function() {
  'use strict';
  
  let lastKnownTurn = 'Black';
  let isProcessingOpponentMove = false;
  let previousBoardState = null;
  
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 1000);
  });
  
  function init() {
    console.log('[MP] Initializing multiplayer integration...');
    
    const gameBoard = document.querySelector('.game');
    if (!gameBoard) {
      console.log('[MP] Board not found, retrying...');
      setTimeout(init, 500);
      return;
    }
    
    // Add CSS rules
    addStyles();
    
    // Block clicks when not your turn
    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousedown', handleClick, true);
    
    // Watch for board changes
    startBoardWatcher(gameBoard);
    
    // Continuously enforce turn blocking
    setInterval(enforceTurnBlock, 50);
    
    // Listen for multiplayer events
    if (typeof mpClient !== 'undefined') {
      mpClient.on('moveMade', onOpponentMove);
      mpClient.on('opponentJoined', onGameStart);
      mpClient.on('gameJoined', onGameStart);
      mpClient.on('gameCreated', onGameCreated);
    }
    
    console.log('[MP] Ready!');
  }
  
  function startBoardWatcher(gameBoard) {
    // Capture initial board state
    previousBoardState = captureBoardState();
    console.log('[MP] Initial board captured:', previousBoardState);
    
    let detectPending = false;
    
    // Watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      if (isProcessingOpponentMove) {
        console.log('[MP] Ignoring board change - processing opponent move');
        return;
      }
      if (typeof mpClient === 'undefined' || !mpClient.isInGame) return;
      if (!mpClient.isMyTurn(lastKnownTurn)) {
        console.log('[MP] Ignoring board change - not my turn');
        return;
      }
      
      if (detectPending) return; // Already scheduled
      detectPending = true;
      
      // Debounce - wait for all mutations to settle
      setTimeout(() => {
        detectPending = false;
        const newBoardState = captureBoardState();
        const move = detectMove(previousBoardState, newBoardState);
        
        if (move) {
          console.log('[MP] ===== MOVE DETECTED =====');
          console.log('[MP] Move:', move);
          console.log('[MP] Current turn before switch:', lastKnownTurn);
          console.log('[MP] My color:', mpClient.playerColor);
          console.log('[MP] Sending to server...');
          
          // Update board state first
          previousBoardState = newBoardState;
          
          // Send to server
          mpClient.makeMove(move.from, move.to);
          
          // Switch turn AFTER sending
          const oldTurn = lastKnownTurn;
          lastKnownTurn = lastKnownTurn === 'Black' ? 'White' : 'Black';
          console.log('[MP] ✓ My move complete. Turn:', oldTurn, '→', lastKnownTurn);
          updateTurnUI();
          updateTurnBlocker();
          showMessage("Waiting for opponent...");
        }
      }, 300);
    });
    
    observer.observe(gameBoard, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }
  
  function captureBoardState() {
    const state = [];
    const rows = document.querySelectorAll('.game > .row');
    
    rows.forEach((row, r) => {
      const cols = row.querySelectorAll('.column');
      cols.forEach((col, c) => {
        const circle = col.querySelector('svg circle');
        if (circle) {
          const fill = circle.getAttribute('fill') || '';
          const color = fill.includes('white') || fill.includes('#fff') ? 'White' : 
                       fill.includes('black') || fill.includes('#000') ? 'Black' : null;
          if (color) {
            state.push({ r, c, color });
          }
        }
      });
    });
    
    return state;
  }
  
  function detectMove(oldState, newState) {
    if (!oldState || !newState) return null;
    
    // Find pieces that disappeared
    const disappeared = oldState.filter(oldPiece => 
      !newState.some(newPiece => newPiece.r === oldPiece.r && newPiece.c === oldPiece.c && newPiece.color === oldPiece.color)
    );
    
    // Find pieces that appeared
    const appeared = newState.filter(newPiece => 
      !oldState.some(oldPiece => oldPiece.r === newPiece.r && oldPiece.c === newPiece.c && oldPiece.color === newPiece.color)
    );
    
    console.log('[MP] Board change - Disappeared:', disappeared.length, 'Appeared:', appeared.length);
    
    // Simple case: one piece moved (disappeared from one place, appeared in another)
    if (disappeared.length === 1 && appeared.length === 1 && disappeared[0].color === appeared[0].color) {
      return {
        from: { r: disappeared[0].r, c: disappeared[0].c },
        to: { r: appeared[0].r, c: appeared[0].c }
      };
    }
    
    // Capture case: one piece moved, another disappeared
    if (disappeared.length === 2 && appeared.length === 1) {
      // Find which piece moved (same color as the appeared piece)
      const movedPiece = disappeared.find(p => p.color === appeared[0].color);
      if (movedPiece) {
        return {
          from: { r: movedPiece.r, c: movedPiece.c },
          to: { r: appeared[0].r, c: appeared[0].c }
        };
      }
    }
    
    return null;
  }
  
  function handleClick(event) {
    if (typeof mpClient === 'undefined' || !mpClient.isInGame) return;
    
    const gameBoard = document.querySelector('.game');
    if (!gameBoard || !gameBoard.contains(event.target)) return;
    
    // Allow programmatic clicks for opponent moves
    if (!event.isTrusted || event.programmatic) return;
    
    // If not my turn, block the click
    if (!mpClient.isMyTurn(lastKnownTurn)) {
      event.stopPropagation();
      event.preventDefault();
      showMessage("Wait for your turn!", 'warning');
      console.log('[MP] Blocked - not your turn');
      return;
    }
    
    console.log('[MP] Click allowed - your turn');
  }
  
  function getCellElement(coords) {
    const rows = document.querySelectorAll('.game > .row');
    if (rows[coords.r]) {
      const cells = rows[coords.r].querySelectorAll('.column');
      return cells[coords.c] || null;
    }
    return null;
  }
  
  function onGameCreated(data) {
    console.log('[MP] ===== GAME CREATED =====');
    console.log('[MP] Waiting for opponent...');
    console.log('[MP] My color:', mpClient.playerColor);
    lastKnownTurn = 'Black';
    console.log('[MP] Initial turn set to:', lastKnownTurn);
    previousBoardState = captureBoardState();
    document.body.classList.add('mp-active');
    updateTurnBlocker();
  }
  
  function onGameStart(data) {
    console.log('[MP] ===== GAME STARTING =====');
    console.log('[MP] Game data:', data);
    console.log('[MP] My color:', mpClient.playerColor);
    lastKnownTurn = 'Black';
    console.log('[MP] Initial turn set to:', lastKnownTurn);
    console.log('[MP] Is it my turn?', mpClient.isMyTurn(lastKnownTurn));
    
    previousBoardState = captureBoardState();
    document.body.classList.add('mp-active');
    updateTurnUI();
    updateTurnBlocker();
    
    if (mpClient.playerColor === 'Black') {
      showMessage("Game started! Your turn (Black)");
    } else {
      showMessage("Game started! Waiting for Black to move...");
    }
  }
  
  function onOpponentMove(data) {
    console.log('[MP] ===== OPPONENT MOVE RECEIVED =====');
    console.log('[MP] Opponent moved:', data.from, '->', data.to);
    console.log('[MP] Current turn before opponent move:', lastKnownTurn);
    console.log('[MP] My color:', mpClient.playerColor);
    
    isProcessingOpponentMove = true;
    
    const fromCell = getCellElement(data.from);
    const toCell = getCellElement(data.to);
    
    console.log('[MP] Looking for cells:', fromCell ? 'found from' : 'missing from', toCell ? 'found to' : 'missing to');
    
    if (fromCell && toCell) {
      console.log('[MP] Applying opponent move via clicks');
      
      // Click source
      const clickEvent1 = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      clickEvent1.programmatic = true;
      fromCell.dispatchEvent(clickEvent1);
      console.log('[MP] Clicked source cell');
      
      // Then click destination
      setTimeout(() => {
        const clickEvent2 = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        clickEvent2.programmatic = true;
        toCell.dispatchEvent(clickEvent2);
        console.log('[MP] Clicked destination cell');
        
        // Wait for OCaml to process
        setTimeout(() => {
          previousBoardState = captureBoardState();
          
          // Switch turn to match what the active player already did
          const oldTurn = lastKnownTurn;
          lastKnownTurn = lastKnownTurn === 'Black' ? 'White' : 'Black';
          console.log('[MP] ✓ Opponent move applied. Turn:', oldTurn, '→', lastKnownTurn);
          console.log('[MP] Is it my turn now?', mpClient.isMyTurn(lastKnownTurn));
          
          updateTurnUI();
          updateTurnBlocker();
          
          if (mpClient.isMyTurn(lastKnownTurn)) {
            showMessage("Your turn!");
          } else {
            console.warn('[MP] ⚠️ Turn switched but still not my turn!');
            showMessage("Waiting...");
          }
          
          isProcessingOpponentMove = false;
        }, 500);
      }, 150);
    } else {
      console.error('[MP] Could not find cells for opponent move');
      isProcessingOpponentMove = false;
    }
  }
  
  function enforceTurnBlock() {
    if (typeof mpClient === 'undefined' || !mpClient.isInGame) return;
    
    const gameBoard = document.querySelector('.game');
    if (!gameBoard) return;
    
    const isMyTurn = mpClient.isMyTurn(lastKnownTurn);
    
    if (isMyTurn) {
      gameBoard.classList.remove('mp-blocked');
    } else {
      gameBoard.classList.add('mp-blocked');
    }
  }
  
  function updateTurnBlocker() {
    enforceTurnBlock();
  }
  
  function updateTurnUI() {
    const statusEl = document.getElementById('mp-turn-status');
    if (!statusEl) return;
    
    if (typeof mpClient !== 'undefined' && mpClient.isInGame) {
      const isMyTurn = mpClient.isMyTurn(lastKnownTurn);
      statusEl.textContent = isMyTurn ? 
        `Your turn (${mpClient.playerColor})` : 
        `Opponent's turn (${lastKnownTurn})`;
      statusEl.className = isMyTurn ? 'mp-your-turn' : 'mp-opponent-turn';
    }
  }
  
  function showMessage(msg, type = 'info') {
    console.log('[MP Message]', msg);
    
    let msgEl = document.getElementById('mp-message');
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = 'mp-message';
      document.body.appendChild(msgEl);
    }
    
    msgEl.textContent = msg;
    msgEl.className = 'mp-message ' + type;
    msgEl.style.display = 'block';
    
    setTimeout(() => {
      msgEl.style.display = 'none';
    }, 3000);
  }
  
  function addStyles() {
    const existingStyle = document.getElementById('mp-turn-styles');
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'mp-turn-styles';
    style.textContent = `
      /* Hide OCaml turn indicator during multiplayer */
      body.mp-active .status,
      body.mp-active .turn-indicator {
        display: none !important;
      }
      
      /* Visual feedback when blocked */
      .game.mp-blocked {
        opacity: 0.7;
        cursor: not-allowed !important;
      }
      
      .game.mp-blocked .column {
        pointer-events: none !important;
        cursor: not-allowed !important;
      }
      
      /* Turn status display */
      #mp-turn-status {
        position: fixed;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      
      #mp-turn-status.mp-your-turn {
        background: #4CAF50;
        color: white;
      }
      
      #mp-turn-status.mp-opponent-turn {
        background: #FF9800;
        color: white;
      }
      
      /* Message popup */
      #mp-message {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      #mp-message.info {
        background: #2196F3;
        color: white;
      }
      
      #mp-message.warning {
        background: #FF5722;
        color: white;
      }
      
      #mp-message.success {
        background: #4CAF50;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
})();
