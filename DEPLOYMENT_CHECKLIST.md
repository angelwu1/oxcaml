# Deployment Checklist

Follow these steps in order to deploy your multiplayer game:

## ☐ Step 1: Commit Your Code

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## ☐ Step 2: Deploy Server to Render

1. Go to https://render.com and sign in with GitHub
2. Click "New +" → "Web Service"
3. Select your `oxcaml` repository
4. Configure:
   - **Name**: Your choice (e.g., `loa-multiplayer-server`)
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Click "Create Web Service"
6. **WRITE DOWN YOUR URL**: `https://YOUR-APP-NAME.onrender.com`

## ☐ Step 3: Update multiplayer.js

1. Open `multiplayer.js`
2. Find line 36 (around line 36)
3. Replace:
   ```javascript
   return 'wss://loa-multiplayer-server.onrender.com';
   ```
   With your actual URL:
   ```javascript
   return 'wss://YOUR-ACTUAL-APP-NAME.onrender.com';
   ```
4. Save the file

## ☐ Step 4: Push Updated Code

```bash
git add multiplayer.js
git commit -m "Update production server URL"
git push origin main
```

Wait 1-2 minutes for GitHub Pages to rebuild.

## ☐ Step 5: Test

### Test 1: Server Health
- Visit: `https://YOUR-APP-NAME.onrender.com/health`
- Should see: `{"status":"ok","games":0}`

### Test 2: Local Multiplayer (Same Computer)
1. Open: https://angelwu1.github.io/oxcaml/
2. Open in private/incognito: https://angelwu1.github.io/oxcaml/
3. Both tabs: Start Multiplayer → Use Game ID "TEST123"
4. Play a few moves back and forth

### Test 3: Remote Multiplayer (Different Computers)
1. On your computer: https://angelwu1.github.io/oxcaml/
2. On another computer (or phone): https://angelwu1.github.io/oxcaml/
3. Both: Start Multiplayer → Use Game ID "TEST456"
4. Play together!

## ☐ Step 6: Verify Features

Check that these work:
- ✅ Players see same Game ID
- ✅ Moves sync in real-time
- ✅ Turn indicator shows correct player
- ✅ Can't move on opponent's turn
- ✅ Game pieces move correctly on both screens
- ✅ Win condition works (if applicable)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to server | Check Render logs, verify server is running |
| Wrong WebSocket URL | Make sure `multiplayer.js` has correct URL with `wss://` |
| Server sleeping | Wait 30 seconds, refresh page |
| Turn not switching | Refresh both browsers, start new game |

## Your Deployment Info

Fill this out for reference:

- **Render App Name**: _________________
- **Server URL**: https://_________________.onrender.com
- **WebSocket URL**: wss://_________________.onrender.com
- **GitHub Pages**: https://angelwu1.github.io/oxcaml/
- **Deployment Date**: _________________

## For Grading

Provide these links:
1. **Live Game**: https://angelwu1.github.io/oxcaml/
2. **Server Health**: https://YOUR-APP-NAME.onrender.com/health
3. **Repository**: https://github.com/YOUR-USERNAME/oxcaml
4. **Instructions**: See `DEPLOYMENT.md` for complete guide

---

**✨ Done!** Your multiplayer game should now work across different computers!

