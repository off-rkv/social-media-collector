// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE_API.JS - Chrome Storage Wrapper
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: This file makes it EASY to save and load data in Chrome extension
//   - Save/Load test ID configuration
//   - Save/Load collection progress
//   - Save/Load user settings
//   - Handle Chrome storage API complexity
//
// WHY WE NEED THIS: Chrome's storage API is callback-based and complex.
// This file wraps it in simple functions with promises (async/await).
//
// WHERE DATA IS STORED: chrome.storage.local (survives browser restarts!)
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: STORAGE KEYS
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT ARE THESE: "Key names" for storing different types of data
// WHY SEPARATE: Organization! Easy to know what each stored item is for
//
// THINK OF IT LIKE: Filing cabinet labels
//   - "twitter_config" drawer = Twitter test IDs
//   - "collection_state" drawer = Current progress
//   - "user_settings" drawer = User preferences
//
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = {
    // Configuration keys (test IDs for each platform)
    TWITTER_CONFIG: 'twitter_config',
    INSTAGRAM_CONFIG: 'instagram_config',
    FACEBOOKE_CONFIG: 'facebook_config',

    // State keys (collection progress)
    COLLECTION_STATE: 'collection_state',

    // Settings keys (user preferences)
    USER_SETTINGS : 'user_settings',

    // Session Keys (user preferences)
    USER_SETTINGS: 'user_settings',

    //Session keys (temporary data)
    CURRENT_SESSION: 'current_session',
    ACTIVITY_LOG: 'activity_log'
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: CONFIGURATION MANAGEMENT (Test IDs)
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT THESE DO: Save and load test ID configurations for each platform
//
// DATA STRUCTURE:
// {
//   like_button: {
//     selector: "[data-testid='like']",
//     classId: 0
//   },
//   comment_button: {
//     selector: "[data-testid='reply']",
//     classId: 1
//   },
//   ...
// }
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save configuration for a specific platform
 * 
 * @param {string} platform - 'twitter', 'instagram', or 'facebook'
 * @param {object} config - Test ID configuration object
 * @returns {Promise<boolean>} - True if saved successfully
 * 
 * EXAMPLE USAGE:
 *   const config = {
 *     like_button: { selector: "[data-testid='like']", classId: 0 },
 *     comment_button: { selector: "[data-testid='reply']", classId: 1 }
 *   };
 *   await saveConfig('twitter', config);
 */

async function saveConfig(platform, config){
    try {
        // Determine which storage key to use based on platform

        let storageKey;

        if (platform === 'twitter') {
            storageKey= STORAGE_KEY.TWITTER_CONFIG;
            
        } else if (platform === 'instagram') {
            storageKey = STORAGE_KEY.INSTAGRAM_CONFIG;
        } else if (platform === 'facebook') {
            storageKey = STORAGE_KEY.FACEBOOKE_CONFIG;
        } else {
            console.error (` Unknow platform: ${platform}`);
            return false;
        }


        // Add metadata to config
        const configWithMetadata ={
            ...config,
            _metadata:{
                platform:platform,
                saveAt: new Date().toISOString(),
                version: '1.0'
            }
        };

        // Save to Chrome storage
        await chrome.storage.local.set({
            [storageKey]:configWithMetadata
        });

        console.log(` Configuration saved for ${platform}`);
        return true;
        

    } catch (error) {
        console.error(` Error saving config for ${platform}:`, error);
        return false;
    }
}

/**
 * Load configuration for a specific platform
 * 
 * @param {string} platform - 'twitter', 'instagram', or 'facebook'
 * @returns {Promise<object|null>} - Configuration object or null if not found
 * 
 * EXAMPLE USAGE:
 *   const config = await loadConfig('twitter');
 *   if (config) {
 *     console.log('Like button selector:', config.like_button.selector);
 *   }
 */

async function localConfig(platform) {
    try {
        let storageKey;
        
        if (platform === "twitter") {
          storageKey = STORAGE_KEY.TWITTER_CONFIG;
        } else if (platform === "instagram") {
          storageKey = STORAGE_KEY.INSTAGRAM_CONFIG;
        } else if (platform === "facebook") {
          storageKey = STORAGE_KEY.FACEBOOKE_CONFIG;
        } else {
          console.error(`Unknown platform: ${platform}`);
          return null;
        }

        // Load from Chrome storage
        const result = await chrome.storage.local.get(storageKey);

        if (result[storageKey]) {
            console.log('Configuration loaded for ${platform');
            return result[storageKey];
        } else {
            console.log(`No configuration found for ${platform}`);
            return null;
        }

    } catch (error) {
        console.error(`Error loading config for ${platform}:`, error);
        return null;
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION 3: COLLECTION STATE MANAGEMENT (Progress Tracking)
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT THESE DO: Save and load collection progress
//
// DATA STRUCTURE:
// {
//   platform: 'twitter',
//   phase: 'pure',
//   samplesCollected: 347,
//   pureCount: 347,
//   augmentedCount: 0,
//   scrollPosition: 12450,
//   scrollCount: 355,
//   startTime: '2025-11-06T14:30:00Z',
//   lastCaptureTime: '2025-11-06T16:45:00Z',
//   isActive: true
// }
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save collection state (progress)
 * 
 * @param {object} state - Current collection state
 * @returns {Promise<boolean>} - True if saved successfully
 * 
 * EXAMPLE USAGE:
 *   const state = {
 *     platform: 'twitter',
 *     samplesCollected: 347,
 *     scrollPosition: 12450
 *   };
 *   await saveCollectionState(state);
 */

async function saveCollectionState(state) {
  try {
    // Add timestamp to state
    const stateWithTimestamp = {
      ...state,
      _lastUpdated: new Date().toISOString(),
    };

    // Save to Chrome storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.COLLECTION_STATE]: stateWithTimestamp,
    });

    console.log(
      `Collection state saved (${state.samplesCollected} samples)`
    );
    return true;
  } catch (error) {
    console.error("Error saving collection state:", error);
    return false;
  }
}

// ----------------------------------------------------------------------

/**
 * Load collection state (progress)
 * 
 * @returns {Promise<object|null>} - Collection state or null if not found
 * 
 * EXAMPLE USAGE:
 *   const state = await loadCollectionState();
 *   if (state) {
 *     console.log('Resume from sample:', state.samplesCollected);
 *   }
 */

async function loadCollectionState() {
  try {
    const result = await chrome.storage.local.get(
      STORAGE_KEYS.COLLECTION_STATE
    );

    if (result[STORAGE_KEYS.COLLECTION_STATE]) {
      console.log("Collection state loaded");
      return result[STORAGE_KEYS.COLLECTION_STATE];
    } else {
      console.log("No collection state found");
      return null;
    }
  } catch (error) {
    console.error("Error loading collection state:", error);
    return null;
  }
}

// ----------------------------------------------------------------------

/**
 * Clear collection state (reset progress)
 * 
 * @returns {Promise<boolean>} - True if cleared successfully
 * 
 * EXAMPLE USAGE:
 *   await clearCollectionState(); // Start fresh
 */
async function clearCollectionState() {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.COLLECTION_STATE);
    console.log('Collection state cleared');
    return true;
    
  } catch (error) {
    console.error('Error clearing collection state:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: USER SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT THESE DO: Save and load user preferences (scroll speed, highlight, etc.)
//
// DATA STRUCTURE:
// {
//   scrollSpeed: 35,
//   scrollDelay: 200,
//   highlightEnabled: true,
//   highlightDuration: 500,
//   browserId: 'b1'
// }
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Save user settings
 * 
 * @param {object} settings - User preference settings
 * @returns {Promise<boolean>} - True if saved successfully
 * 
 * EXAMPLE USAGE:
 *   const settings = {
 *     scrollSpeed: 40,
 *     highlightEnabled: false
 *   };
 *   await saveSettings(settings);
 */
async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.USER_SETTINGS]: settings
    });
    
    console.log(' User settings saved');
    return true;
    
  } catch (error) {
    console.error(' Error saving settings:', error);
    return false;
  }
}


