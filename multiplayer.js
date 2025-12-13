/**
 * Lines of Action - Multiplayer Client
 * Handles WebSocket connection and game synchronization
 */

class MultiplayerClient {
  constructor() {
    this.ws = null;
    this.gameId = null;
    this.playerColor = null;
    this.playerName = 'Player';
    this.opponentName = null;
    this.isConnected = false;
    this.isInGame = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.callbacks = {};
    
    // Default server URL - change this when deploying
    this.serverUrl = this.getServerUrl();
  }
  
  getServerUrl() {
    // Check for custom server URL in localStorage
    const customUrl = localStorage.getItem('loa_server_url');
    if (customUrl) return customUrl;
    
    // Default: localhost for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:3000';
    }
    
    // Production server URL (deployed on Render)
    // TODO: Replace with your actual Render URL after deployment
    // Format: wss://YOUR-APP-NAME.onrender.com
    return 'wss://loa-multiplayer-server.onrender.com';
  }
  
  setServerUrl(url) {
    localStorage.setItem('loa_server_url', url);
    this.serverUrl = url;
  }
  
  // Register callback for events
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }
  
  // Emit event to callbacks
  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(cb => cb(data));
    }
  }
  
  // Connect to server
  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      
      console.log('[MP] Connecting to', this.serverUrl);
      
      try {
        this.ws = new WebSocket(this.serverUrl);
      } catch (err) {
        reject(new Error('Failed to create WebSocket connection'));
        return;
      }
      
      this.ws.onopen = () => {
        console.log('[MP] Connected to server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      };
      
      this.ws.onclose = () => {
        console.log('[MP] Disconnected from server');
        this.isConnected = false;
        this.emit('disconnected');
        
        // Attempt reconnect if was in a game
        if (this.isInGame && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[MP] Reconnecting... attempt ${this.reconnectAttempts}`);
          setTimeout(() => this.connect(), 2000);
        }
      };
      
      this.ws.onerror = (err) => {
        console.error('[MP] WebSocket error:', err);
        this.emit('error', { message: 'Connection error' });
        reject(new Error('WebSocket connection failed'));
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.error('[MP] Error parsing message:', err);
        }
      };
    });
  }
  
  // Handle incoming messages
  handleMessage(message) {
    console.log('[MP] Received:', message.type);
    
    switch (message.type) {
      case 'game_created':
        this.gameId = message.gameId;
        this.playerColor = message.playerColor;
        this.isInGame = true;
        this.emit('gameCreated', {
          gameId: message.gameId,
          playerColor: message.playerColor
        });
        break;
        
      case 'game_joined':
        this.gameId = message.gameId;
        this.playerColor = message.playerColor;
        this.opponentName = message.opponentName;
        this.isInGame = true;
        this.emit('gameJoined', {
          gameId: message.gameId,
          playerColor: message.playerColor,
          board: message.board,
          turn: message.turn,
          opponentName: message.opponentName
        });
        break;
        
      case 'opponent_joined':
        this.opponentName = message.opponentName;
        this.emit('opponentJoined', {
          opponentName: message.opponentName,
          board: message.board,
          turn: message.turn
        });
        break;
        
      case 'move_made':
        this.emit('moveMade', {
          from: message.from,
          to: message.to,
          player: message.player,
          board: message.board,
          turn: message.turn
        });
        break;
        
      case 'game_over':
        this.emit('gameOver', {
          winner: message.winner
        });
        break;
        
      case 'opponent_disconnected':
        this.emit('opponentDisconnected', {
          message: message.message
        });
        break;
        
      case 'chat':
        this.emit('chat', {
          from: message.from,
          message: message.message
        });
        break;
        
      case 'error':
        this.emit('error', {
          message: message.message
        });
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      case 'game_expired':
        this.isInGame = false;
        this.emit('gameExpired', {
          message: message.message
        });
        break;
    }
  }
  
  // Send message to server
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[MP] Not connected to server');
      return false;
    }
    this.ws.send(JSON.stringify(message));
    return true;
  }
  
  // Create a new game
  async createGame(playerName = 'Player 1') {
    await this.connect();
    this.playerName = playerName;
    this.send({
      type: 'create_game',
      playerName
    });
  }
  
  // Join an existing game
  async joinGame(gameId, playerName = 'Player 2') {
    await this.connect();
    this.playerName = playerName;
    this.send({
      type: 'join_game',
      gameId: gameId.toUpperCase(),
      playerName
    });
  }
  
  // Send a move
  makeMove(from, to) {
    if (!this.isInGame) {
      console.error('[MP] Not in a game');
      return false;
    }
    
    return this.send({
      type: 'make_move',
      from,
      to
    });
  }
  
  // Report game over
  reportGameOver(winner) {
    this.send({
      type: 'game_over',
      winner
    });
  }
  
  // Send chat message
  sendChat(message) {
    this.send({
      type: 'chat',
      message
    });
  }
  
  // Disconnect
  disconnect() {
    this.isInGame = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  // Check if it's player's turn
  isMyTurn(currentTurn) {
    return this.playerColor === currentTurn;
  }
  
  // Get game info
  getGameInfo() {
    return {
      gameId: this.gameId,
      playerColor: this.playerColor,
      playerName: this.playerName,
      opponentName: this.opponentName,
      isConnected: this.isConnected,
      isInGame: this.isInGame
    };
  }
}

// Global multiplayer client instance
const mpClient = new MultiplayerClient();

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.mpClient = mpClient;
  window.MultiplayerClient = MultiplayerClient;
}

