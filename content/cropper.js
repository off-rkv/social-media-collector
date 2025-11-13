// ═══════════════════════════════════════════════════════════════════════════════
// CROPPER.JS - Element Selection & Cropping Tool
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Allow users to select and crop UI elements with accurate coordinates
//
// FEATURES:
//   1. Hover to highlight elements (auto-detect)
//   2. Click to auto-crop element
//   3. Drag to manually crop area
//   4. Track coordinates accurately
//   5. Export cropped elements with metadata
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

let cropperActive = false;
let hoveredElement = null;
let isDragging = false;
let dragStart = null;
let dragEnd = null;
let croppedElements = []; // Store cropped elements for batch processing

// Progress tracking
let totalElementCount = 0;
let totalBatchCount = 0;
let totalImageCount = 0;

// UI Elements
let highlightBox = null;
let selectionBox = null;
let cropperUI = null;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: INITIALIZE CROPPER
// ═══════════════════════════════════════════════════════════════════════════════

function initCropper() {
  console.log("🎯 Initializing Element Cropper...");

  // Create highlight box (shows on hover)
  highlightBox = document.createElement('div');
  highlightBox.id = 'cropper-highlight-box';
  highlightBox.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #00ff00;
    background: rgba(0, 255, 0, 0.1);
    z-index: 999999;
    display: none;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
  `;
  document.body.appendChild(highlightBox);

  // Create selection box (shows during drag)
  selectionBox = document.createElement('div');
  selectionBox.id = 'cropper-selection-box';
  selectionBox.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px dashed #ff0000;
    background: rgba(255, 0, 0, 0.1);
    z-index: 999999;
    display: none;
  `;
  document.body.appendChild(selectionBox);

  // Create cropper UI panel
  createCropperUI();

  console.log("✅ Element Cropper initialized");
}

