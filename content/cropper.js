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

// Configuration
const MAX_ELEMENTS_PER_BATCH = 10; // Maximum elements user can select before generating

let cropperActive = false;
let cropperPaused = false; // Toggle to temporarily disable element selection
let hoveredElement = null;
let isDragging = false;
let dragStart = null;
let dragEnd = null;
let croppedElements = []; // Store cropped elements for batch processing
let platformIds = {}; // Store loaded platform IDs
let nextClassId = 66; // Start from 66 (56-65 reserved for Twitter system elements)
let usedClassIds = new Set(); // Track all used class IDs to prevent duplicates
let isClassificationModalOpen = false; // Prevent multiple modals from opening
let modalClosedTimestamp = 0; // Track when modal was closed to prevent immediate re-trigger
let customElementTypes = []; // Store all custom element types for export

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

  // Load platform IDs
  loadPlatformIds();

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
    <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
      Cropped: <span id="cropped-count">0</span>/${MAX_ELEMENTS_PER_BATCH}
    </div>
    <button id="crop-pause-btn" style="
      width: 100%;
      padding: 8px;
      background: #FF9800;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-bottom: 4px;
      font-weight: 600;
    ">⏸️ Pause Selection</button>
    <button id="crop-export-json-btn" style="
      width: 100%;
      padding: 8px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      margin-bottom: 4px;
      font-weight: 600;
    ">📥 Export for platform_ids.json</button>
    <button id="crop-export-full-btn" style="
      width: 100%;
      padding: 8px;
      background: #9C27B0;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      margin-bottom: 4px;
      font-weight: 600;
    ">📊 Export Full Data</button>
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
      • Drag to manual crop<br>
      • <strong>Ctrl+/</strong> to pause/resume<br>
      • Use popup to generate batch
    </div>
  `;

  document.body.appendChild(cropperUI);

  // Add event listeners
  document.getElementById('crop-pause-btn').addEventListener('click', toggleCropperPause);
  document.getElementById('crop-export-json-btn').addEventListener('click', exportAsPlatformIdsJson);
  document.getElementById('crop-export-full-btn').addEventListener('click', exportFullData);
  document.getElementById('crop-clear-btn').addEventListener('click', clearCroppedElements);
  document.getElementById('crop-exit-btn').addEventListener('click', deactivateCropper);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Export in platform_ids.json compatible format
function exportAsPlatformIdsJson() {
  if (customElementTypes.length === 0) {
    alert('No custom element types to export yet!\n\nStart cropping elements and classifying them first.');
    return;
  }

  // Group by platform
  const platformGroups = {};

  customElementTypes.forEach(element => {
    const platform = element.platform || 'custom';
    if (!platformGroups[platform]) {
      platformGroups[platform] = {};
    }

    // Convert to platform_ids.json format
    const elementKey = element.name.toLowerCase().replace(/\s+/g, '_');
    platformGroups[platform][elementKey] = {
      selector: "PLACEHOLDER", // User needs to fill this in manually
      fallbackSelectors: [],
      classId: element.classId,
      description: element.description
    };
  });

  // Create formatted output
  const exportData = {
    _comment: "Copy the platform sections below and merge them into your platform_ids.json file",
    _exportDate: new Date().toISOString(),
    _totalElements: customElementTypes.length,
    ...platformGroups
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = `platform_ids_export_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`✅ Exported ${customElementTypes.length} elements in platform_ids.json format`);
  alert(`✅ Exported ${customElementTypes.length} elements!\n\nFormat: platform_ids.json compatible\nFile: ${a.download}\n\n⚠️ Remember to:\n1. Add CSS selectors (currently "PLACEHOLDER")\n2. Merge into your main platform_ids.json file`);
}

