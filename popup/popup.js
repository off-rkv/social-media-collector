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

// ═══ DEFAULT ZONE VALUES ═══
// These will be saved to storage on first load
let currentZone = {
  top: 40,
  left: 380,
  bottom: 770,
  right: 1030,
};
// ═══ END DEFAULTS ═══

// ═══════════════════════════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const elements = {
  // Navigation tabs
  zoneScannerTab: document.getElementById("zoneScannerTab"),
  elementCropperTab: document.getElementById("elementCropperTab"),
  zoneScannerPanel: document.getElementById("zoneScannerPanel"),
  elementCropperPanel: document.getElementById("elementCropperPanel"),

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

  // Cropper elements
  cropperStatusIndicator: document.getElementById("cropperStatusIndicator"),
  activateCropperBtn: document.getElementById("activateCropperBtn"),
  deactivateCropperBtn: document.getElementById("deactivateCropperBtn"),
  cropperElementCount: document.getElementById("cropperElementCount"),
  cropperBatchCount: document.getElementById("cropperBatchCount"),
  cropperImageCount: document.getElementById("cropperImageCount"),
  cropperProgressText: document.getElementById("cropperProgressText"),
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

  // Setup tab switching
  setupTabSwitching();

  // Setup cropper buttons
  setupCropperButtons();

  console.log("✅ Popup initialized");
});

// ═══════════════════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════════════════════

function setupTabSwitching() {
  elements.zoneScannerTab.addEventListener("click", () => {
    switchToTab("zoneScanner");
  });

  elements.elementCropperTab.addEventListener("click", () => {
    switchToTab("elementCropper");
  });
}

function switchToTab(tabName) {
  if (tabName === "zoneScanner") {
    // Update tab buttons
    elements.zoneScannerTab.classList.add("active");
    elements.elementCropperTab.classList.remove("active");

    // Update panels
    elements.zoneScannerPanel.classList.add("active");
    elements.elementCropperPanel.classList.remove("active");

    console.log("📊 Switched to Zone Scanner tab");
  } else if (tabName === "elementCropper") {
    // Update tab buttons
    elements.zoneScannerTab.classList.remove("active");
    elements.elementCropperTab.classList.add("active");

    // Update panels
    elements.zoneScannerPanel.classList.remove("active");
    elements.elementCropperPanel.classList.add("active");

    console.log("✂️ Switched to Element Cropper tab");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROPPER BUTTON HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function setupCropperButtons() {
  // Activate cropper button
  elements.activateCropperBtn.addEventListener("click", async () => {
    console.log("✂️ Activate Cropper button clicked");

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        alert("❌ No active tab found. Please navigate to a page first.");
        return;
      }

      // Send message to activate cropper
      chrome.tabs.sendMessage(
        tab.id,
        { action: "ACTIVATE_CROPPER" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Error:", chrome.runtime.lastError);
            alert(
              "❌ Failed to activate cropper.\n\n" +
              "Make sure you're on a supported social media site and refresh the page."
            );
            return;
          }

          if (response && response.success) {
            updateCropperStatus("active");
            elements.activateCropperBtn.disabled = true;
            elements.deactivateCropperBtn.disabled = false;
            console.log("✅ Cropper activated");
          } else {
            alert("❌ Failed to activate cropper: " + (response?.error || "Unknown error"));
          }
        }
      );
    } catch (error) {
      console.error("❌ Error activating cropper:", error);
      alert("❌ Error: " + error.message);
    }
  });

  // Deactivate cropper button
  elements.deactivateCropperBtn.addEventListener("click", async () => {
    console.log("⏹️ Deactivate Cropper button clicked");

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        return;
      }

      // Send message to deactivate cropper
      chrome.tabs.sendMessage(
        tab.id,
        { action: "DEACTIVATE_CROPPER" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Error:", chrome.runtime.lastError);
            return;
          }

          if (response && response.success) {
            updateCropperStatus("inactive");
            elements.activateCropperBtn.disabled = false;
            elements.deactivateCropperBtn.disabled = true;
            console.log("✅ Cropper deactivated");
          }
        }
      );
    } catch (error) {
      console.error("❌ Error deactivating cropper:", error);
    }
  });
}

