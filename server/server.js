/**
 * Lines of Action - Multiplayer WebSocket Server
 * 
 * Run with: node server.js
 * Or: npm start
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', games: Object.keys(games).length }));
    return;
  }
  
  // CORS headers for WebSocket upgrade
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*'
  });
  res.end('LOA Multiplayer Server');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game rooms storage
const games = {};

// Generate random game ID
function generateGameId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Initial board state for Lines of Action
function getInitialBoard() {
  // 8x8 board: Black pieces on top/bottom rows (except corners)
  // White pieces on left/right columns (except corners)
  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) {
      if (r === 0 || r === 7) {
        // Top and bottom rows
        if (c > 0 && c < 7) {
          row.push('Black');
        } else {
          row.push(null);
        }
      } else if (c === 0 || c === 7) {
        // Left and right columns
        row.push('White');
      } else {
        row.push(null);
      }
    }
    board.push(row);
  }
  return board;
}

// Broadcast to all players in a game
function broadcastToGame(gameId, message, excludeWs = null) {
  const game = games[gameId];
  if (!game) return;
  
  const messageStr = JSON.stringify(message);
  
  game.players.forEach(player => {
    if (player.ws !== excludeWs && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(messageStr);
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  let currentGameId = null;
  let playerColor = null;
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message.type);
      
      switch (message.type) {
        case 'create_game': {
          // Create a new game room
          const gameId = generateGameId();
          games[gameId] = {
            id: gameId,
            players: [{ ws, color: 'Black', name: message.playerName || 'Player 1' }],
            board: getInitialBoard(),
            turn: 'Black',
            moves: [],
            status: 'waiting', // waiting, playing, finished
            createdAt: Date.now()
          };
          
          currentGameId = gameId;
          playerColor = 'Black';
          
          ws.send(JSON.stringify({
            type: 'game_created',
            gameId,
            playerColor: 'Black',
            message: 'Game created! Share the code with your opponent.'
          }));
          
          console.log(`Game ${gameId} created`);
          break;
        }
        
        case 'join_game': {
          const gameId = message.gameId?.toUpperCase();
          const game = games[gameId];
          
          if (!game) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game not found. Check the code and try again.'
            }));
            break;
          }
          
          if (game.players.length >= 2) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Game is full.'
            }));
            break;
          }
          
          // Add second player
          game.players.push({ ws, color: 'White', name: message.playerName || 'Player 2' });
          game.status = 'playing';
          
          currentGameId = gameId;
          playerColor = 'White';
          
          // Notify the joining player
          ws.send(JSON.stringify({
            type: 'game_joined',
            gameId,
            playerColor: 'White',
            board: game.board,
            turn: game.turn,
            opponentName: game.players[0].name
          }));
          
          // Notify the first player that opponent joined
          broadcastToGame(gameId, {
            type: 'opponent_joined',
            opponentName: message.playerName || 'Player 2',
            board: game.board,
            turn: game.turn
          }, ws);
          
          console.log(`Player joined game ${gameId}`);
          break;
        }
        
        case 'make_move': {
          const game = games[currentGameId];
          
          if (!game) {
            ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
            break;
          }
          
          if (game.status !== 'playing') {
            ws.send(JSON.stringify({ type: 'error', message: 'Game not in progress' }));
            break;
          }
          
          if (game.turn !== playerColor) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
            break;
          }
          
          const { from, to } = message;
          
          // Store the move
          game.moves.push({ from, to, player: playerColor, timestamp: Date.now() });
          
          // Update board state (basic move - the client validates)
          const piece = game.board[from.r][from.c];
          game.board[from.r][from.c] = null;
          game.board[to.r][to.c] = piece;
          
          // Switch turn
          game.turn = game.turn === 'Black' ? 'White' : 'Black';
          
          // Broadcast move to other players (exclude sender)
          broadcastToGame(currentGameId, {
            type: 'move_made',
            from,
            to,
            player: playerColor,
            board: game.board,
            turn: game.turn
          }, ws);
          
          console.log(`Move in game ${currentGameId}: ${JSON.stringify(from)} -> ${JSON.stringify(to)}`);
          break;
        }
        
        case 'game_over': {
          const game = games[currentGameId];
          if (game) {
            game.status = 'finished';
            game.winner = message.winner;
            
            broadcastToGame(currentGameId, {
              type: 'game_over',
              winner: message.winner
            });
          }
          break;
        }
        
        case 'chat': {
          broadcastToGame(currentGameId, {
            type: 'chat',
            from: playerColor,
            message: message.message
          });
          break;
        }
        
        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    } catch (err) {
      console.error('Error processing message:', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    
    if (currentGameId && games[currentGameId]) {
      const game = games[currentGameId];
      
      // Remove player from game
      game.players = game.players.filter(p => p.ws !== ws);
      
      // Notify remaining players
      broadcastToGame(currentGameId, {
        type: 'opponent_disconnected',
        message: 'Your opponent has disconnected.'
      });
      
      // Clean up empty games
      if (game.players.length === 0) {
        delete games[currentGameId];
        console.log(`Game ${currentGameId} deleted (empty)`);
      }
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Clean up old games periodically (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  
  Object.keys(games).forEach(gameId => {
    const game = games[gameId];
    if (now - game.createdAt > maxAge) {
      // Notify any remaining players
      broadcastToGame(gameId, {
        type: 'game_expired',
        message: 'Game session has expired.'
      });
      delete games[gameId];
      console.log(`Game ${gameId} expired and deleted`);
    }
  });
}, 30 * 60 * 1000);

// Start server
server.listen(PORT, () => {
  console.log(`LOA Multiplayer Server running on port ${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});

