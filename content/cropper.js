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
let hoveredElement = null;
let isDragging = false;
let dragStart = null;
let dragEnd = null;
let croppedElements = []; // Store cropped elements for batch processing
let platformIds = {}; // Store loaded platform IDs
let nextClassId = 56; // Start from 56 (current max is 55)
let isClassificationModalOpen = false; // Prevent multiple modals from opening

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
      • Use popup to generate batch
    </div>
  `;

  document.body.appendChild(cropperUI);

  // Add event listeners
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

        // Find the highest class ID to determine nextClassId
        let maxClassId = 55; // Current known max
        for (const platform in platformIds) {
          for (const elementKey in platformIds[platform]) {
            const classId = platformIds[platform][elementKey].classId;
            if (classId > maxClassId) {
              maxClassId = classId;
            }
          }
        }
        nextClassId = maxClassId + 1;

        console.log(`📋 Loaded platform IDs. Next class ID: ${nextClassId}`);
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
          "
        />
      </div>

      <div style="margin-bottom: 20px;">
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
          "
        />
      </div>

      <div style="font-size: 12px; color: #999; margin-bottom: 16px; padding: 8px; background: #f5f5f5; border-radius: 4px;">
        <strong>Class ID:</strong> ${nextClassId} (auto-assigned)
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
          "
        >Confirm</button>
      </div>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    const nameInput = dialog.querySelector('#element-name-input');
    const descriptionInput = dialog.querySelector('#element-description-input');
    const confirmBtn = dialog.querySelector('#element-confirm-btn');
    const cancelBtn = dialog.querySelector('#element-cancel-btn');

    // Focus name input
    nameInput.focus();

    // Handle background click to close modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log("🚫 Modal closed by background click");
        modal.remove();
        isClassificationModalOpen = false;
        resolve(null);
      }
    });

    // Handle confirm
    confirmBtn.onclick = () => {
      const name = nameInput.value.trim();
      const description = descriptionInput.value.trim();

      if (!name || !description) {
        alert("Please provide both name and description!");
        return;
      }

      modal.remove();
      isClassificationModalOpen = false;
      resolve({
        name: name,
        description: description,
        classId: nextClassId
      });

      // Increment for next element
      nextClassId++;
    };

    // Handle cancel
    cancelBtn.onclick = () => {
      modal.remove();
      isClassificationModalOpen = false;
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
  // Send to service worker to save to platform_ids.json
  chrome.runtime.sendMessage({
    action: 'SAVE_ELEMENT_TYPE',
    data: elementInfo
  }, (response) => {
    if (response && response.success) {
      console.log(`✅ Element type saved: ${elementInfo.name}`);
    } else {
      console.error(`❌ Failed to save element type: ${response?.error}`);
    }
  });
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
`;
document.head.appendChild(style);

console.log("✅ cropper.js loaded successfully");
