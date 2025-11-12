// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE_WORKER.JS - Background Service Worker (Extension Coordinator)
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("🎉 Extension installed/updated!");
  console.log("Install reason:", details.reason);

  if (details.reason === "install") {
    console.log("🆕 First time installation - Setting up defaults...");

    const defaultSettings = {
      scrollSpeed: 35,
      scrollDelay: 200,
      highlightEnabled: true,
      highlightDuration: 500,
      browserId: "b1",
    };

    await chrome.storage.local.set({
      user_settings: defaultSettings,
    });

    console.log("✅ Default settings saved");

    await chrome.storage.local.set({
      activity_log: [],
    });

    console.log("✅ Activity log initialized");
    console.log("✅ Extension installed successfully");
  } else if (details.reason === "update") {
    const previousVersion = details.previousVersion;
    const currentVersion = chrome.runtime.getManifest().version;

    console.log(`📦 Updated from ${previousVersion} to ${currentVersion}`);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("🚀 Browser started - Service worker active");

  const result = await chrome.storage.local.get("collection_state");

  if (result.collection_state && result.collection_state.isActive) {
    console.log("📋 Found active collection session");
    console.log("Platform:", result.collection_state.platform);
    console.log("Samples collected:", result.collection_state.samplesCollected);
    console.log("⚠️ Session was interrupted - ready to resume");

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Collection Session Found",
      message: `Resume collecting ${result.collection_state.platform} data? (${result.collection_state.samplesCollected} samples so far)`,
    });
  } else {
    console.log("✅ No active session - ready for new collection");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Message received:", message.action);
  console.log("From:", sender.tab ? "Content Script" : "Popup");

  switch (message.action) {
    case "START_COLLECTION":
      handleStartCollection(message, sender, sendResponse);
      return true;

    case "PAUSE_COLLECTION":
      handlePauseCollection(message, sender, sendResponse);
      return true;

    case "STOP_COLLECTION":
      handleStopCollection(message, sender, sendResponse);
      return true;

    case "RESUME_COLLECTION":
      handleResumeCollection(message, sender, sendResponse);
      return true;

    case "UPDATE_PROGRESS":
      handleProgressUpdate(message, sender, sendResponse);
      return true;

    case "DOWNLOAD_FILES":
      handleDownloadRequest(message, sender, sendResponse);
      return true;

    case "LOG_ACTIVITY":
      handleLogActivity(message, sender, sendResponse);
      return true;

    case "COLLECTION_COMPLETE":
      handleCollectionComplete(message, sender, sendResponse);
      return true;

    case "CAPTURE_SCREENSHOT":
      handleCaptureScreenshot(message, sender, sendResponse);
      return true;

    case "GET_CURRENT_STATE":
      handleGetState(message, sender, sendResponse);
      return true;

    case "PING":
      sendResponse({ status: "alive" });
      return false;

    default:
      console.warn("⚠️ Unknown message action:", message.action);
      sendResponse({ success: false, error: "Unknown action" });
      return false;
  }
});

