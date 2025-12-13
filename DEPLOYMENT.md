# Multiplayer Server Deployment Guide

This guide will help you deploy your Lines of Action multiplayer server so players on different computers can play together.

## Quick Start: Deploy to Render (Free)

### Step 1: Prepare Your Repository

1. **Commit all changes** to your Git repository:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Deploy to Render

1. **Create a Render account**
   - Go to https://render.com
   - Sign up with your GitHub account (easiest option)

2. **Create a new Web Service**
   - Click "New +" button in the top right
   - Select "Web Service"
   - Connect your GitHub repository (`oxcaml`)
   - Click "Connect" next to your repository

3. **Configure the service:**
   - **Name**: `loa-multiplayer-server` (or any name you prefer)
   - **Region**: Choose closest to you (e.g., Oregon, Ohio)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Click "Create Web Service"**
   - Wait 2-5 minutes for deployment
   - Your server URL will be: `https://YOUR-APP-NAME.onrender.com`

### Step 3: Update Your Code

After deployment, you need to update the WebSocket URL in your client code:

1. **Edit `multiplayer.js`** (line ~36):
   ```javascript
   // Replace this line:
   return 'wss://loa-multiplayer-server.onrender.com';
   
   // With your actual Render URL:
   return 'wss://YOUR-ACTUAL-APP-NAME.onrender.com';
   ```

2. **Commit and push the change:**
   ```bash
   git add multiplayer.js
   git commit -m "Update production server URL"
   git push origin main
   ```

3. **Wait for GitHub Pages to update** (usually 1-2 minutes)

### Step 4: Test Multiplayer

1. Open `https://angelwu1.github.io/oxcaml/` on your computer
2. Open the same URL on **another computer** or **ask a friend** to open it
3. Both players:
   - Click "Start Multiplayer"
   - Enter the **same Game ID** (e.g., "TEST123")
   - Click "Create Game" or "Join Game"
4. Play together! 🎮

---

## Important Notes

### Free Tier Limitations

Render's free tier has some limitations:
- **Cold starts**: Server sleeps after 15 minutes of inactivity
- **Wake-up time**: Takes ~30 seconds to wake up on first connection
- **750 hours/month**: Enough for testing and demo purposes

### If Server is Sleeping

If you see "Disconnected from server":
1. Wait 30-60 seconds for the server to wake up
2. Refresh the page
3. Try connecting again

### Custom Domain (Optional)

If you want a custom domain:
1. Purchase a domain (e.g., from Namecheap, Google Domains)
2. In Render dashboard → Settings → Custom Domain
3. Update `multiplayer.js` with your custom domain

---

## Alternative: Deploy to Railway

If Render doesn't work, try Railway (also has free tier):

1. Go to https://railway.app
2. Sign in with GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Select your `oxcaml` repository
5. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Copy the public URL and update `multiplayer.js`

---

## Troubleshooting

### Problem: "WebSocket connection failed"

**Solution**: Check that:
- Server is deployed and running on Render
- URL in `multiplayer.js` matches your Render URL exactly
- URL uses `wss://` not `ws://` (secure WebSocket)
- You pushed the updated code to GitHub and Pages refreshed

### Problem: "Cannot connect to server"

**Solution**: 
- Check Render logs (Dashboard → Your Service → Logs)
- Look for errors during startup
- Verify port 3000 is being used in `server.js`

### Problem: "Both players waiting for turn"

**Solution**: This was fixed! If it happens again:
- Refresh both browsers
- Start a new game with a new Game ID

### Problem: Server sleeping too often

**Solution** (if needed for demo/grading):
- Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your server every 5 minutes
- Or upgrade to Render paid tier ($7/month) for always-on

---

## Testing Locally Before Deployment

To test locally with two browsers:

1. **Start the server**:
   ```bash
   cd server
   npm start
   ```

2. **Start the game server**:
   ```bash
   python3 -m http.server 8000
   ```

3. **Open two browser windows**:
   - Window 1: `http://localhost:8000/loa.html`
   - Window 2: `http://localhost:8000/loa.html` (incognito/private mode)

4. **Both players** enter the same Game ID

---

## For Grading/Demo

When demonstrating multiplayer functionality:

1. **Show it works locally** (two browser tabs)
2. **Show it works remotely** (two different computers)
3. **Show the Game ID system** (players must use same ID to connect)
4. **Show turn enforcement** (players can't move on opponent's turn)
5. **Show move synchronization** (moves appear on both screens)

### Demo Script

```
1. Open game on Computer A → Start Multiplayer → Create Game "DEMO123"
2. Open game on Computer B → Start Multiplayer → Join Game "DEMO123"
3. Computer A (Black) makes a move → Computer B sees it immediately
4. Computer B (White) makes a move → Computer A sees it immediately
5. Show that clicking during opponent's turn shows "Wait for your turn!"
```

---

## Resources

- **Render Documentation**: https://render.com/docs
- **WebSocket Testing**: https://www.websocket.org/echo.html
- **Your Server Health**: `https://YOUR-APP-NAME.onrender.com/health`

---

## Quick Reference

| Environment | URL | Usage |
|-------------|-----|-------|
| Local Development | `ws://localhost:3000` | Testing on your computer |
| Production (Render) | `wss://your-app.onrender.com` | Multiplayer across internet |
| GitHub Pages | `https://angelwu1.github.io/oxcaml/` | Where players access the game |

**Remember**: After deployment, update line 36 in `multiplayer.js` with your actual Render URL!