function updateCropperStatus(status) {
  const statusEl = elements.cropperStatusIndicator;

  // Remove all status classes
  statusEl.className = "status";

  if (status === "inactive") {
    statusEl.classList.add("idle");
    statusEl.textContent = "⚪ Cropper Inactive";
  } else if (status === "active") {
    statusEl.classList.add("collecting");
    statusEl.textContent = "🟢 Cropper Active - Select elements on page";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD SAVED SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

async function loadSavedSettings() {
  try {
    console.log("📥 Loading saved settings...");

    // Load from Chrome storage
    const result = await chrome.storage.local.get([
      "zone",
      "platform",
      "highlightEnabled",
      "scrollDirection",
    ]);

    // ═══ ZONE PERSISTENCE FIX ═══
    // Apply zone coordinates (or use and SAVE defaults)
    if (result.zone) {
      currentZone = result.zone;
      console.log("✅ Loaded saved zone:", result.zone);
    } else {
      // No saved zone - save the default values
      console.log("💾 No saved zone found, saving defaults:", currentZone);
      await chrome.storage.local.set({ zone: currentZone });
    }

    // Update UI with current zone (saved or default)
    elements.zoneTop.value = currentZone.top;
    elements.zoneLeft.value = currentZone.left;
    elements.zoneBottom.value = currentZone.bottom;
    elements.zoneRight.value = currentZone.right;
    console.log("✅ Zone UI updated:", currentZone);
    // ═══ END FIX ═══

    // Apply platform
    if (result.platform) {
      currentPlatform = result.platform;
      elements.platformSelect.value = result.platform;
      console.log("✅ Loaded saved platform:", result.platform);
    } else {
      // Save default platform
      await chrome.storage.local.set({ platform: currentPlatform });
      console.log("💾 Saved default platform:", currentPlatform);
    }

    // Apply highlight toggle
    if (result.highlightEnabled !== undefined) {
      elements.highlightToggle.checked = result.highlightEnabled;
      console.log("✅ Loaded highlight setting:", result.highlightEnabled);
    } else {
      // Save default
      await chrome.storage.local.set({ highlightEnabled: true });
      elements.highlightToggle.checked = true;
      console.log("💾 Saved default highlight: true");
    }

    // Apply scroll direction
    if (result.scrollDirection) {
      if (result.scrollDirection === "up") {
        elements.scrollUp.checked = true;
      } else {
        elements.scrollDown.checked = true;
      }
      console.log("✅ Loaded scroll direction:", result.scrollDirection);
    } else {
      // Save default
      await chrome.storage.local.set({ scrollDirection: "down" });
      elements.scrollDown.checked = true;
      console.log("💾 Saved default scroll direction: down");
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
  console.log("▶️ START button clicked");
  console.log("📋 Current zone:", currentZone);
  console.log("📋 Current platform:", currentPlatform);

  try {
    // ═══ RESET UI STATE ═══
    // Reset progress display to 0
    updateProgressDisplay({
      pureCount: 0,
      augmentedCount: 0,
      totalCount: 0,
    });
    console.log("✅ Progress display reset to 0");
    // ═══ END RESET ═══

    // Get current settings
    const settings = {
      zone: currentZone,
      platform: currentPlatform,
      highlightEnabled: elements.highlightToggle.checked,
      scrollDirection: elements.scrollDown.checked ? "down" : "up",
    };

    console.log("📋 Settings:", settings);

    // Save settings
    await chrome.storage.local.set(settings);
    console.log("✅ Settings saved to storage");

    // Get active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    console.log("📍 Active tab:", tab ? tab.url : "NONE");

    if (!tab) {
      console.error("❌ No active tab found");
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
    console.log("📥 Loading platform config for:", currentPlatform);
    const config = await loadPlatformConfig(currentPlatform);

    if (!config) {
      console.error("❌ No config found for platform:", currentPlatform);
      alert(
        `❌ No configuration found for ${currentPlatform}.\n\nPlease add test IDs to config/platform_ids.json`
      );
      return;
    }

    console.log("✅ Config loaded:", config);

    // Send START message to service worker
    console.log("📤 Sending START_COLLECTION message to service worker...");
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
          console.error("❌ Runtime error:", chrome.runtime.lastError);
          alert(
            "❌ Failed to communicate with extension.\n\n" +
            "Error: " + chrome.runtime.lastError.message +
            "\n\nPlease refresh the page and try again."
          );
          return;
        }

        console.log("📨 Response from service worker:", response);

        if (response && response.success) {
          // Update UI
          isCollecting = true;
          updateStatus("collecting");
          elements.startBtn.disabled = true;
          elements.stopBtn.disabled = false;

          console.log("✅ Collection started successfully!");
          console.log("🎯 Check the page console (F12) for collection progress");
        } else {
          const errorMsg = response?.error || "Unknown error - check service worker logs";
          console.error("❌ Start failed:", errorMsg);
          alert("❌ Failed to start: " + errorMsg);
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
  console.log("⏹️ STOP button clicked");

  try {
    // Send STOP message to service worker
    console.log("📤 Sending STOP_COLLECTION message...");
    chrome.runtime.sendMessage(
      {
        action: "STOP_COLLECTION",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Runtime error:", chrome.runtime.lastError);
          return;
        }

        console.log("📨 Stop response:", response);

        if (response && response.success) {
          // ═══ RESET UI STATE COMPLETELY ═══
          isCollecting = false;
          updateStatus("idle");
          elements.startBtn.disabled = false;
          elements.stopBtn.disabled = true;

          // Reset progress to 0
          updateProgressDisplay({
            pureCount: 0,
            augmentedCount: 0,
            totalCount: 0,
          });

          console.log("✅ Collection stopped and UI reset to 0");
          console.log("🔄 Ready for new collection");
          // ═══ END RESET ═══
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
  const target = 10000; // Target samples per platform
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
    sendResponse({ received: true });
    return true;
  }

  if (message.action === "COLLECTION_COMPLETE") {
    isCollecting = false;
    updateStatus("idle");
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;

    alert(
      `🎉 Collection complete!\n\nCollected ${message.data.totalSamples} samples from ${message.data.platform}`
    );
    sendResponse({ received: true });
    return true;
  }

  if (message.action === "CROPPER_PROGRESS_UPDATED") {
    updateCropperProgress({
      elementCount: message.data.elementCount || 0,
      batchCount: message.data.batchCount || 0,
      imageCount: message.data.imageCount || 0,
    });
    sendResponse({ received: true });
    return true;
  }

  if (message.action === "CROPPER_BATCH_COMPLETE") {
    console.log("✅ Cropper batch complete:", message.data);
    sendResponse({ received: true });
    return true;
  }

  // Don't respond to messages not meant for popup
  return false;
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE CROPPER PROGRESS
// ═══════════════════════════════════════════════════════════════════════════════

function updateCropperProgress(data) {
  const { elementCount = 0, batchCount = 0, imageCount = 0 } = data;

  elements.cropperElementCount.textContent = elementCount;
  elements.cropperBatchCount.textContent = batchCount;
  elements.cropperImageCount.textContent = imageCount;

  if (elementCount === 0) {
    elements.cropperProgressText.textContent = "Ready to crop elements";
  } else if (elementCount % 3 === 0) {
    elements.cropperProgressText.textContent = `Batch complete! ${imageCount} synthetic images created`;
  } else {
    const remaining = 3 - (elementCount % 3);
    elements.cropperProgressText.textContent = `${remaining} more element${remaining > 1 ? 's' : ''} needed for next batch`;
  }

  console.log("📊 Cropper progress updated:", data);
}

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