function createCropperUI() {
  cropperUI = document.createElement('div');
  cropperUI.id = 'cropper-ui-panel';
  cropperUI.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: white;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 12px;
    z-index: 1000000;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    font-family: Arial, sans-serif;
    min-width: 200px;
    display: none;
  `;

  cropperUI.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; color: #333;">
      🎯 Element Cropper
    </div>
    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
      Cropped: <span id="cropped-count">0</span>/3
    </div>
    <button id="crop-done-btn" style="
      width: 100%;
      padding: 8px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-bottom: 4px;
    ">Process Batch</button>
    <button id="crop-clear-btn" style="
      width: 100%;
      padding: 8px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-bottom: 4px;
    ">Clear All</button>
    <button id="crop-exit-btn" style="
      width: 100%;
      padding: 8px;
      background: #666;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">Exit Cropper</button>
    <div style="margin-top: 8px; font-size: 11px; color: #999;">
      • Hover to highlight<br>
      • Click to auto-crop<br>
      • Drag to manual crop
    </div>
  `;

  document.body.appendChild(cropperUI);

  // Add event listeners
  document.getElementById('crop-done-btn').addEventListener('click', processBatch);
  document.getElementById('crop-clear-btn').addEventListener('click', clearCroppedElements);
  document.getElementById('crop-exit-btn').addEventListener('click', deactivateCropper);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: ACTIVATE/DEACTIVATE CROPPER
// ═══════════════════════════════════════════════════════════════════════════════

function activateCropper() {
  if (cropperActive) return;

  console.log("🎯 Activating Element Cropper Mode...");
  cropperActive = true;

  // Show UI
  if (cropperUI) cropperUI.style.display = 'block';

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mouseup', handleMouseUp, true);

  // Change cursor
  document.body.style.cursor = 'crosshair';

  console.log("✅ Cropper Mode Active");
}

function deactivateCropper() {
  console.log("⏹️ Deactivating Element Cropper...");
  cropperActive = false;

  // Hide UI
  if (cropperUI) cropperUI.style.display = 'none';
  if (highlightBox) highlightBox.style.display = 'none';
  if (selectionBox) selectionBox.style.display = 'none';

  // Remove event listeners
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('mouseup', handleMouseUp, true);

  // Restore cursor
  document.body.style.cursor = '';

  // Note: We keep the progress counters so user can see total stats
  // Clear current batch if any
  clearCroppedElements();

  console.log("✅ Cropper Mode Deactivated");
}

function resetCropperProgress() {
  // Reset all counters
  totalElementCount = 0;
  totalBatchCount = 0;
  totalImageCount = 0;
  clearCroppedElements();
  sendProgressUpdate();
  console.log("🔄 Cropper progress reset");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: MOUSE EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function handleMouseMove(e) {
  if (!cropperActive) return;

  // During drag, update selection box
  if (isDragging && dragStart) {
    updateSelectionBox(e.clientX, e.clientY);
    return;
  }

  // Hovering - highlight element under cursor
  const element = getElementAtPoint(e.clientX, e.clientY);
  if (element && element !== hoveredElement) {
    hoveredElement = element;
    showHighlight(element);
  }
}

function handleMouseDown(e) {
  if (!cropperActive) return;

  // Ignore clicks on cropper UI
  if (e.target.closest('#cropper-ui-panel')) return;

  e.preventDefault();
  e.stopPropagation();

  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY };

  // Hide highlight during drag
  if (highlightBox) highlightBox.style.display = 'none';
}

function handleMouseUp(e) {
  if (!cropperActive || !isDragging) return;

  e.preventDefault();
  e.stopPropagation();

  isDragging = false;
  dragEnd = { x: e.clientX, y: e.clientY };

  // Hide selection box
  if (selectionBox) selectionBox.style.display = 'none';

  // Calculate drag distance
  const dx = Math.abs(dragEnd.x - dragStart.x);
  const dy = Math.abs(dragEnd.y - dragStart.y);

  // If drag distance is small (<5px), treat as click (auto-crop)
  if (dx < 5 && dy < 5) {
    console.log("📌 Click detected - Auto-cropping element");
    autoCropElement(e.clientX, e.clientY);
  } else {
    console.log("✂️ Drag detected - Manual cropping area");
    manualCropArea(dragStart, dragEnd);
  }

  dragStart = null;
  dragEnd = null;
}

function handleClick(e) {
  if (!cropperActive) return;

  // Prevent normal click behavior
  if (!e.target.closest('#cropper-ui-panel')) {
    e.preventDefault();
    e.stopPropagation();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: ELEMENT DETECTION & HIGHLIGHTING
// ═══════════════════════════════════════════════════════════════════════════════

function getElementAtPoint(x, y) {
  // Temporarily hide highlight/selection boxes to get element underneath
  const highlight = highlightBox;
  const selection = selectionBox;
  const ui = cropperUI;

  if (highlight) highlight.style.display = 'none';
  if (selection) selection.style.display = 'none';
  if (ui) ui.style.pointerEvents = 'none';

  const element = document.elementFromPoint(x, y);

  if (highlight) highlight.style.display = 'block';
  if (ui) ui.style.pointerEvents = 'auto';

  return element;
}

function showHighlight(element) {
  if (!highlightBox) return;

  const rect = element.getBoundingClientRect();

  highlightBox.style.display = 'block';
  highlightBox.style.left = rect.left + 'px';
  highlightBox.style.top = rect.top + 'px';
  highlightBox.style.width = rect.width + 'px';
  highlightBox.style.height = rect.height + 'px';
}

function updateSelectionBox(currentX, currentY) {
  if (!selectionBox || !dragStart) return;

  const left = Math.min(dragStart.x, currentX);
  const top = Math.min(dragStart.y, currentY);
  const width = Math.abs(currentX - dragStart.x);
  const height = Math.abs(currentY - dragStart.y);

  selectionBox.style.display = 'block';
  selectionBox.style.left = left + 'px';
  selectionBox.style.top = top + 'px';
  selectionBox.style.width = width + 'px';
  selectionBox.style.height = height + 'px';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: CROPPING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function autoCropElement(x, y) {
  const element = getElementAtPoint(x, y);
  if (!element) {
    console.warn("⚠️ No element found at click position");
    return;
  }

  const rect = element.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1.0;

  // Get accurate coordinates
  const cropData = {
    type: 'auto',
    element: element,
    bbox: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      // Display pixel coordinates
      displayX: rect.x * dpr,
      displayY: rect.y * dpr,
      displayWidth: rect.width * dpr,
      displayHeight: rect.height * dpr
    },
    timestamp: Date.now(),
    tagName: element.tagName.toLowerCase(),
    classList: Array.from(element.classList),
    id: element.id || null
  };

  // Capture screenshot of element
  captureElementScreenshot(cropData);
}

function manualCropArea(start, end) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const dpr = window.devicePixelRatio || 1.0;

  const cropData = {
    type: 'manual',
    bbox: {
      x: left,
      y: top,
      width: width,
      height: height,
      // Display pixel coordinates
      displayX: left * dpr,
      displayY: top * dpr,
      displayWidth: width * dpr,
      displayHeight: height * dpr
    },
    timestamp: Date.now()
  };

  // Capture screenshot of area
  captureAreaScreenshot(cropData);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: SCREENSHOT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════════

async function captureElementScreenshot(cropData) {
  console.log("📸 Capturing element screenshot...");

  try {
    // Request screenshot from background
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'CAPTURE_SCREENSHOT' },
        (response) => resolve(response)
      );
    });

    if (!response || !response.dataUrl) {
      console.error("❌ Failed to capture screenshot");
      return;
    }

    // Crop the element from full screenshot
    const croppedImage = await cropImageFromScreenshot(
      response.dataUrl,
      cropData.bbox
    );

    cropData.image = croppedImage;
    cropData.fullScreenshot = response.dataUrl;

    // Add to batch
    addCroppedElement(cropData);

  } catch (error) {
    console.error("❌ Screenshot capture error:", error);
  }
}

