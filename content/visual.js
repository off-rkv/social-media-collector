// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL.JS - Visual Feedback System
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Provides visual feedback to user:
//   - Show capture zone border (blue box) - always visible
//   - Show element highlights (green flash) - when elements captured
//
// TWO VISUAL LAYERS:
//   Layer 1: Zone Border (blue, persistent)
//   Layer 2: Element Highlights (green, temporary 500ms)
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

let zoneBorderElement = null;
let currentZone = null;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: ZONE BORDER (Blue Box - Always Visible)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Show capture zone border on page
 *
 * WHEN SHOWN:
 *   - Immediately when user sets coordinates in popup
 *   - Stays visible during collection
 *   - Updates live when coordinates change
 *
 * WHEN HIDDEN:
 *   - When user clicks STOP button
 *   - When extension closes
 *
 * @param {Object} zone - Zone coordinates {top, left, bottom, right} in CSS pixels
 */
function showZoneBorder(zone) {
  try {
    // Remove existing border if any
    hideZoneBorder();

    // Store current zone
    currentZone = zone;

    // Create border element
    zoneBorderElement = document.createElement("div");
    zoneBorderElement.id = "sm-collector-zone-border";

    // Calculate dimensions
    const width = zone.right - zone.left;
    const height = zone.bottom - zone.top;

    // Style the border
    Object.assign(zoneBorderElement.style, {
      position: "fixed",
      top: zone.top + "px",
      left: zone.left + "px",
      width: width + "px",
      height: height + "px",
      border: "3px solid #4A90E2",
      backgroundColor: "rgba(74, 144, 226, 0.05)",
      pointerEvents: "none",
      zIndex: "2147483647", // Maximum z-index
      boxSizing: "border-box",
      transition: "all 0.2s ease",
    });

    // Add corner indicators
    addCornerIndicators(zoneBorderElement);

    // Add to page
    document.body.appendChild(zoneBorderElement);

    console.log("✅ Zone border shown:", zone);
  } catch (error) {
    console.error("❌ Error showing zone border:", error);
  }
}

/**
 * Add corner indicators to zone border (visual enhancement)
 */
function addCornerIndicators(borderElement) {
  const corners = ["top-left", "top-right", "bottom-left", "bottom-right"];

  corners.forEach((corner) => {
    const indicator = document.createElement("div");
    indicator.className = `sm-corner-${corner}`;

    const baseStyle = {
      position: "absolute",
      width: "20px",
      height: "20px",
      border: "3px solid #4A90E2",
      backgroundColor: "rgba(74, 144, 226, 0.3)",
    };

    // Position each corner
    if (corner === "top-left") {
      Object.assign(indicator.style, baseStyle, {
        top: "-3px",
        left: "-3px",
        borderRight: "none",
        borderBottom: "none",
      });
    } else if (corner === "top-right") {
      Object.assign(indicator.style, baseStyle, {
        top: "-3px",
        right: "-3px",
        borderLeft: "none",
        borderBottom: "none",
      });
    } else if (corner === "bottom-left") {
      Object.assign(indicator.style, baseStyle, {
        bottom: "-3px",
        left: "-3px",
        borderRight: "none",
        borderTop: "none",
      });
    } else if (corner === "bottom-right") {
      Object.assign(indicator.style, baseStyle, {
        bottom: "-3px",
        right: "-3px",
        borderLeft: "none",
        borderTop: "none",
      });
    }

    borderElement.appendChild(indicator);
  });
}

/**
 * Hide/remove zone border from page
 */
function hideZoneBorder() {
  try {
    if (zoneBorderElement && zoneBorderElement.parentNode) {
      zoneBorderElement.parentNode.removeChild(zoneBorderElement);
      zoneBorderElement = null;
      console.log("✅ Zone border hidden");
    }
  } catch (error) {
    console.error("❌ Error hiding zone border:", error);
  }
}

/**
 * Update zone border position/size
 *
 * @param {Object} zone - New zone coordinates
 */
