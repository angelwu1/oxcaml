/**
 * Lines of Action - Multiplayer UI
 * Handles the multiplayer interface and integrates with the game
 */

(function() {
  'use strict';
  
  // Wait for DOM and mpClient to be ready
  document.addEventListener('DOMContentLoaded', initMultiplayerUI);
  
  function initMultiplayerUI() {
    // Create multiplayer UI elements
    createMultiplayerPanel();
    setupEventListeners();
    console.log('[MP-UI] Multiplayer UI initialized');
  }
  
  function createMultiplayerPanel() {
    const panel = document.createElement('div');
    panel.id = 'multiplayer-panel';
    panel.innerHTML = `
      <div class="mp-header">
        <span>🌐 Multiplayer</span>
        <button id="mp-toggle" class="mp-btn-small">▼</button>
      </div>
      
      <div id="mp-content">
        <!-- Connection Status -->
        <div id="mp-status" class="mp-status disconnected">
          ⚪ Not connected
        </div>
        
        <!-- Lobby View -->
        <div id="mp-lobby">
          <input type="text" id="mp-player-name" placeholder="Your name" maxlength="20" value="Player">
          
          <button id="mp-create-btn" class="mp-btn">Create Game</button>
          
          <div class="mp-divider">— or —</div>
          
          <input type="text" id="mp-game-code" placeholder="Game code" maxlength="6">
          <button id="mp-join-btn" class="mp-btn">Join Game</button>
        </div>
        
        <!-- Waiting View -->
        <div id="mp-waiting" style="display: none;">
          <div class="mp-game-code">
            Game Code: <strong id="mp-code-display"></strong>
          </div>
          <p>Waiting for opponent to join...</p>
          <p class="mp-hint">Share this code with your friend!</p>
          <button id="mp-copy-code" class="mp-btn">📋 Copy Code</button>
          <button id="mp-cancel-btn" class="mp-btn mp-btn-secondary">Cancel</button>
        </div>
        
        <!-- Game View -->
        <div id="mp-game" style="display: none;">
          <div class="mp-game-info">
            <div>Game: <strong id="mp-game-id"></strong></div>
            <div>You: <strong id="mp-your-color"></strong></div>
            <div>Opponent: <strong id="mp-opponent-name"></strong></div>
          </div>
          <div id="mp-turn-indicator" class="mp-turn"></div>
          <button id="mp-leave-btn" class="mp-btn mp-btn-secondary">Leave Game</button>
        </div>
        
        <!-- Messages -->
        <div id="mp-messages"></div>
      </div>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      #multiplayer-panel {
        position: fixed;
        top: 60px;
        right: 10px;
        width: 280px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 1000;
        overflow: hidden;
      }
      
      .mp-header {
        background: #2a79ff;
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }
      
      .mp-btn-small {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 14px;
        padding: 4px 8px;
      }
      
      #mp-content {
        padding: 16px;
      }
      
      #mp-content.collapsed {
        display: none;
      }
      
      .mp-status {
        padding: 8px 12px;
        border-radius: 6px;
        text-align: center;
        margin-bottom: 16px;
        font-size: 14px;
      }
      
      .mp-status.disconnected {
        background: #f8d7da;
        color: #721c24;
      }
      
      .mp-status.connected {
        background: #d4edda;
        color: #155724;
      }
      
      .mp-status.in-game {
        background: #cce5ff;
        color: #004085;
      }
      
      #mp-player-name, #mp-game-code {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 10px;
        box-sizing: border-box;
      }
      
      #mp-game-code {
        text-transform: uppercase;
        letter-spacing: 2px;
        text-align: center;
      }
      
      #mp-player-name:focus, #mp-game-code:focus {
        border-color: #2a79ff;
        outline: none;
      }
      
      .mp-btn {
        width: 100%;
        padding: 12px;
        background: #2a79ff;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
        margin-bottom: 8px;
      }
      
      .mp-btn:hover {
        background: #1d5cd4;
      }
      
      .mp-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      .mp-btn-secondary {
        background: #6c757d;
      }
      
      .mp-btn-secondary:hover {
        background: #5a6268;
      }
      
      .mp-divider {
        text-align: center;
        color: #999;
        margin: 16px 0;
        font-size: 12px;
      }
      
      .mp-game-code {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 12px;
      }
      
      .mp-game-code strong {
        font-size: 24px;
        letter-spacing: 3px;
        color: #2a79ff;
      }
      
      .mp-hint {
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      
      .mp-game-info {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        font-size: 14px;
      }
      
      .mp-game-info div {
        margin: 4px 0;
      }
      
      .mp-turn {
        padding: 12px;
        border-radius: 8px;
        text-align: center;
        font-weight: 600;
        margin-bottom: 12px;
      }
      
      .mp-turn.your-turn {
        background: #d4edda;
        color: #155724;
      }
      
      .mp-turn.opponent-turn {
        background: #fff3cd;
        color: #856404;
      }
      
      #mp-messages {
        margin-top: 12px;
        max-height: 100px;
        overflow-y: auto;
      }
      
      .mp-message {
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 12px;
      }
      
      .mp-message.error {
        background: #f8d7da;
        color: #721c24;
      }
      
      .mp-message.success {
        background: #d4edda;
        color: #155724;
      }
      
      .mp-message.info {
        background: #cce5ff;
        color: #004085;
      }
      
      @media (max-width: 600px) {
        #multiplayer-panel {
          width: calc(100% - 20px);
          right: 10px;
          top: auto;
          bottom: 10px;
        }
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(panel);
  }
  
  function setupEventListeners() {
    // Toggle panel
    document.getElementById('mp-toggle').addEventListener('click', () => {
      const content = document.getElementById('mp-content');
      const toggle = document.getElementById('mp-toggle');
      content.classList.toggle('collapsed');
      toggle.textContent = content.classList.contains('collapsed') ? '▲' : '▼';
    });
    
    // Create game
    document.getElementById('mp-create-btn').addEventListener('click', async () => {
      const playerName = document.getElementById('mp-player-name').value || 'Player 1';
      showMessage('Connecting...', 'info');
      
      try {
        await mpClient.createGame(playerName);
      } catch (err) {
        showMessage('Failed to connect to server. Is it running?', 'error');
      }
    });
    
    // Join game
    document.getElementById('mp-join-btn').addEventListener('click', async () => {
      const gameCode = document.getElementById('mp-game-code').value.trim();
      const playerName = document.getElementById('mp-player-name').value || 'Player 2';
      
      if (!gameCode || gameCode.length < 4) {
        showMessage('Please enter a valid game code', 'error');
        return;
      }
      
      showMessage('Joining game...', 'info');
      
      try {
        await mpClient.joinGame(gameCode, playerName);
      } catch (err) {
        showMessage('Failed to connect to server', 'error');
      }
    });
    
    // Copy code
    document.getElementById('mp-copy-code').addEventListener('click', () => {
      const code = document.getElementById('mp-code-display').textContent;
      navigator.clipboard.writeText(code).then(() => {
        showMessage('Code copied!', 'success');
      });
    });
    
    // Cancel waiting
    document.getElementById('mp-cancel-btn').addEventListener('click', () => {
      mpClient.disconnect();
      showView('lobby');
      updateStatus('disconnected', '⚪ Not connected');
    });
    
    // Leave game
    document.getElementById('mp-leave-btn').addEventListener('click', () => {
      if (confirm('Leave the game?')) {
        mpClient.disconnect();
        showView('lobby');
        updateStatus('disconnected', '⚪ Not connected');
      }
    });
    
    // Multiplayer client events
    mpClient.on('connected', () => {
      updateStatus('connected', '🟢 Connected');
    });
    
    mpClient.on('disconnected', () => {
      updateStatus('disconnected', '⚪ Disconnected');
    });
    
    mpClient.on('gameCreated', (data) => {
      document.getElementById('mp-code-display').textContent = data.gameId;
      showView('waiting');
      updateStatus('connected', '🟡 Waiting for opponent');
      showMessage(`Game created! You are ${data.playerColor}`, 'success');
    });
    
    mpClient.on('gameJoined', (data) => {
      showGameView(data);
      showMessage(`Joined game as ${data.playerColor}`, 'success');
    });
    
    mpClient.on('opponentJoined', (data) => {
      showGameView({
        gameId: mpClient.gameId,
        playerColor: mpClient.playerColor,
        opponentName: data.opponentName,
        turn: data.turn
      });
      showMessage(`${data.opponentName} joined!`, 'success');
    });
    
    mpClient.on('moveMade', (data) => {
      // Update turn indicator
      updateTurnIndicator(data.turn);
      
      // The game board update is handled by the OCaml code
      // We emit a custom event for the game to listen to
      window.dispatchEvent(new CustomEvent('multiplayerMove', { 
        detail: data 
      }));
    });
    
    mpClient.on('opponentDisconnected', (data) => {
      showMessage(data.message, 'error');
      showView('lobby');
      updateStatus('connected', '🟢 Connected');
    });
    
    mpClient.on('error', (data) => {
      showMessage(data.message, 'error');
    });
    
    mpClient.on('gameOver', (data) => {
      showMessage(`Game Over! ${data.winner} wins!`, 'success');
    });
  }
  
  function showView(view) {
    document.getElementById('mp-lobby').style.display = view === 'lobby' ? 'block' : 'none';
    document.getElementById('mp-waiting').style.display = view === 'waiting' ? 'block' : 'none';
    document.getElementById('mp-game').style.display = view === 'game' ? 'block' : 'none';
  }
  
  function showGameView(data) {
    document.getElementById('mp-game-id').textContent = data.gameId;
    document.getElementById('mp-your-color').textContent = data.playerColor;
    document.getElementById('mp-opponent-name').textContent = data.opponentName || 'Opponent';
    
    updateTurnIndicator(data.turn);
    showView('game');
    updateStatus('in-game', '🎮 In Game');
  }
  
  function updateTurnIndicator(turn) {
    const indicator = document.getElementById('mp-turn-indicator');
    const isMyTurn = mpClient.isMyTurn(turn);
    
    indicator.textContent = isMyTurn ? "🎯 Your turn!" : "⏳ Opponent's turn";
    indicator.className = 'mp-turn ' + (isMyTurn ? 'your-turn' : 'opponent-turn');
  }
  
  function updateStatus(type, text) {
    const status = document.getElementById('mp-status');
    status.className = 'mp-status ' + type;
    status.textContent = text;
  }
  
  function showMessage(text, type = 'info') {
    const messages = document.getElementById('mp-messages');
    const msg = document.createElement('div');
    msg.className = 'mp-message ' + type;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (msg.parentNode) {
        msg.remove();
      }
    }, 5000);
  }
  
  // Expose function to send moves from game
  window.sendMultiplayerMove = function(from, to) {
    if (mpClient.isInGame) {
      return mpClient.makeMove(from, to);
    }
    return false;
  };
  
  // Check if in multiplayer mode
  window.isMultiplayerGame = function() {
    return mpClient.isInGame;
  };
  
  // Check if it's player's turn
  window.isMultiplayerMyTurn = function(turn) {
    if (!mpClient.isInGame) return true; // Not in MP, always allow
    return mpClient.isMyTurn(turn);
  };
  
  // Report game over
  window.reportMultiplayerWin = function(winner) {
    if (mpClient.isInGame) {
      mpClient.reportGameOver(winner);
    }
  };
  
})();