async function captureAreaScreenshot(cropData) {
  console.log("📸 Capturing manual crop area...");

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'CAPTURE_SCREENSHOT' },
        (response) => resolve(response)
      );
    });

    if (!response || !response.dataUrl) {
      console.error("❌ Failed to capture screenshot");
      return;
    }

    const croppedImage = await cropImageFromScreenshot(
      response.dataUrl,
      cropData.bbox
    );

    cropData.image = croppedImage;
    cropData.fullScreenshot = response.dataUrl;

    addCroppedElement(cropData);

  } catch (error) {
    console.error("❌ Screenshot capture error:", error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: IMAGE CROPPING
// ═══════════════════════════════════════════════════════════════════════════════

function cropImageFromScreenshot(dataUrl, bbox) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1.0;

      // Set canvas size to cropped area (in display pixels)
      canvas.width = bbox.displayWidth;
      canvas.height = bbox.displayHeight;

      // Draw cropped portion
      ctx.drawImage(
        img,
        bbox.displayX, bbox.displayY, // Source position
        bbox.displayWidth, bbox.displayHeight, // Source size
        0, 0, // Destination position
        bbox.displayWidth, bbox.displayHeight // Destination size
      );

      // Convert to data URL
      const croppedDataUrl = canvas.toDataURL('image/png');
      resolve(croppedDataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load screenshot'));
    img.src = dataUrl;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: BATCH MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function addCroppedElement(cropData) {
  croppedElements.push(cropData);
  totalElementCount++;

  console.log(`✅ Element cropped (${croppedElements.length}/3)`);

  // Update UI
  updateCropperUI();

  // Send progress update to popup
  sendProgressUpdate();

  // Visual feedback
  showCropSuccess(cropData.bbox);

  // Auto-process when batch is full
  if (croppedElements.length >= 3) {
    console.log("📦 Batch full! Processing...");
    setTimeout(() => processBatch(), 500);
  }
}

function sendProgressUpdate() {
  chrome.runtime.sendMessage({
    action: 'CROPPER_PROGRESS_UPDATED',
    data: {
      elementCount: totalElementCount,
      batchCount: totalBatchCount,
      imageCount: totalImageCount
    }
  }, (response) => {
    // Optional: handle response
  });
}

function updateCropperUI() {
  const countEl = document.getElementById('cropped-count');
  if (countEl) {
    countEl.textContent = croppedElements.length;
  }
}

function showCropSuccess(bbox) {
  // Create temporary success indicator
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    left: ${bbox.x}px;
    top: ${bbox.y}px;
    width: ${bbox.width}px;
    height: ${bbox.height}px;
    border: 3px solid #00ff00;
    background: rgba(0, 255, 0, 0.2);
    z-index: 999998;
    pointer-events: none;
    animation: pulse 0.5s ease-out;
  `;

  document.body.appendChild(indicator);

  setTimeout(() => {
    indicator.remove();
  }, 500);
}

function clearCroppedElements() {
  croppedElements = [];
  updateCropperUI();
  console.log("🗑️ Cleared all cropped elements");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

async function processBatch() {
  if (croppedElements.length === 0) {
    console.warn("⚠️ No elements to process");
    return;
  }

  console.log(`📦 Processing batch of ${croppedElements.length} elements...`);

  // Send to backend for placement and label generation
  chrome.runtime.sendMessage(
    {
      action: 'PROCESS_CROP_BATCH',
      elements: croppedElements,
      batchSize: 3
    },
    (response) => {
      if (response && response.success) {
        console.log("✅ Batch processed successfully!");
        console.log(`   Generated ${response.imagesCreated} synthetic images`);

        // Update counters
        totalBatchCount++;
        totalImageCount += response.imagesCreated || 1;

        // Send progress update
        sendProgressUpdate();

        // Notify popup
        chrome.runtime.sendMessage({
          action: 'CROPPER_BATCH_COMPLETE',
          data: {
            batchNumber: totalBatchCount,
            imagesCreated: response.imagesCreated
          }
        });

        // Clear batch
        clearCroppedElements();
      } else {
        console.error("❌ Batch processing failed:", response?.error);
      }
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: MESSAGE LISTENER
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 cropper.js received message:", message.action);

  if (message.action === "ACTIVATE_CROPPER") {
    activateCropper();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "DEACTIVATE_CROPPER") {
    deactivateCropper();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "GENERATE_BATCH_WITH_VARIATIONS") {
    handleGenerateBatchWithVariations(message.config, sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleGenerateBatchWithVariations(config, sendResponse) {
  console.log("🚀 Generating batch with variations...", config);

  if (croppedElements.length < 3) {
    sendResponse({
      success: false,
      error: `Need 3 elements, only have ${croppedElements.length}`
    });
    return;
  }

  try {
    // Send to backend for grid-based generation
    chrome.runtime.sendMessage(
      {
        action: 'PROCESS_BATCH_WITH_VARIATIONS',
        elements: croppedElements,
        config: config
      },
      (response) => {
        if (response && response.success) {
          console.log(`✅ Generated ${response.imagesCreated} images!`);

          // Update counters
          totalBatchCount++;
          totalImageCount += response.imagesCreated || 0;

          // Send progress update
          sendProgressUpdate();

          // Notify popup
          chrome.runtime.sendMessage({
            action: 'CROPPER_BATCH_COMPLETE',
            data: {
              batchNumber: totalBatchCount,
              imagesCreated: response.imagesCreated
            }
          });

          // Clear batch
          clearCroppedElements();

          sendResponse({
            success: true,
            imagesCreated: response.imagesCreated
          });
        } else {
          console.error("❌ Batch processing failed:", response?.error);
          sendResponse({
            success: false,
            error: response?.error || "Unknown error"
          });
        }
      }
    );
  } catch (error) {
    console.error("❌ Error generating batch:", error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCropper);
} else {
  initCropper();
}

// Add CSS animation for success indicator
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.1); }
  }
`;
document.head.appendChild(style);

console.log("✅ cropper.js loaded successfully");