function updateZoneBorder(zone) {
  if (zoneBorderElement) {
    // Update existing border
    const width = zone.right - zone.left;
    const height = zone.bottom - zone.top;

    zoneBorderElement.style.top = zone.top + "px";
    zoneBorderElement.style.left = zone.left + "px";
    zoneBorderElement.style.width = width + "px";
    zoneBorderElement.style.height = height + "px";

    currentZone = zone;
    console.log("✅ Zone border updated:", zone);
  } else {
    // Create new border
    showZoneBorder(zone);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: ELEMENT HIGHLIGHTS (Green Flash - Temporary)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Show green highlight on element (flashes for duration)
 *
 * WHEN SHOWN:
 *   - Only when element is captured
 *   - Only if highlight toggle is ON in popup
 *   - Automatically disappears after duration
 *
 * @param {HTMLElement} element - Element to highlight
 * @param {Number} duration - How long to show (milliseconds, default 500ms)
 */
function showElementHighlight(element, duration = 500) {
  try {
    const rect = element.getBoundingClientRect();

    // Create highlight overlay
    const highlight = document.createElement("div");
    highlight.className = "sm-element-highlight";

    // Style the highlight
    Object.assign(highlight.style, {
      position: "absolute",
      top: rect.top + window.scrollY + "px",
      left: rect.left + window.scrollX + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      border: "3px solid #00FF00",
      backgroundColor: "rgba(0, 255, 0, 0.2)",
      pointerEvents: "none",
      zIndex: "2147483646", // Just below zone border
      boxSizing: "border-box",
      animation: "sm-pulse 0.3s ease-in-out",
    });

    // Add animation keyframes if not already added
    addAnimationStyles();

    // Add to page
    document.body.appendChild(highlight);

    // Remove after duration
    setTimeout(() => {
      if (highlight && highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    }, duration);
  } catch (error) {
    console.error("❌ Error showing element highlight:", error);
  }
}

/**
 * Show highlights on multiple elements
 *
 * @param {Array} elements - Array of HTMLElements
 * @param {Number} duration - Duration in ms
 */
function showMultipleHighlights(elements, duration = 500) {
  elements.forEach((element) => {
    showElementHighlight(element, duration);
  });
}

/**
 * Add CSS animation styles for highlights (only once)
 */
let animationStylesAdded = false;

function addAnimationStyles() {
  if (animationStylesAdded) return;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes sm-pulse {
      0% {
        transform: scale(1);
        opacity: 0;
      }
      50% {
        transform: scale(1.05);
        opacity: 1;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;

  document.head.appendChild(style);
  animationStylesAdded = true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: CLEANUP
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Remove all visual elements from page
 * Called when collection stops or extension closes
 */
function cleanupVisuals() {
  try {
    // Remove zone border
    hideZoneBorder();

    // Remove any lingering highlights
    const highlights = document.querySelectorAll(".sm-element-highlight");
    highlights.forEach((h) => h.remove());

    console.log("✅ Visuals cleaned up");
  } catch (error) {
    console.error("❌ Error cleaning up visuals:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: MESSAGE LISTENER (from popup.js)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Listen for zone update messages from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_ZONE_BORDER") {
    // Update zone border when user changes coordinates
    updateZoneBorder(message.zone);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "HIDE_ZONE_BORDER") {
    // Hide zone border when user clicks STOP
    hideZoneBorder();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "SHOW_ZONE_BORDER") {
    // Show zone border
    showZoneBorder(message.zone);
    sendResponse({ success: true });
    return true;
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: AUTO-CLEANUP ON PAGE UNLOAD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clean up when page is about to unload
 */
window.addEventListener("beforeunload", () => {
  cleanupVisuals();
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== "undefined") {
  window.VisualFeedback = {
    // Zone border functions
    showZoneBorder,
    hideZoneBorder,
    updateZoneBorder,

    // Highlight functions
    showElementHighlight,
    showMultipleHighlights,

    // Cleanup
    cleanupVisuals,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// END OF VISUAL.JS
// ═══════════════════════════════════════════════════════════════════════════════
//
// SUMMARY OF FUNCTIONS:
//   ✅ showZoneBorder() - Display blue capture zone border
//   ✅ hideZoneBorder() - Remove zone border
//   ✅ updateZoneBorder() - Update zone position/size
//   ✅ showElementHighlight() - Flash green on single element
//   ✅ showMultipleHighlights() - Flash green on multiple elements
//   ✅ cleanupVisuals() - Remove all visual elements
//
// VISUAL LAYERS:
//   Layer 1: Zone Border (z-index: 2147483647)
//   Layer 2: Element Highlights (z-index: 2147483646)
//
// NEXT FILE: content/collector.js (THE MAIN ENGINE!)
//
// ═══════════════════════════════════════════════════════════════════════════════
