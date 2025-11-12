// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS.JS - Utility Functions for Data Collection
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Provides reusable utility functions:
//   - BBox calculation (CSS → Display → YOLO format)
//   - DPR (Device Pixel Ratio) conversion
//   - Scroll management
//   - Filename generation
//   - Screenshot capture
//   - Sleep function
//
// USED BY: collector.js
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: BOUNDING BOX CONVERSION (CSS → Display → YOLO)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert element's bounding box to YOLO format
 *
 * FLOW:
 *   1. Get CSS pixel coordinates (getBoundingClientRect)
 *   2. Multiply by DPR to get Display pixels (matches screenshot)
 *   3. Normalize to 0-1 range for YOLO
 *
 * @param {HTMLElement} element - The DOM element to convert
 * @returns {Object} YOLO format coordinates {x_center, y_center, width, height}
 *
 * EXAMPLE:
 *   element at CSS position (100, 200) with size (50, 30)
 *   DPR = 2.0 (Retina display)
 *   →  Display: (200, 400) with size (100, 60)
 *   →  YOLO: (0.523, 0.342, 0.045, 0.038)
 */
function convertBboxToYOLO(element) {
  try {
    // Step 1: Get CSS pixel coordinates
    const rect = element.getBoundingClientRect();

    // Step 2: Get Device Pixel Ratio
    const dpr = window.devicePixelRatio || 1.0;

    // Step 3: Convert CSS → Display pixels
    const displayX = rect.x * dpr;
    const displayY = rect.y * dpr;
    const displayWidth = rect.width * dpr;
    const displayHeight = rect.height * dpr;

    // Step 4: Get screenshot dimensions (Display pixels)
    const screenWidth = window.innerWidth * dpr;
    const screenHeight = window.innerHeight * dpr;

    // Step 5: Calculate center point
    const centerX = displayX + displayWidth / 2;
    const centerY = displayY + displayHeight / 2;

    // Step 6: Normalize to 0-1 range (YOLO format)
    const x_center = centerX / screenWidth;
    const y_center = centerY / screenHeight;
    const width = displayWidth / screenWidth;
    const height = displayHeight / screenHeight;

    // Step 7: Validate (coordinates must be 0-1)
    if (
      x_center < 0 ||
      x_center > 1 ||
      y_center < 0 ||
      y_center > 1 ||
      width < 0 ||
      width > 1 ||
      height < 0 ||
      height > 1
    ) {
      console.warn("⚠️ Invalid bbox coordinates:", {
        x_center,
        y_center,
        width,
        height,
      });
      return null;
    }

    return {
      x_center: parseFloat(x_center.toFixed(6)),
      y_center: parseFloat(y_center.toFixed(6)),
      width: parseFloat(width.toFixed(6)),
      height: parseFloat(height.toFixed(6)),
    };
  } catch (error) {
    console.error("❌ Error converting bbox:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: ELEMENT ZONE CHECKING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if element is inside capture zone
 *
 * @param {HTMLElement} element - The DOM element to check
 * @param {Object} zone - Zone boundaries {top, bottom, left, right} in CSS pixels
 * @returns {Boolean} True if element is fully inside zone
 *
 * EXAMPLE:
 *   zone = {top: 60, bottom: 900, left: 0, right: 1920}
 *   element at Y=150 → Inside ✅
 *   element at Y=1100 → Outside ❌
 */
function isElementInZone(element, zone) {
  try {
    const rect = element.getBoundingClientRect();

    // Check if element is fully inside zone
    const isInside =
      rect.top >= zone.top &&
      rect.bottom <= zone.bottom &&
      rect.left >= zone.left &&
      rect.right <= zone.right;

    return isInside;
  } catch (error) {
    console.error("❌ Error checking zone:", error);
    return false;
  }
}

/**
 * Check if element is visible on screen
 *
 * @param {HTMLElement} element - The DOM element to check
 * @returns {Boolean} True if element is visible
 */
function isElementVisible(element) {
  try {
    const rect = element.getBoundingClientRect();

    // Check if element has dimensions
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    // Check if element is in viewport
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth;

    // Check if element is not hidden
    const styles = window.getComputedStyle(element);
    const isVisible =
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      styles.opacity !== "0";

    return isInViewport && isVisible;
  } catch (error) {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: SCROLL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Scroll the page in specified direction
 *
 * @param {String} direction - 'down' or 'up'
 * @param {Number} amount - Pixels to scroll (default: 35)
 * @returns {Number} New scroll position
 *
 * EXAMPLE:
 *   scroll('down', 35) → Scrolls down 35px (Twitter, Instagram, Facebook)
 *   scroll('up', 35) → Scrolls up 35px (WhatsApp)
 */
function scroll(direction, amount = 35) {
  const previousScrollY = window.scrollY;

  if (direction === "down") {
    window.scrollBy(0, amount);
  } else if (direction === "up") {
    window.scrollBy(0, -amount);
  }

  const newScrollY = window.scrollY;

  return {
    scrolled: newScrollY !== previousScrollY,
    position: newScrollY,
    delta: newScrollY - previousScrollY,
  };
}

/**
 * Check if reached end of page (no more scrolling possible)
 *
 * @param {Number} unchangedScrolls - Count of unsuccessful scroll attempts
 * @returns {Boolean} True if at end of page
 */
function isAtEndOfPage(unchangedScrolls) {
  // If scroll hasn't changed for 10 attempts, we're at the end
  return unchangedScrolls >= 10;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: FILENAME GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate unique filename for screenshot and label
 *
 * FORMAT: {platform}_{timestamp}_{counter}.{extension}
 * EXAMPLE: twitter_1730912345678_0347.jpg
 *
 * @param {String} platform - Platform name (twitter, instagram, etc.)
 * @param {Number} counter - Sample counter (1, 2, 3, ...)
 * @returns {String} Base filename without extension
 */
function generateFilename(platform, counter) {
  // Get current timestamp (milliseconds)
  const timestamp = Date.now();

  // Pad counter to 4 digits (0001, 0002, ..., 9999)
  const paddedCounter = String(counter).padStart(4, "0");

  // Combine parts
  const filename = `${platform}_${timestamp}_${paddedCounter}`;

  return filename;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: SCREENSHOT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Capture screenshot of current viewport
 *
 * @returns {Promise<String>} Base64 encoded image data URL
 *
 * HOW IT WORKS:
 *   1. Create canvas matching viewport size (with DPR)
 *   2. Draw current page content to canvas
 *   3. Convert canvas to JPEG
 *   4. Return as base64 data URL
 */
async function captureScreenshot() {
  return new Promise((resolve, reject) => {
    try {
      // Get viewport dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1.0;

      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);

      // Use Chrome's built-in screenshot API
      chrome.runtime.sendMessage(
        {
          action: "CAPTURE_SCREENSHOT",
        },
        (response) => {
          if (response && response.dataUrl) {
            resolve(response.dataUrl);
          } else {
            reject(new Error("Screenshot capture failed"));
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: ANNOTATION GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate YOLO format annotation text
 *
 * FORMAT: <class_id> <x_center> <y_center> <width> <height>
 *
 * @param {Array} elements - Array of {classId, bbox} objects
 * @returns {String} Annotation text (one line per element)
 *
 * EXAMPLE OUTPUT:
 *   0 0.5234 0.3421 0.0456 0.0389
 *   1 0.5734 0.3421 0.0456 0.0389
 *   2 0.6234 0.3421 0.0456 0.0389
 */
function generateAnnotation(elements) {
  const lines = [];

  for (const elem of elements) {
    const { classId, bbox } = elem;

    // Format: class_id x_center y_center width height
    const line = `${classId} ${bbox.x_center} ${bbox.y_center} ${bbox.width} ${bbox.height}`;
    lines.push(line);
  }

  return lines.join("\n");
}

/**
 * Convert annotation text to base64 data URL
 *
 * @param {String} text - Annotation text
 * @returns {String} Base64 data URL
 */
function annotationToDataUrl(text) {
  const blob = new Blob([text], { type: "text/plain" });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sleep/delay function
 *
 * @param {Number} ms - Milliseconds to wait
 * @returns {Promise} Resolves after delay
 *
 * EXAMPLE:
 *   await sleep(200); // Wait 200ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get class ID from element type and config
 *
 * @param {String} elementType - Element type name (like_button, reply_button, etc.)
 * @returns {Number} Class ID (0-79)
 */
function getClassId(elementType) {
  if (window.CONSTANTS && window.CONSTANTS.CLASS_IDS) {
    return window.CONSTANTS.CLASS_IDS[elementType] || 0;
  }
  return 0;
}

/**
 * Log with timestamp
 *
 * @param {String} message - Message to log
 * @param {String} type - 'info', 'success', 'warning', 'error'
 */
function logWithTimestamp(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  console.log(`[${timestamp}] ${emoji[type]} ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS (Make available to collector.js)
// ═══════════════════════════════════════════════════════════════════════════════

if (typeof window !== "undefined") {
  window.CollectorHelpers = {
    // Bbox functions
    convertBboxToYOLO,
    isElementInZone,
    isElementVisible,

    // Scroll functions
    scroll,
    isAtEndOfPage,

    // File functions
    generateFilename,
    captureScreenshot,

    // Annotation functions
    generateAnnotation,
    annotationToDataUrl,

    // Utility functions
    sleep,
    getClassId,
    logWithTimestamp,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

console.log("✅ helpers.js loaded successfully");
console.log("📦 CollectorHelpers available:", typeof window.CollectorHelpers);

// ═══════════════════════════════════════════════════════════════════════════════
// END OF HELPERS.JS
// ═══════════════════════════════════════════════════════════════════════════════
//
// SUMMARY OF FUNCTIONS:
//   ✅ convertBboxToYOLO() - CSS → Display → YOLO format
//   ✅ isElementInZone() - Check if element inside capture zone
//   ✅ isElementVisible() - Check if element visible on screen
//   ✅ scroll() - Scroll page up/down
//   ✅ isAtEndOfPage() - Detect if reached end
//   ✅ generateFilename() - Create unique filename
//   ✅ captureScreenshot() - Take viewport screenshot
//   ✅ generateAnnotation() - Create YOLO .txt content
//   ✅ annotationToDataUrl() - Convert text to data URL
//   ✅ sleep() - Async delay
//   ✅ getClassId() - Get class ID from element type
//   ✅ logWithTimestamp() - Log with timestamp
//
// NEXT FILE: content/visual.js
//
// ═══════════════════════════════════════════════════════════════════════════════
