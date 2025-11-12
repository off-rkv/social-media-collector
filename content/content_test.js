// content_test.js - Test if content script is loading
console.log("🚀 Content script loaded successfully!");
console.log("📍 Current URL:", window.location.href);
console.log("🎯 Platform detection:", detectCurrentPlatform());

// Function to detect platform
function detectCurrentPlatform() {
  const hostname = window.location.hostname;

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    return "twitter";
  } else if (hostname.includes("instagram.com")) {
    return "instagram";
  } else if (hostname.includes("facebook.com")) {
    return "facebook";
  }

  return "unknown";
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Content script received message:", message);

  if (message.action === "PING") {
    console.log("🏓 PONG! Content script is alive!");
    sendResponse({ status: "alive", platform: detectCurrentPlatform() });
    return true;
  }
});

// Send a message to service worker to confirm we're loaded
chrome.runtime
  .sendMessage({
    action: "CONTENT_SCRIPT_READY",
    url: window.location.href,
    platform: detectCurrentPlatform(),
  })
  .then((response) => {
    console.log("✅ Service worker acknowledged:", response);
  })
  .catch((error) => {
    console.log("⚠️ Service worker not responding:", error);
  });