// Export full metadata (original format)
function exportFullData() {
  if (customElementTypes.length === 0) {
    alert('No custom element types to export yet!\n\nStart cropping elements and classifying them first.');
    return;
  }

  // Create JSON file with full metadata
  const exportData = {
    exportDate: new Date().toISOString(),
    totalElements: customElementTypes.length,
    elements: customElementTypes,
    usedClassIds: Array.from(usedClassIds).sort((a, b) => a - b)
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const a = document.createElement('a');
  a.href = url;
  a.download = `custom_element_types_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`✅ Exported ${customElementTypes.length} custom element types with full metadata`);
  alert(`✅ Exported ${customElementTypes.length} custom element types!\n\nFormat: Full metadata including timestamps\nFile: ${a.download}`);
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
  document.addEventListener('keydown', handleKeyDown, true);

  // Change cursor
  document.body.style.cursor = 'crosshair';

  console.log("✅ Cropper Mode Active");
  console.log("💡 Press Ctrl+/ to pause/resume selection");
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
  document.removeEventListener('keydown', handleKeyDown, true);

  // Restore cursor
  document.body.style.cursor = '';

  // Reset all counters and clear elements
  resetCropperProgress();

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

function toggleCropperPause() {
  cropperPaused = !cropperPaused;

  const pauseBtn = document.getElementById('crop-pause-btn');

  if (cropperPaused) {
    // Paused - disable selection
    if (pauseBtn) {
      pauseBtn.style.background = '#4CAF50';
      pauseBtn.innerHTML = '▶️ Resume Selection';
    }

    // Hide highlight box
    if (highlightBox) {
      highlightBox.style.display = 'none';
    }
    hoveredElement = null;

    // Show visual feedback
    showToast('⏸️ Selection Paused (Ctrl+/ to resume)');
    console.log("⏸️ Cropper paused - selection disabled");
  } else {
    // Resumed - enable selection
    if (pauseBtn) {
      pauseBtn.style.background = '#FF9800';
      pauseBtn.innerHTML = '⏸️ Pause Selection';
    }

    // Show visual feedback
    showToast('▶️ Selection Resumed (Ctrl+/ to pause)');
    console.log("▶️ Cropper resumed - selection enabled");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: KEYBOARD & MOUSE EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

function handleKeyDown(e) {
  // Check for Ctrl+/ (Ctrl + ForwardSlash)
  if (e.ctrlKey && e.key === '/') {
    e.preventDefault();
    e.stopPropagation();
    toggleCropperPause();
  }
}

function handleMouseMove(e) {
  if (!cropperActive || cropperPaused) return;

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
  if (!cropperActive || cropperPaused) return;

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
  if (!cropperActive || cropperPaused || !isDragging) return;

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

  // Allow clicks on classification modal
  if (e.target.closest('#classification-modal')) {
    return;
  }

  // Allow clicks on cropper UI panel (buttons always work)
  if (e.target.closest('#cropper-ui-panel')) {
    return;
  }

  // If paused, allow all clicks - user can freely navigate
  if (cropperPaused) {
    // Don't prevent default - let clicks work normally
    return;
  }

  // Only prevent normal click behavior when NOT paused
  e.preventDefault();
  e.stopPropagation();
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

  // Hide highlight box before capturing screenshot
  if (highlightBox) highlightBox.style.display = 'none';

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

  // Hide highlight box before capturing screenshot
  if (highlightBox) highlightBox.style.display = 'none';

  // Capture screenshot of area
  captureAreaScreenshot(cropData);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: SCREENSHOT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════════

async function captureElementScreenshot(cropData) {
  // Prevent capturing immediately after modal closes (500ms cooldown)
  const timeSinceModalClosed = Date.now() - modalClosedTimestamp;
  if (timeSinceModalClosed < 500) {
    console.log("⏳ Ignoring capture - modal just closed");
    return;
  }

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

    // Prompt user for element classification
    const elementInfo = await promptForElementInfo();

    if (!elementInfo) {
      console.log("⚠️ Element classification cancelled");
      return;
    }

    // Add classification info to crop data
    cropData.classId = elementInfo.classId;
    cropData.elementName = elementInfo.name;
    cropData.elementDescription = elementInfo.description;

    console.log(`🏷️ Element classified: ${elementInfo.name} (class ${elementInfo.classId})`);

    // Save new element type to platform IDs
    saveNewElementType(elementInfo);

    // Add to batch
    addCroppedElement(cropData);

  } catch (error) {
    console.error("❌ Screenshot capture error:", error);
  }
}

async function captureAreaScreenshot(cropData) {
  // Prevent capturing immediately after modal closes (500ms cooldown)
  const timeSinceModalClosed = Date.now() - modalClosedTimestamp;
  if (timeSinceModalClosed < 500) {
    console.log("⏳ Ignoring capture - modal just closed");
    return;
  }

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

    // Prompt user for element classification
    const elementInfo = await promptForElementInfo();

    if (!elementInfo) {
      console.log("⚠️ Element classification cancelled");
      return;
    }

    // Add classification info to crop data
    cropData.classId = elementInfo.classId;
    cropData.elementName = elementInfo.name;
    cropData.elementDescription = elementInfo.description;

    console.log(`🏷️ Element classified: ${elementInfo.name} (class ${elementInfo.classId})`);

    // Save new element type to platform IDs
    saveNewElementType(elementInfo);

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
  // Check if already have maximum elements
  if (croppedElements.length >= MAX_ELEMENTS_PER_BATCH) {
    console.log(`⚠️ Already have ${MAX_ELEMENTS_PER_BATCH} elements. Use 'Generate Batch' in popup or 'Clear All' to start over.`);
    alert(`Already have ${MAX_ELEMENTS_PER_BATCH} elements!\n\nUse 'Generate Batch' button in popup to create images,\nor click 'Clear All' to start over.`);
    return;
  }

  croppedElements.push(cropData);
  totalElementCount++;

  console.log(`✅ Element cropped (${croppedElements.length}/${MAX_ELEMENTS_PER_BATCH})`);

  // Update UI
  updateCropperUI();

  // Send progress update to popup
  sendProgressUpdate();

  // Visual feedback
  showCropSuccess(cropData.bbox);

  // Notify when batch is ready (but don't auto-process)
  if (croppedElements.length === MAX_ELEMENTS_PER_BATCH) {
    console.log(`✅ Batch ready! ${MAX_ELEMENTS_PER_BATCH} elements collected. Use 'Generate Batch' button in popup to create synthetic images.`);
    // Optional: Show a visual notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #4CAF50;
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      animation: fadeInOut 3s ease-in-out;
    `;
    notification.textContent = `✅ ${MAX_ELEMENTS_PER_BATCH} elements ready! Open popup to generate batch.`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
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

  // Send progress update to popup
  sendProgressUpdate();

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
// SECTION 10: ELEMENT CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

async function loadPlatformIds() {
  try {
    // Request platform IDs from service worker
    chrome.runtime.sendMessage({ action: 'GET_PLATFORM_IDS' }, (response) => {
      if (response && response.success) {
        platformIds = response.data;

        // Find the highest class ID and track all used IDs
        let maxClassId = 65; // Current known max (56-65 are Twitter system placeholders)
        usedClassIds.clear();

        for (const platform in platformIds) {
          for (const elementKey in platformIds[platform]) {
            const classId = platformIds[platform][elementKey].classId;
            usedClassIds.add(classId);
            if (classId > maxClassId) {
              maxClassId = classId;
            }
          }
        }
        nextClassId = maxClassId + 1;

        console.log(`📋 Loaded platform IDs. Next class ID: ${nextClassId}`);
        console.log(`📋 Tracking ${usedClassIds.size} used class IDs`);
      }
    });

    // Also load custom element types from storage
    chrome.storage.local.get('customElementTypes', (result) => {
      if (result.customElementTypes) {
        customElementTypes = result.customElementTypes;
        console.log(`📋 Loaded ${customElementTypes.length} custom element types`);
      }
    });
  } catch (error) {
    console.error("❌ Error loading platform IDs:", error);
  }
}

async function promptForElementInfo() {
  // Prevent multiple modals from opening simultaneously
  if (isClassificationModalOpen) {
    console.log("⚠️ Classification modal already open, ignoring request");
    return null;
  }

  isClassificationModalOpen = true;

  return new Promise((resolve) => {
    // Create modal dialog
    const modal = document.createElement('div');
    modal.id = 'classification-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      min-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    dialog.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #333;">
        🏷️ Classify This Element
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 16px;">
        Help us identify what you just selected for better YOLO training labels.
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #333;">
          Element Name (e.g., twitter_follow_button)
        </label>
        <input
          id="element-name-input"
          type="text"
          placeholder="platform_element_type"
          style="
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            cursor: text;
            pointer-events: auto;
          "
        />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #333;">
          Description (e.g., Twitter: Follow button)
        </label>
        <input
          id="element-description-input"
          type="text"
          placeholder="Platform: Description of the element"
          style="
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            cursor: text;
            pointer-events: auto;
          "
        />
      </div>

      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #333;">
          Class ID (default: ${nextClassId})
        </label>
        <input
          id="element-classid-input"
          type="number"
          value="${nextClassId}"
          min="0"
          max="999"
          placeholder="${nextClassId}"
          style="
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            cursor: text;
            pointer-events: auto;
          "
        />
        <div id="classid-error" style="font-size: 11px; color: #f44336; margin-top: 4px; display: none;">
          ⚠️ This class ID is already in use!
        </div>
        <div style="font-size: 11px; color: #999; margin-top: 4px;">
          You can manually set any class ID (0-999)
        </div>
      </div>

      <div style="display: flex; gap: 8px;">
        <button
          id="element-cancel-btn"
          style="
            flex: 1;
            padding: 10px;
            background: #f0f0f0;
            color: #333;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            pointer-events: auto;
          "
        >Cancel</button>
        <button
          id="element-confirm-btn"
          style="
            flex: 1;
            padding: 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            pointer-events: auto;
          "
        >Confirm</button>
      </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    const nameInput = dialog.querySelector('#element-name-input');
    const descriptionInput = dialog.querySelector('#element-description-input');
    const classIdInput = dialog.querySelector('#element-classid-input');
    const classIdError = dialog.querySelector('#classid-error');
    const confirmBtn = dialog.querySelector('#element-confirm-btn');
    const cancelBtn = dialog.querySelector('#element-cancel-btn');

    // Prevent clicks inside dialog from bubbling to modal background
    dialog.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Make input fields explicitly focusable
    nameInput.addEventListener('click', (e) => {
      e.stopPropagation();
      nameInput.focus();
    });

    descriptionInput.addEventListener('click', (e) => {
      e.stopPropagation();
      descriptionInput.focus();
    });

    classIdInput.addEventListener('click', (e) => {
      e.stopPropagation();
      classIdInput.focus();
    });

    // Validate class ID on input
    classIdInput.addEventListener('input', (e) => {
      const classId = parseInt(classIdInput.value);
      if (usedClassIds.has(classId)) {
        classIdError.style.display = 'block';
        classIdInput.style.borderColor = '#f44336';
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.5';
        confirmBtn.style.cursor = 'not-allowed';
      } else {
        classIdError.style.display = 'none';
        classIdInput.style.borderColor = '#ddd';
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
      }
    });

    // Focus name input
    nameInput.focus();

    // Handle background click to close modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log("🚫 Modal closed by background click");
        modal.remove();
        isClassificationModalOpen = false;
        modalClosedTimestamp = Date.now();
        resolve(null);
      }
    });

    // Handle confirm
    confirmBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const name = nameInput.value.trim();
      const description = descriptionInput.value.trim();
      const classId = parseInt(classIdInput.value);

      if (!name || !description) {
        alert("Please provide both name and description!");
        return;
      }

      if (isNaN(classId) || classId < 0 || classId > 999) {
        alert("Class ID must be a number between 0 and 999!");
        return;
      }

      if (usedClassIds.has(classId)) {
        alert("This class ID is already in use! Please choose a different one.");
        return;
      }

      modal.remove();
      isClassificationModalOpen = false;
      modalClosedTimestamp = Date.now();

      // Add to used class IDs
      usedClassIds.add(classId);

      // Update nextClassId if needed
      if (classId >= nextClassId) {
        nextClassId = classId + 1;
      }

      resolve({
        name: name,
        description: description,
        classId: classId
      });
    };

    // Handle cancel
    cancelBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      modal.remove();
      isClassificationModalOpen = false;
      modalClosedTimestamp = Date.now();
      resolve(null);
    };

    // Handle Enter key
    nameInput.onkeydown = descriptionInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        confirmBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
    };
  });
}

