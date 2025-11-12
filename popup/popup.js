// ═══════════════════════════════════════════════════════════════════════════════
// POPUP.JS - User Interface Logic
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: This file handles all UI interactions:
//   - Load saved settings on popup open
//   - Update zone border when coordinates change
//   - Handle START/STOP button clicks
//   - Update progress display in real-time
//   - Send messages to service worker
//
// RUNS: In the popup window (when user clicks extension icon)
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

let isCollecting = false;
let currentPlatform = "twitter";
let currentZone = {
  top: 160,
  left: 380,
  bottom: 750,
  right: 1020,
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const elements = {
  // Zone inputs
  zoneTop: document.getElementById("zoneTop"),
  zoneLeft: document.getElementById("zoneLeft"),
  zoneBottom: document.getElementById("zoneBottom"),
  zoneRight: document.getElementById("zoneRight"),
  zoneStatus: document.getElementById("zoneStatus"),

  // Settings
  highlightToggle: document.getElementById("highlightToggle"),
  scrollDown: document.getElementById("scrollDown"),
  scrollUp: document.getElementById("scrollUp"),
  platformSelect: document.getElementById("platformSelect"),

  // Status & Progress
  statusIndicator: document.getElementById("statusIndicator"),
  pureCount: document.getElementById("pureCount"),
  augCount: document.getElementById("augCount"),
  totalCount: document.getElementById("totalCount"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),

  // Buttons
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
};

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION - Runs when popup opens
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🎯 Popup opened");

  // Load saved settings
  await loadSavedSettings();

  // Load saved progress
  await loadProgress();


  console.log("✅ Popup initialized");
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD SAVED SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadSavedSettings() {
  try {
    // Load from Chrome storage
    const result = await chrome.storage.local.get([
      "zone",
      "platform",
      "highlightEnabled",
      "scrollDirection",
    ]);

    // Apply zone coordinates (or use defaults)
    if (result.zone) {
      currentZone = result.zone;
      elements.zoneTop.value = result.zone.top;
      elements.zoneLeft.value = result.zone.left;
      elements.zoneBottom.value = result.zone.bottom;
      elements.zoneRight.value = result.zone.right;
      console.log("✅ Loaded saved zone:", result.zone);
    }

    // Apply platform
    if (result.platform) {
      currentPlatform = result.platform;
      elements.platformSelect.value = result.platform;
      console.log("✅ Loaded saved platform:", result.platform);
    }

    // Apply highlight toggle
    if (result.highlightEnabled !== undefined) {
      elements.highlightToggle.checked = result.highlightEnabled;
    }

    // Apply scroll direction
    if (result.scrollDirection) {
      if (result.scrollDirection === "up") {
        elements.scrollUp.checked = true;
      } else {
        elements.scrollDown.checked = true;
      }
    }
  } catch (error) {
    console.error("❌ Error loading settings:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadProgress() {
  try {
    const result = await chrome.storage.local.get("collection_state");

    if (result.collection_state) {
      const state = result.collection_state;

      // Update counters
      updateProgressDisplay({
        pureCount: state.pureCount || 0,
        augmentedCount: state.augmentedCount || 0,
        totalCount: state.samplesCollected || 0,
      });

      // Update status if collection is active
      if (state.isActive) {
        isCollecting = true;
        updateStatus("collecting");
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
      }

      console.log("✅ Loaded progress:", state);
    }
  } catch (error) {
    console.error("❌ Error loading progress:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE COORDINATE INPUTS - Update zone border live
// ═══════════════════════════════════════════════════════════════════════════════

// Listen to all zone input changes
elements.zoneTop.addEventListener("input", handleZoneChange);
elements.zoneLeft.addEventListener("input", handleZoneChange);
elements.zoneBottom.addEventListener("input", handleZoneChange);
elements.zoneRight.addEventListener("input", handleZoneChange);

async function handleZoneChange() {
  // Get current values
  currentZone = {
    top: parseInt(elements.zoneTop.value) || 0,
    left: parseInt(elements.zoneLeft.value) || 0,
    bottom: parseInt(elements.zoneBottom.value) || 900,
    right: parseInt(elements.zoneRight.value) || 1920,
  };

  // Save to storage
  await chrome.storage.local.set({ zone: currentZone });

  // Update zone border on page
  await updateZoneBorder();

  console.log("📐 Zone updated:", currentZone);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE ZONE BORDER (Send message to content script)
// ═══════════════════════════════════════════════════════════════════════════════

async function updateZoneBorder() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      console.log("⚠️ No active tab");
      return;
    }

    // Send message to content script to show zone border
    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "UPDATE_ZONE_BORDER",
        zone: currentZone,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log(
            "⚠️ Content script not ready yet (page might be loading)"
          );
        } else {
          console.log("✅ Zone border updated on page");
        }
      }
    );
  } catch (error) {
    console.log("⚠️ Could not update zone border:", error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

elements.platformSelect.addEventListener("change", async () => {
  currentPlatform = elements.platformSelect.value;

  // Save to storage
  await chrome.storage.local.set({ platform: currentPlatform });

  console.log("🌐 Platform changed to:", currentPlatform);
});

// ═══════════════════════════════════════════════════════════════════════════════
// START BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

elements.startBtn.addEventListener("click", async () => {
  console.log("▶️ START clicked");

  try {
    // Get current settings
    const settings = {
      zone: currentZone,
      platform: currentPlatform,
      highlightEnabled: elements.highlightToggle.checked,
      scrollDirection: elements.scrollDown.checked ? "down" : "up",
    };

    // Save settings
    await chrome.storage.local.set(settings);

    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      alert(
        "❌ No active tab found. Please navigate to the social media site first."
      );
      return;
    }

    // Verify tab is on correct platform
    const url = tab.url.toLowerCase();
    const platform = currentPlatform.toLowerCase();

    // Platform-specific URL validation
    let isValidPlatform = false;

    switch (platform) {
      case "twitter":
        isValidPlatform = url.includes("twitter.com") || url.includes("x.com");
        break;
      case "instagram":
        isValidPlatform = url.includes("instagram.com");
        break;
      case "facebook":
        isValidPlatform = url.includes("facebook.com");
        break;
      case "whatsapp":
        isValidPlatform = url.includes("web.whatsapp.com");
        break;
      case "linkedin":
        isValidPlatform = url.includes("linkedin.com");
        break;
      case "reddit":
        isValidPlatform = url.includes("reddit.com");
        break;
      case "discord":
        isValidPlatform = url.includes("discord.com");
        break;
      case "threads":
        isValidPlatform = url.includes("threads.net");
        break;
      case "youtube":
        isValidPlatform = url.includes("youtube.com");
        break;
      case "snapchat":
        isValidPlatform = url.includes("snapchat.com");
        break;
      default:
        isValidPlatform = url.includes(platform);
    }

    if (!isValidPlatform) {
      alert(
        `❌ Please navigate to ${currentPlatform} first!\n\nCurrent URL: ${tab.url}`
      );
      return;
    }

    // Load config for this platform
    const config = await loadPlatformConfig(currentPlatform);

    if (!config) {
      alert(
        `❌ No configuration found for ${currentPlatform}.\n\nPlease add test IDs to config/platform_ids.json`
      );
      return;
    }

    // Send START message to service worker
    chrome.runtime.sendMessage(
      {
        action: "START_COLLECTION",
        platform: currentPlatform,
        zone: currentZone,
        config: config,
        settings: {
          highlightEnabled: settings.highlightEnabled,
          scrollDirection: settings.scrollDirection,
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError);
          alert(
            "❌ Failed to start collection. Please refresh the page and try again."
          );
          return;
        }

        if (response && response.success) {
          // Update UI
          isCollecting = true;
          updateStatus("collecting");
          elements.startBtn.disabled = true;
          elements.stopBtn.disabled = false;

          console.log("✅ Collection started successfully");
        } else {
          alert("❌ Failed to start: " + (response?.error || "Unknown error"));
        }
      }
    );
  } catch (error) {
    console.error("❌ Error starting collection:", error);
    alert("❌ Error: " + error.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STOP BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

elements.stopBtn.addEventListener("click", async () => {
  console.log("⏹️ STOP clicked");

  try {
    // Send STOP message to service worker
    chrome.runtime.sendMessage(
      {
        action: "STOP_COLLECTION",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError);
          return;
        }

        if (response && response.success) {
          // Update UI
          isCollecting = false;
          updateStatus("idle");
          elements.startBtn.disabled = false;
          elements.stopBtn.disabled = true;

          console.log("✅ Collection stopped");
        }
      }
    );
  } catch (error) {
    console.error("❌ Error stopping collection:", error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD PLATFORM CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

async function loadPlatformConfig(platform) {
  try {
    // Try to fetch from config file
    const response = await fetch(`../config/platform_ids.json`);

    if (!response.ok) {
      console.warn("⚠️ Could not load config file");
      return null;
    }

    const allConfigs = await response.json();
    const config = allConfigs[platform];

    if (!config) {
      console.warn(`⚠️ No config found for platform: ${platform}`);
      return null;
    }

    console.log(`✅ Loaded config for ${platform}:`, config);
    return config;
  } catch (error) {
    console.error("❌ Error loading config:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE STATUS INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function updateStatus(status) {
  const statusEl = elements.statusIndicator;

  // Remove all status classes
  statusEl.className = "status";

  if (status === "idle") {
    statusEl.classList.add("idle");
    statusEl.textContent = "⚪ Idle - Ready to collect";
  } else if (status === "collecting") {
    statusEl.classList.add("collecting");
    statusEl.textContent = "🟢 Collecting data...";
  } else if (status === "paused") {
    statusEl.classList.add("paused");
    statusEl.textContent = "🟡 Paused";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PROGRESS DISPLAY
// ═══════════════════════════════════════════════════════════════════════════════

function updateProgressDisplay(data) {
  const { pureCount = 0, augmentedCount = 0, totalCount = 0 } = data;

  // Update counters
  elements.pureCount.textContent = pureCount;
  elements.augCount.textContent = augmentedCount;
  elements.totalCount.textContent = totalCount;

  // Update progress bar
  const target = 1000; // Target samples per platform
  const percentage = (totalCount / target) * 100;

  elements.progressBar.style.width = Math.min(percentage, 100) + "%";
  elements.progressText.textContent = `${totalCount} / ${target} samples (${percentage.toFixed(
    1
  )}%)`;

  console.log("📊 Progress updated:", data);
}

// ═══════════════════════════════════════════════════════════════════════════════
// LISTEN FOR PROGRESS UPDATES from service worker
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Popup received message:", message.action);

  if (message.action === "PROGRESS_UPDATED") {
    updateProgressDisplay({
      pureCount: message.data.pureCount || 0,
      augmentedCount: message.data.augmentedCount || 0,
      totalCount: message.data.samplesCollected || 0,
    });
  }

  if (message.action === "COLLECTION_COMPLETE") {
    isCollecting = false;
    updateStatus("idle");
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;

    alert(
      `🎉 Collection complete!\n\nCollected ${message.data.totalSamples} samples from ${message.data.platform}`
    );
  }

  sendResponse({ received: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SAVE SETTINGS ON INPUT CHANGE
// ═══════════════════════════════════════════════════════════════════════════════

// Highlight toggle
elements.highlightToggle.addEventListener("change", async () => {
  await chrome.storage.local.set({
    highlightEnabled: elements.highlightToggle.checked,
  });
  console.log("👁️ Highlight toggle:", elements.highlightToggle.checked);
});

// Scroll direction
elements.scrollDown.addEventListener("change", async () => {
  await chrome.storage.local.set({ scrollDirection: "down" });
  console.log("📜 Scroll direction: down");
});

elements.scrollUp.addEventListener("change", async () => {
  await chrome.storage.local.set({ scrollDirection: "up" });
  console.log("📜 Scroll direction: up");
});

// ═══════════════════════════════════════════════════════════════════════════════
// END OF POPUP.JS
// ═══════════════════════════════════════════════════════════════════════════════
//
// SUMMARY OF WHAT THIS FILE DOES:
//   ✅ Loads saved settings on popup open
//   ✅ Updates zone border live as user types
//   ✅ Handles START button (validates, loads config, sends message)
//   ✅ Handles STOP button
//   ✅ Updates progress display in real-time
//   ✅ Saves all settings to Chrome storage
//   ✅ Listens for updates from service worker
//
// NEXT FILES TO CREATE:
//   - content/helpers.js
//   - content/visual.js
//   - content/collector.js
//
// ═══════════════════════════════════════════════════════════════════════════════
