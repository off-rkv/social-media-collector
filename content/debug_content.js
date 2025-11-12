// debug_content.js - Test if content scripts are actually loaded
// Add this as the FIRST content script in manifest.json

console.log("🚀🚀🚀 DEBUG CONTENT SCRIPT LOADED! 🚀🚀🚀");
console.log("📍 Current URL:", window.location.href);
console.log("⏰ Loaded at:", new Date().toLocaleTimeString());

// Check if other scripts loaded
setTimeout(() => {
  console.log("📦 Checking what's loaded:");
  console.log(
    "  - Constants:",
    typeof window.CONSTANTS !== "undefined" ? "✅" : "❌"
  );
  console.log(
    "  - Helpers:",
    typeof window.Helpers !== "undefined" ? "✅" : "❌"
  );
  console.log(
    "  - VisualFeedback:",
    typeof window.VisualFeedback !== "undefined" ? "✅" : "❌"
  );
  console.log(
    "  - Collector loaded:",
    typeof isCollecting !== "undefined" ? "✅" : "❌"
  );
}, 1000);

// Listen for ANY message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨📨📨 DEBUG: Message received!", message);

  // Always respond to confirm we're alive
  sendResponse({
    debug: "Content script is alive!",
    message_received: message,
    timestamp: Date.now(),
  });

  return true; // Keep channel open
});

// Test if we can show visual feedback manually
window.testBorder = function () {
  const borderDiv = document.createElement("div");
  borderDiv.style.cssText = `
    position: fixed;
    top: 100px;
    left: 100px;
    width: 500px;
    height: 500px;
    border: 5px solid red;
    background: rgba(255,0,0,0.1);
    z-index: 999999;
    pointer-events: none;
  `;
  document.body.appendChild(borderDiv);
  console.log("🔴 Test border added!");

  setTimeout(() => {
    borderDiv.remove();
    console.log("🔴 Test border removed!");
  }, 3000);
};

console.log("💡 Type 'testBorder()' in console to test visual feedback");