function saveNewElementType(elementInfo) {
  // Add to custom element types array
  const elementData = {
    name: elementInfo.name,
    description: elementInfo.description,
    classId: elementInfo.classId,
    timestamp: new Date().toISOString(),
    platform: detectCurrentPlatform()
  };

  customElementTypes.push(elementData);

  // Save to chrome storage
  chrome.storage.local.set({ customElementTypes: customElementTypes }, () => {
    console.log(`✅ Element type saved locally: ${elementInfo.name} (class ${elementInfo.classId})`);
  });

  // Also send to service worker
  chrome.runtime.sendMessage({
    action: 'SAVE_ELEMENT_TYPE',
    data: elementInfo
  }, (response) => {
    if (response && response.success) {
      console.log(`✅ Element type saved to service worker: ${elementInfo.name}`);
    } else {
      console.error(`❌ Failed to save element type to service worker: ${response?.error}`);
    }
  });
}

function detectCurrentPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
  if (hostname.includes('instagram.com')) return 'instagram';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('threads.net') || hostname.includes('threads.com')) return 'threads';
  if (hostname.includes('linkedin.com')) return 'linkedin';
  if (hostname.includes('reddit.com')) return 'reddit';
  return 'unknown';
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    z-index: 10000002;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    animation: toastFadeInOut 2s ease-in-out;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: MESSAGE LISTENER
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

  if (message.action === "BATCH_PROGRESS_UPDATE") {
    // Update loading UI with progress
    const { phase, current, total, message: statusMessage } = message.data;
    updateLoadingProgress(phase, current, total, statusMessage);
    return true;
  }

  if (message.action === "GET_CROPPER_STATE") {
    sendResponse({
      success: true,
      isActive: cropperActive,
      elementCount: croppedElements.length,
      totalElementCount: totalElementCount,
      totalBatchCount: totalBatchCount,
      totalImageCount: totalImageCount
    });
    return true;
  }
});

