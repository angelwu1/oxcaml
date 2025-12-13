// Local Storage Manager for Lines of Action Game
class GameStorage {
  constructor() {
    this.STORAGE_KEY = 'loa_game_state';
    this.MOVES_KEY = 'loa_game_moves';
    this.OFFLINE_MOVES_KEY = 'loa_offline_moves';
    this.SETTINGS_KEY = 'loa_settings';
  }

  // Save current game state
  saveGameState(state) {
    try {
      const stateData = {
        gameState: state,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateData));
      console.log('[Storage] Game state saved');
      return true;
    } catch (e) {
      console.error('[Storage] Error saving game state:', e);
      return false;
    }
  }

  // Load saved game state
  loadGameState() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('[Storage] Game state loaded');
        return parsed.gameState;
      }
      return null;
    } catch (e) {
      console.error('[Storage] Error loading game state:', e);
      return null;
    }
  }

  // Save a move to history
  saveMove(move) {
    try {
      const moves = this.getMoves();
      moves.push({
        move: move,
        timestamp: Date.now(),
        synced: navigator.onLine
      });
      localStorage.setItem(this.MOVES_KEY, JSON.stringify(moves));
      
      // If offline, also save to offline queue
      if (!navigator.onLine) {
        this.addOfflineMove(move);
      }
      
      console.log('[Storage] Move saved');
      return true;
    } catch (e) {
      console.error('[Storage] Error saving move:', e);
      return false;
    }
  }

  // Get all moves
  getMoves() {
    try {
      const data = localStorage.getItem(this.MOVES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Storage] Error loading moves:', e);
      return [];
    }
  }

  // Add move to offline queue
  addOfflineMove(move) {
    try {
      const offlineMoves = this.getOfflineMoves();
      offlineMoves.push({
        move: move,
        timestamp: Date.now()
      });
      localStorage.setItem(this.OFFLINE_MOVES_KEY, JSON.stringify(offlineMoves));
      console.log('[Storage] Offline move queued');
    } catch (e) {
      console.error('[Storage] Error queuing offline move:', e);
    }
  }

  // Get offline moves queue
  getOfflineMoves() {
    try {
      const data = localStorage.getItem(this.OFFLINE_MOVES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Storage] Error loading offline moves:', e);
      return [];
    }
  }

  // Clear offline moves (after successful sync)
  clearOfflineMoves() {
    try {
      localStorage.removeItem(this.OFFLINE_MOVES_KEY);
      console.log('[Storage] Offline moves cleared');
    } catch (e) {
      console.error('[Storage] Error clearing offline moves:', e);
    }
  }

  // Sync offline moves when connection restored
  async syncOfflineMoves() {
    if (!navigator.onLine) {
      console.log('[Storage] Cannot sync - still offline');
      return false;
    }

    const offlineMoves = this.getOfflineMoves();
    if (offlineMoves.length === 0) {
      return true;
    }

    console.log(`[Storage] Syncing ${offlineMoves.length} offline moves...`);
    
    // Send moves to service worker for syncing
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_MOVES',
        moves: offlineMoves
      });
    }

    // Clear offline queue after successful sync
    this.clearOfflineMoves();
    return true;
  }

  // Save game settings
  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      console.log('[Storage] Settings saved');
      return true;
    } catch (e) {
      console.error('[Storage] Error saving settings:', e);
      return false;
    }
  }

  // Load game settings
  loadSettings() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[Storage] Error loading settings:', e);
      return null;
    }
  }

  // Clear all game data
  clearAll() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.MOVES_KEY);
      localStorage.removeItem(this.OFFLINE_MOVES_KEY);
      localStorage.removeItem(this.SETTINGS_KEY);
      console.log('[Storage] All data cleared');
      return true;
    } catch (e) {
      console.error('[Storage] Error clearing data:', e);
      return false;
    }
  }

  // Get storage usage statistics
  getStorageInfo() {
    try {
      const state = localStorage.getItem(this.STORAGE_KEY);
      const moves = localStorage.getItem(this.MOVES_KEY);
      const offlineMoves = localStorage.getItem(this.OFFLINE_MOVES_KEY);
      const settings = localStorage.getItem(this.SETTINGS_KEY);

      return {
        stateSize: state ? state.length : 0,
        movesCount: moves ? JSON.parse(moves).length : 0,
        offlineMovesCount: offlineMoves ? JSON.parse(offlineMoves).length : 0,
        hasSettings: !!settings,
        totalSize: (state?.length || 0) + (moves?.length || 0) + 
                   (offlineMoves?.length || 0) + (settings?.length || 0)
      };
    } catch (e) {
      console.error('[Storage] Error getting storage info:', e);
      return null;
    }
  }
}

// Initialize storage manager
const gameStorage = new GameStorage();

// Listen for online/offline events
window.addEventListener('online', () => {
  console.log('[Network] Connection restored');
  updateConnectionStatus(true);
  gameStorage.syncOfflineMoves();
});

window.addEventListener('offline', () => {
  console.log('[Network] Connection lost');
  updateConnectionStatus(false);
});

// Update UI with connection status
function updateConnectionStatus(isOnline) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    statusElement.textContent = isOnline ? '🟢 Online' : '🔴 Offline';
    statusElement.className = isOnline ? 'status-online' : 'status-offline';
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStorage;
}

