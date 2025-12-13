# Lines of Action Game (OCaml)

A fully-functional **Lines of Action** board game built with OCaml, compiled to JavaScript, featuring **offline gameplay** with service workers and local storage.

## 🎮 Features

- ✅ **Offline Play**: Works without internet connection
- ✅ **Two Game Modes**: Pass & Play or vs Computer
- ✅ **Auto-save**: Game state persists automatically
- ✅ **Move History**: All moves tracked and saved
- ✅ **PWA Support**: Install as a standalone app
- ✅ **Responsive Design**: Works on desktop and mobile

## 🚀 Quick Start (Offline Mode)

The game now supports offline play! See [QUICKSTART_OFFLINE.md](QUICKSTART_OFFLINE.md) for detailed instructions.

**Quick test**:
1. Visit your game page online
2. Go offline (airplane mode)
3. Refresh - the game still works! 🎉

## 📚 Documentation

- [QUICKSTART_OFFLINE.md](QUICKSTART_OFFLINE.md) - Get started with offline features
- [OFFLINE_FEATURES.md](OFFLINE_FEATURES.md) - Complete feature documentation

## 🛠️ Development Setup

To make a dev-environment, press the green "Code" button, then select "+" next to "Codespaces".  A new Codespace will open.  It currently takes 20-40 minutes to initialize; please be patient.

Once initialized you need to run the following commands:
```shell
opam init -a --disable-sandboxing --yes --bare && \
        opam update -a && \
        opam switch create 4.14.0 --yes  && \
        eval $(opam env --switch 4.14.0) && \
        opam install --yes  ocamlformat merlin ocaml-lsp-server bonsai
```

Afterwards you should have a full OPAM environment with the OCaml compiler and dune on the path.  VSCode will have the OCaml Platform plugin together with the LSP server and merlin, the editor assistant.

## Building the OCaml project
Make sure you're using the right opam switch:
```shell
eval $(opam env --switch 4.14.0)
```

To format the files:
```shell
dune fmt
```

To build and run tests continously:
```shell
dune build @runtest --watch
```

To promote/update expect-tests:
```shell
dune promote
```

To update the javascript:
```shell
# For TicTacToe
cp _build/default/ui/tictactoe_ui.bc.js generated_js/

# For Lines of Action
cp _build/default/ui/loa_ui.bc.js generated_js/
```

## 🌐 Deployment

After building, commit the changes and visit your GitHub Pages site.

### Files to Deploy
Make sure these files are in your repository:
- `index.html` / `loa.html` - Main game pages
- `generated_js/loa_ui.bc.js` - Compiled OCaml game logic
- `sw.js` - Service worker for offline functionality
- `game-storage.js` - Local storage manager
- `game-bridge.js` - OCaml integration bridge
- `manifest.json` - PWA manifest
- `hw5_html_css/*.css` - Stylesheets

## 🎯 Testing Offline Mode

### Browser Console Commands
```javascript
// Check connection status
LOAGameBridge.getConnectionStatus()

// View saved moves
LOAGameBridge.getMoveHistory()

// Backup game data
downloadGameBackup()

// Get storage info
LOAGameBridge.getStorageStats()
```

### Chrome DevTools
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check "Service Workers" - should be activated
4. Check "Cache Storage" - should have cached assets
5. Toggle "Offline" to test offline mode

## 🏗️ Architecture

```
┌─────────────────┐
│   OCaml Game    │ (Logic in OCaml)
│     Logic       │
└────────┬────────┘
         │ Compiled to JS
         ▼
┌─────────────────┐
│   Game Bridge   │ (JavaScript integration)
│    (bridge.js)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Local Storage   │ (Persistent data)
│  (storage.js)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Worker  │ (Offline caching)
│    (sw.js)      │
└─────────────────┘
```

## 📱 Progressive Web App

The game is installable as a PWA:
- **Desktop**: Click install icon in address bar
- **Mobile**: "Add to Home Screen" from browser menu
- **Works offline**: Once installed, no internet needed

## 🔧 Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Local Storage | ✅ | ✅ | ✅ | ✅ |
| PWA Install | ✅ | Partial | Partial | ✅ |
| Offline Play | ✅ | ✅ | ✅ | ✅ |

## 🤝 Contributing

When adding features:
1. Update OCaml logic in `logic/` directory
2. Build with `dune build`
3. Copy to `generated_js/`
4. Test offline functionality
5. Update service worker cache if needed

## 📄 License

See [LICENSE](LICENSE) file.