async function handleGenerateBatchWithVariations(config, sendResponse) {
  console.log("🚀 Generating batch with variations...", config);

  // Allow generating with 3 or more elements (up to MAX_ELEMENTS_PER_BATCH)
  if (croppedElements.length < 3) {
    sendResponse({
      success: false,
      error: `Need at least 3 elements, only have ${croppedElements.length}`
    });
    return;
  }

  try {
    // Send to backend for grid-based generation
    // Progress will be shown in popup UI
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
// SECTION 9: LOADING UI
// ═══════════════════════════════════════════════════════════════════════════════

let loadingUI = null;

function showLoadingUI(totalImages = 0) {
  // Remove existing loading UI if present
  if (loadingUI) {
    loadingUI.remove();
  }

  // Create loading overlay
  loadingUI = document.createElement('div');
  loadingUI.id = 'batch-loading-overlay';
  loadingUI.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.85);
    z-index: 10000000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  loadingUI.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 32px;
      min-width: 400px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    ">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
        <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px;">
          Generating Synthetic Data
        </div>
        <div id="loading-status" style="font-size: 14px; color: #666; margin-bottom: 16px;">
          Preparing batch...
        </div>
      </div>

      <!-- Progress Bar -->
      <div style="
        width: 100%;
        height: 8px;
        background: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
      ">
        <div id="loading-progress-bar" style="
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #4CAF50, #45a049);
          transition: width 0.3s ease;
        "></div>
      </div>

      <!-- Progress Text -->
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 16px;">
        <span id="loading-current">0</span>
        <span id="loading-total">${totalImages > 0 ? totalImages : '...'}</span>
      </div>

      <!-- Phase Indicators -->
      <div style="font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 16px;">
        <div id="phase-generate" style="margin-bottom: 8px;">
          <span style="display: inline-block; width: 20px;">⏳</span> Generating images...
        </div>
        <div id="phase-download" style="margin-bottom: 8px; opacity: 0.3;">
          <span style="display: inline-block; width: 20px;">⏳</span> Downloading files...
        </div>
        <div id="phase-complete" style="opacity: 0.3;">
          <span style="display: inline-block; width: 20px;">⏳</span> Complete!
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(loadingUI);
  console.log("📊 Loading UI shown");
}

function updateLoadingProgress(phase, current, total, message = '') {
  if (!loadingUI) return;

  const progressBar = loadingUI.querySelector('#loading-progress-bar');
  const statusText = loadingUI.querySelector('#loading-status');
  const currentText = loadingUI.querySelector('#loading-current');
  const totalText = loadingUI.querySelector('#loading-total');
  const phaseGenerate = loadingUI.querySelector('#phase-generate');
  const phaseDownload = loadingUI.querySelector('#phase-download');
  const phaseComplete = loadingUI.querySelector('#phase-complete');

  // Update progress bar
  const percentage = total > 0 ? (current / total) * 100 : 0;
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }

  // Update counters
  if (currentText) currentText.textContent = current;
  if (totalText) totalText.textContent = total;

  // Update status message
  if (statusText && message) {
    statusText.textContent = message;
  }

  // Update phase indicators
  if (phase === 'generating') {
    if (phaseGenerate) {
      phaseGenerate.style.opacity = '1';
      phaseGenerate.innerHTML = '<span style="display: inline-block; width: 20px;">⚡</span> Generating images...';
    }
    if (phaseDownload) phaseDownload.style.opacity = '0.3';
    if (phaseComplete) phaseComplete.style.opacity = '0.3';
  } else if (phase === 'downloading') {
    if (phaseGenerate) {
      phaseGenerate.style.opacity = '0.5';
      phaseGenerate.innerHTML = '<span style="display: inline-block; width: 20px;">✅</span> Generated images';
    }
    if (phaseDownload) {
      phaseDownload.style.opacity = '1';
      phaseDownload.innerHTML = '<span style="display: inline-block; width: 20px;">⬇️</span> Downloading files...';
    }
    if (phaseComplete) phaseComplete.style.opacity = '0.3';
  } else if (phase === 'complete') {
    if (phaseGenerate) {
      phaseGenerate.style.opacity = '0.5';
      phaseGenerate.innerHTML = '<span style="display: inline-block; width: 20px;">✅</span> Generated images';
    }
    if (phaseDownload) {
      phaseDownload.style.opacity = '0.5';
      phaseDownload.innerHTML = '<span style="display: inline-block; width: 20px;">✅</span> Downloaded files';
    }
    if (phaseComplete) {
      phaseComplete.style.opacity = '1';
      phaseComplete.innerHTML = '<span style="display: inline-block; width: 20px;">✅</span> Complete!';
    }
  }

  console.log(`📊 Progress: ${phase} - ${current}/${total} - ${message}`);
}

function hideLoadingUI() {
  if (loadingUI) {
    loadingUI.remove();
    loadingUI = null;
    console.log("📊 Loading UI hidden");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCropper);
} else {
  initCropper();
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.1); }
  }

  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  }

  @keyframes toastFadeInOut {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  }
`;
document.head.appendChild(style);

console.log("✅ cropper.js loaded successfully");
