/**
 * Game Bridge - Interface between OCaml-generated JS and Storage/Service Worker
 * This file provides a bridge to integrate local storage and offline features
 * with the OCaml-compiled game logic.
 */

(function(window) {
  'use strict';

  // Initialize bridge only after storage is ready
  if (typeof gameStorage === 'undefined') {
    console.warn('[Bridge] GameStorage not available yet, will retry...');
    setTimeout(() => {
      if (typeof gameStorage !== 'undefined') {
        initBridge();
      }
    }, 100);
  } else {
    initBridge();
  }

  function initBridge() {
    // Game Bridge API
    window.LOAGameBridge = {
      // Save game state
      saveState: function(gameStateObj) {
        try {
          const state = typeof gameStateObj === 'string' 
            ? JSON.parse(gameStateObj) 
            : gameStateObj;
          gameStorage.saveGameState(state);
          console.log('[Bridge] Game state saved');
          return true;
        } catch (e) {
          console.error('[Bridge] Error saving state:', e);
          return false;
        }
      },

      // Load game state
      loadState: function() {
        try {
          const state = gameStorage.loadGameState();
          console.log('[Bridge] Game state loaded:', state ? 'success' : 'no saved state');
          return state;
        } catch (e) {
          console.error('[Bridge] Error loading state:', e);
          return null;
        }
      },

      // Record a move
      recordMove: function(from_r, from_c, to_r, to_c, player) {
        try {
          const move = {
            from: { r: from_r, c: from_c },
            to: { r: to_r, c: to_c },
            player: player,
            timestamp: Date.now()
          };
          gameStorage.saveMove(move);
          console.log('[Bridge] Move recorded:', move);
          return true;
        } catch (e) {
          console.error('[Bridge] Error recording move:', e);
          return false;
        }
      },

      // Get move history
      getMoveHistory: function() {
        try {
          const moves = gameStorage.getMoves();
          console.log('[Bridge] Retrieved', moves.length, 'moves');
          return moves;
        } catch (e) {
          console.error('[Bridge] Error getting moves:', e);
          return [];
        }
      },

      // Check if online
      isOnline: function() {
        return navigator.onLine;
      },

      // Get connection status
      getConnectionStatus: function() {
        return {
          online: navigator.onLine,
          offlineMovesCount: gameStorage.getOfflineMoves().length,
          storageInfo: gameStorage.getStorageInfo()
        };
      },

      // Save game settings
      saveSettings: function(settingsObj) {
        try {
          const settings = typeof settingsObj === 'string' 
            ? JSON.parse(settingsObj) 
            : settingsObj;
          gameStorage.saveSettings(settings);
          console.log('[Bridge] Settings saved');
          return true;
        } catch (e) {
          console.error('[Bridge] Error saving settings:', e);
          return false;
        }
      },

      // Load game settings
      loadSettings: function() {
        try {
          const settings = gameStorage.loadSettings();
          console.log('[Bridge] Settings loaded');
          return settings;
        } catch (e) {
          console.error('[Bridge] Error loading settings:', e);
          return null;
        }
      },

      // Clear all game data
      clearAllData: function() {
        if (confirm('Are you sure you want to clear all saved game data?')) {
          gameStorage.clearAll();
          console.log('[Bridge] All data cleared');
          return true;
        }
        return false;
      },

      // Export game data (for backup)
      exportData: function() {
        try {
          const data = {
            state: gameStorage.loadGameState(),
            moves: gameStorage.getMoves(),
            settings: gameStorage.loadSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0'
          };
          const jsonStr = JSON.stringify(data, null, 2);
          console.log('[Bridge] Data exported');
          return jsonStr;
        } catch (e) {
          console.error('[Bridge] Error exporting data:', e);
          return null;
        }
      },

      // Import game data (from backup)
      importData: function(jsonStr) {
        try {
          const data = JSON.parse(jsonStr);
          
          if (data.state) {
            gameStorage.saveGameState(data.state);
          }
          
          // Note: moves and settings would need custom import logic
          // to avoid overwriting current data
          
          console.log('[Bridge] Data imported successfully');
          return true;
        } catch (e) {
          console.error('[Bridge] Error importing data:', e);
          return false;
        }
      },

      // Sync offline moves manually
      syncOfflineMoves: async function() {
        try {
          const result = await gameStorage.syncOfflineMoves();
          console.log('[Bridge] Sync result:', result);
          return result;
        } catch (e) {
          console.error('[Bridge] Error syncing moves:', e);
          return false;
        }
      },

      // Get storage statistics
      getStorageStats: function() {
        try {
          return gameStorage.getStorageInfo();
        } catch (e) {
          console.error('[Bridge] Error getting storage stats:', e);
          return null;
        }
      }
    };

    // Monkey-patch console to intercept game state updates
    // This allows automatic state saving without modifying OCaml code
    const originalLog = console.log;
    console.log = function(...args) {
      // Look for game state in logs (customize based on your logging)
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Game State')) {
        try {
          // Attempt to extract and save state
          if (args[1] && typeof args[1] === 'object') {
            window.LOAGameBridge.saveState(args[1]);
          }
        } catch (e) {
          // Silently fail to avoid breaking logging
        }
      }
      originalLog.apply(console, args);
    };

    // Auto-save on page unload
    window.addEventListener('beforeunload', function() {
      // Try to save current state from DOM
      try {
        const appElement = document.getElementById('app');
        if (appElement && appElement.dataset && appElement.dataset.gameState) {
          window.LOAGameBridge.saveState(appElement.dataset.gameState);
        }
      } catch (e) {
        console.error('[Bridge] Error in beforeunload save:', e);
      }
    });

    // Restore game state on page load if available
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        try {
          const savedState = window.LOAGameBridge.loadState();
          if (savedState) {
            console.log('[Bridge] Found saved game state. To restore, use: LOAGameBridge.loadState()');
            
            // Optionally show a restore prompt
            const restoreBtn = document.createElement('button');
            restoreBtn.textContent = 'Restore Last Game';
            restoreBtn.style.cssText = 'position: fixed; top: 50px; right: 10px; z-index: 1000; padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
            restoreBtn.onclick = function() {
              // Dispatch a custom event that the OCaml code could listen for
              window.dispatchEvent(new CustomEvent('restoreGameState', { 
                detail: savedState 
              }));
              restoreBtn.remove();
            };
            document.body.appendChild(restoreBtn);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
              if (restoreBtn.parentNode) {
                restoreBtn.remove();
              }
            }, 10000);
          }
        } catch (e) {
          console.error('[Bridge] Error restoring state:', e);
        }
      }, 1000);
    });

    console.log('[Bridge] LOA Game Bridge initialized successfully');
    console.log('[Bridge] Available methods:', Object.keys(window.LOAGameBridge));
  }

  // Helper: Download exported data as file
  window.downloadGameBackup = function() {
    const data = window.LOAGameBridge.exportData();
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loa-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[Bridge] Backup downloaded');
    }
  };

  // Helper: Upload and import backup file
  window.uploadGameBackup = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const result = window.LOAGameBridge.importData(event.target.result);
          if (result) {
            alert('Backup imported successfully! Refresh the page to see changes.');
          } else {
            alert('Failed to import backup. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

})(window);