/**
 * Load user settings
 * 
 * @returns {Promise<object>} - User settings or default settings
 * 
 * EXAMPLE USAGE:
 *   const settings = await loadSettings();
 *   console.log('Scroll speed:', settings.scrollSpeed);
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS);
    
    if (result[STORAGE_KEYS.USER_SETTINGS]) {
      console.log(' User settings loaded');
      return result[STORAGE_KEYS.USER_SETTINGS];
    } else {
      // Return default settings from constants.js
      console.log('⚠️ No saved settings, using defaults');
      return window.CONSTANTS.DEFAULT_SETTINGS;
    }
    
  } catch (error) {
    console.error(' Error loading settings:', error);
    return window.CONSTANTS.DEFAULT_SETTINGS;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: ACTIVITY LOG MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT THESE DO: Save and load activity logs (what happened when)
//
// DATA STRUCTURE (array of log entries):
// [
//   { timestamp: '2025-11-06T14:30:00Z', message: 'Started collection', type: 'info' },
//   { timestamp: '2025-11-06T14:35:22Z', message: 'Captured 5 elements', type: 'success' },
//   ...
// ]
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add entry to activity log
 * 
 * @param {string} message - Log message
 * @param {string} type - 'info', 'success', 'warning', or 'error'
 * @returns {Promise<boolean>} - True if added successfully
 * 
 * EXAMPLE USAGE:
 *   await addLogEntry('Captured 5 elements at Y=1247', 'success');
 */