async function handleStartCollection(message, sender, sendResponse) {
  try {
    console.log("▶️ Service Worker: Starting collection...");
    console.log("📋 Platform:", message.platform);
    console.log("📋 Zone:", message.zone);
    console.log("📋 Config:", message.config);
    console.log("📋 Settings:", message.settings);

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tabs.length === 0) {
      console.error("❌ No active tab found");
      sendResponse({ success: false, error: "No active tab" });
      return;
    }

    const tab = tabs[0];
    console.log("📍 Target tab ID:", tab.id);
    console.log("📍 Target tab URL:", tab.url);

    const url = tab.url.toLowerCase();
    const platform = message.platform.toLowerCase();

    if (
      !url.includes(platform) &&
      !(platform === "twitter" && url.includes("x.com"))
    ) {
      console.error("❌ Tab URL does not match platform");
      console.error("   Expected:", platform);
      console.error("   Got:", url);
      sendResponse({
        success: false,
        error: `Please navigate to ${platform}.com first`,
      });
      return;
    }

    console.log("✅ Platform validation passed");
    console.log("📤 Forwarding START_COLLECTION to content script (tab " + tab.id + ")...");

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "START_COLLECTION",
        platform: message.platform,
        zone: message.zone,
        config: message.config,
        settings: message.settings || {},
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Error sending to content script:",
            chrome.runtime.lastError
          );
          console.error("   This usually means content script is not loaded.");
          console.error("   Try refreshing the page (F5) and try again.");
          sendResponse({
            success: false,
            error:
              "Could not communicate with page. Content script not loaded. Please refresh the page (F5) and try again.",
          });
        } else {
          console.log("✅ Message forwarded to collector.js");
          console.log("📨 Response from collector:", response);
          sendResponse(response);
        }
      }
    );
  } catch (error) {
    console.error("❌ Error in handleStartCollection:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handlePauseCollection(message, sender, sendResponse) {
  try {
    console.log("⏸️ Pausing collection...");

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      sendResponse({ success: false, error: "No active tab" });
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        action: "PAUSE_COLLECTION",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError);
          sendResponse({ success: false, error: "Communication error" });
        } else {
          console.log("✅ Collection paused");
          sendResponse(response);
        }
      }
    );
  } catch (error) {
    console.error("❌ Error in handlePauseCollection:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleStopCollection(message, sender, sendResponse) {
  try {
    console.log("⏹️ Stopping collection...");

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      sendResponse({ success: false, error: "No active tab" });
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        action: "STOP_COLLECTION",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError);
          sendResponse({ success: false, error: "Communication error" });
        } else {
          console.log("✅ Collection stopped");

          chrome.storage.local.get("collection_state", (result) => {
            if (result.collection_state) {
              result.collection_state.isActive = false;
              chrome.storage.local.set({
                collection_state: result.collection_state,
              });
            }
          });

          sendResponse(response);
        }
      }
    );
  } catch (error) {
    console.error("❌ Error in handleStopCollection:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleResumeCollection(message, sender, sendResponse) {
  try {
    console.log("▶️ Resuming collection...");

    const result = await chrome.storage.local.get("collection_state");

    if (!result.collection_state) {
      console.error("❌ No saved state to resume from");
      sendResponse({ success: false, error: "No saved state found" });
      return;
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      sendResponse({ success: false, error: "No active tab" });
      return;
    }

    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        action: "RESUME_COLLECTION",
        state: result.collection_state,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error:", chrome.runtime.lastError);
          sendResponse({ success: false, error: "Communication error" });
        } else {
          console.log("✅ Collection resumed");
          sendResponse(response);
        }
      }
    );
  } catch (error) {
    console.error("❌ Error in handleResumeCollection:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleProgressUpdate(message, sender, sendResponse) {
  try {
    console.log("📊 Progress update:", message.data);

    await chrome.storage.local.set({
      collection_state: message.data,
    });

    chrome.runtime
      .sendMessage({
        action: "PROGRESS_UPDATED",
        data: message.data,
      })
      .catch(() => {
        console.log("ℹ️ Popup not open, progress saved to storage");
      });

    sendResponse({ success: true });
  } catch (error) {
    console.error("❌ Error in handleProgressUpdate:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleDownloadRequest(message, sender, sendResponse) {
  try {
    console.log("💾 Download request received");
    console.log("Image filename:", message.imageFilename);
    console.log("Label filename:", message.labelFilename);

    const imageDownloadId = await chrome.downloads.download({
      url: message.imageDataUrl,
      filename: `dataset_temp/${message.imageFilename}`,
      saveAs: false,
    });

    console.log(`✅ Image download started (ID: ${imageDownloadId})`);

    const labelDownloadId = await chrome.downloads.download({
      url: message.labelDataUrl,
      filename: `dataset_temp/${message.labelFilename}`,
      saveAs: false,
    });

    console.log(`✅ Label download started (ID: ${labelDownloadId})`);

    sendResponse({
      success: true,
      imageDownloadId: imageDownloadId,
      labelDownloadId: labelDownloadId,
    });
  } catch (error) {
    console.error("❌ Error in handleDownloadRequest:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleLogActivity(message, sender, sendResponse) {
  try {
    console.log("📝 Log activity:", message.message);

    const result = await chrome.storage.local.get("activity_log");
    let log = result.activity_log || [];

    log.push({
      timestamp: new Date().toISOString(),
      message: message.message,
      type: message.type || "info",
    });

    if (log.length > 100) {
      log = log.slice(-100);
    }

    await chrome.storage.local.set({ activity_log: log });

    chrome.runtime
      .sendMessage({
        action: "LOG_ENTRY_ADDED",
        entry: log[log.length - 1],
      })
      .catch(() => {});

    sendResponse({ success: true });
  } catch (error) {
    console.error("❌ Error in handleLogActivity:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCollectionComplete(message, sender, sendResponse) {
  try {
    console.log("🎉 Collection complete!");
    console.log("Platform:", message.platform);
    console.log("Total samples:", message.totalSamples);

    const result = await chrome.storage.local.get("collection_state");
    if (result.collection_state) {
      result.collection_state.isActive = false;
      result.collection_state.completedAt = new Date().toISOString();
      await chrome.storage.local.set({
        collection_state: result.collection_state,
      });
    }

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Collection Complete! 🎉",
      message: `Collected ${message.totalSamples} samples from ${message.platform}`,
    });

    chrome.runtime
      .sendMessage({
        action: "COLLECTION_COMPLETE",
        data: message,
      })
      .catch(() => {
        console.log("ℹ️ Popup not open");
      });

    sendResponse({ success: true });
  } catch (error) {
    console.error("❌ Error in handleCollectionComplete:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCaptureScreenshot(message, sender, sendResponse) {
  try {
    console.log("📸 Capturing screenshot...");

    const tab = sender.tab;

    if (!tab || !tab.id) {
      console.error("❌ No tab ID found");
      sendResponse({ success: false, error: "No tab ID" });
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "jpeg",
      quality: 90,
    });

    console.log("✅ Screenshot captured");
    sendResponse({ success: true, dataUrl: dataUrl });
  } catch (error) {
    console.error("❌ Error capturing screenshot:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetState(message, sender, sendResponse) {
  try {
    const result = await chrome.storage.local.get("collection_state");
    sendResponse({
      success: true,
      state: result.collection_state || null,
    });
  } catch (error) {
    console.error("❌ Error in handleGetState:", error);
    sendResponse({ success: false, error: error.message });
  }
}

console.log("🟢 Service worker loaded and active");
console.log("Version:", chrome.runtime.getManifest().version);
