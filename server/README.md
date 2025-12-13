# LOA Multiplayer Server

WebSocket server for Lines of Action multiplayer functionality.

## Quick Start

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Run the server
```bash
npm start
```

The server will start on `http://localhost:3000`

## How It Works

1. **Player 1** creates a game → gets a 6-character code (e.g., `ABC123`)
2. **Player 2** enters the code → joins the game
3. Both players see the same board and take turns
4. Moves are synced in real-time via WebSocket

## API Messages

### Client → Server

| Message | Description |
|---------|-------------|
| `create_game` | Create a new game room |
| `join_game` | Join existing game with code |
| `make_move` | Send a move to opponent |
| `game_over` | Report game winner |
| `chat` | Send chat message |

### Server → Client

| Message | Description |
|---------|-------------|
| `game_created` | Game created, here's your code |
| `game_joined` | Successfully joined game |
| `opponent_joined` | Your opponent has joined |
| `move_made` | A move was made |
| `opponent_disconnected` | Opponent left |
| `error` | Error message |

## Deployment

### Option 1: Render.com (Free)

1. Create account at [render.com](https://render.com)
2. New → Web Service
3. Connect your GitHub repo
4. Set:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Environment: Node

### Option 2: Railway.app (Free tier)

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo and `server` folder

### Option 3: Glitch.com (Free)

1. Go to [glitch.com](https://glitch.com)
2. New Project → Import from GitHub
3. Paste your repo URL

### After Deployment

Update `multiplayer.js` with your server URL:

```javascript
// In getServerUrl() function
return 'wss://your-server-name.onrender.com';
```

## Local Development

```bash
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Start game client
cd .. && python3 -m http.server 8080
```

Then open `http://localhost:8080` in two browser windows to test.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |

## Health Check

```bash
curl http://localhost:3000/health
```

Returns: `{"status":"ok","games":0}`