async function addLogEntry(message, type = 'info') {
  try {
    // Load existing log
    const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVITY_LOG);
    let log = result[STORAGE_KEYS.ACTIVITY_LOG] || [];
    
    // Add new entry
    const entry = {
      timestamp: new Date().toISOString(),
      message: message,
      type: type
    };
    
    log.push(entry);
    
    // Keep only last 100 entries (prevent storage overflow)
    if (log.length > 100) {
      log = log.slice(-100);
    }
    
    // Save back to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.ACTIVITY_LOG]: log
    });
    
    console.log(`📝 Log entry added: ${message}`);
    return true;
    
  } catch (error) {
    console.error(' Error adding log entry:', error);
    return false;
  }
}


/**
 * Get activity log
 * 
 * @param {number} limit - Maximum number of entries to return
 * @returns {Promise<array>} - Array of log entries
 * 
 * EXAMPLE USAGE:
 *   const logs = await getActivityLog(10); // Get last 10 entries
 *   logs.forEach(log => console.log(log.message));
 */
async function getActivityLog(limit = 50) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVITY_LOG);
    let log = result[STORAGE_KEYS.ACTIVITY_LOG] || [];
    
    // Return last N entries
    if (limit && log.length > limit) {
      log = log.slice(-limit);
    }
    
    return log;
    
  } catch (error) {
    console.error(' Error getting activity log:', error);
    return [];
  }
}


/**
 * Clear activity log
 * 
 * @returns {Promise<boolean>} - True if cleared successfully
 */
async function clearActivityLog() {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.ACTIVITY_LOG);
    console.log(' Activity log cleared');
    return true;
    
  } catch (error) {
    console.error(' Error clearing activity log:', error);
    return false;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHAT THESE DO: Helper functions for storage management
//
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all stored data (for debugging/export)
 * 
 * @returns {Promise<object>} - All stored data
 */
async function getAllStoredData() {
  try {
    const result = await chrome.storage.local.get(null); // null = get everything
    console.log(' Retrieved all stored data');
    return result;
    
  } catch (error) {
    console.error(' Error getting all data:', error);
    return {};
  }
}


/**
 * Clear all stored data (factory reset)
 * 
 * @returns {Promise<boolean>} - True if cleared successfully
 */
async function clearAllData() {
  try {
    await chrome.storage.local.clear();
    console.log(' All stored data cleared');
    return true;
    
  } catch (error) {
    console.error(' Error clearing all data:', error);
    return false;
  }
}


/**
 * Get storage usage statistics
 * 
 * @returns {Promise<object>} - Storage usage info
 */
async function getStorageStats() {
  try {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB default
    
    const stats = {
      bytesUsed: bytesInUse,
      bytesAvailable: quota - bytesInUse,
      percentUsed: ((bytesInUse / quota) * 100).toFixed(2),
      quota: quota
    };
    
    console.log(`📊 Storage: ${stats.percentUsed}% used (${bytesInUse} / ${quota} bytes)`);
    return stats;
    
  } catch (error) {
    console.error(' Error getting storage stats:', error);
    return null;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
//
// WHY WE EXPORT: So other files can use these functions
// HOW TO USE: In other files call like: StorageAPI.saveConfig('twitter', config)
//
// ═══════════════════════════════════════════════════════════════════════════════

// Create global object with all functions
if (typeof window !== 'undefined') {
  window.StorageAPI = {
    // Configuration functions
    saveConfig,
    loadConfig,
    
    // State functions
    saveCollectionState,
    loadCollectionState,
    clearCollectionState,
    
    // Settings functions
    saveSettings,
    loadSettings,
    
    // Log functions
    addLogEntry,
    getActivityLog,
    clearActivityLog,
    
    // Utility functions
    getAllStoredData,
    clearAllData,
    getStorageStats,
    
    // Constants
    STORAGE_KEYS
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// END OF STORAGE_API.JS
// ═══════════════════════════════════════════════════════════════════════════════
//
// SUMMARY OF WHAT THIS FILE PROVIDES:
//   Save/Load test ID configurations (per platform)
//   Save/Load collection progress (resume capability)
//   Save/Load user settings (preferences)
//   Activity log management (track what happened)
//   Storage utilities (stats, clear, export)
//
// HOW OTHER FILES USE THIS:
//   - popup.js: Saves config when user clicks "Save"
//   - collector.js: Saves progress after each capture
//   - service_worker.js: Loads state on startup