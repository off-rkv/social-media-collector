// ═══════════════════════════════════════════════════════════════════════════════
// BATCH_PROCESSOR.JS - Synthetic Data Generation
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Place cropped elements on canvas and generate YOLO labels
//
// FEATURES:
//   1. Place 3 elements per canvas (batch processing)
//   2. Ensure no overlap between elements
//   3. Ensure elements stay within canvas bounds
//   4. Scale elements if too large
//   5. Support multiple canvas sizes
//   6. Generate accurate YOLO labels
//   7. Apply optional augmentations
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CANVAS_SIZES = [
  { width: 1920, height: 1080, name: 'FHD' },
  { width: 1280, height: 720, name: 'HD' },
  { width: 2560, height: 1440, name: '2K' },
  { width: 640, height: 640, name: 'Square' }
];

const BACKGROUND_COLORS = [
  '#000000', // Black (dark theme)
  '#FFFFFF', // White (light theme)
  '#1a1a1a', // Dark gray
  '#f5f5f5', // Light gray
  '#0d1117', // GitHub dark
  '#ffffff'  // Pure white
];

const MAX_ELEMENT_SCALE = 0.3; // Element can be max 30% of canvas
const MIN_SPACING = 20; // Minimum pixels between elements
const MAX_PLACEMENT_ATTEMPTS = 100;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

async function processCropBatch(elements, options = {}) {
  console.log(`📦 Processing batch of ${elements.length} elements...`);

  const {
    batchSize = 3,
    canvasSize = CANVAS_SIZES[0],
    backgroundColor = BACKGROUND_COLORS[0],
    augment = true
  } = options;

  const results = [];

  // Calculate how many batches needed
  const numBatches = Math.ceil(elements.length / batchSize);

  for (let i = 0; i < numBatches; i++) {
    const batchElements = elements.slice(i * batchSize, (i + 1) * batchSize);

    console.log(`📦 Processing batch ${i + 1}/${numBatches} (${batchElements.length} elements)`);

    // Create synthetic image with this batch
    const result = await createSyntheticImage(
      batchElements,
      canvasSize,
      backgroundColor,
      augment
    );

    if (result) {
      results.push(result);
    }
  }

  console.log(`✅ Created ${results.length} synthetic images`);

  return {
    success: true,
    imagesCreated: results.length,
    results: results
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: SYNTHETIC IMAGE CREATION
// ═══════════════════════════════════════════════════════════════════════════════

async function createSyntheticImage(elements, canvasSize, backgroundColor, augment) {
  console.log(`🎨 Creating synthetic image (${canvasSize.width}x${canvasSize.height})...`);

  try {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Place elements and track positions
    const placements = [];
    const labels = [];

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      console.log(`   Placing element ${i + 1}/${elements.length}...`);

      // Load element image
      const img = await loadImage(element.image);

      // Calculate scaled size (if needed)
      const scaledSize = calculateElementSize(img, canvasSize);

      // Find valid position (no overlap, within bounds)
      const position = findValidPosition(
        scaledSize,
        canvasSize,
        placements
      );

      if (!position) {
        console.warn(`⚠️ Could not find valid position for element ${i + 1}`);
        continue;
      }

      // Draw element on canvas
      ctx.drawImage(
        img,
        position.x,
        position.y,
        scaledSize.width,
        scaledSize.height
      );

      // Store placement
      placements.push({
        x: position.x,
        y: position.y,
        width: scaledSize.width,
        height: scaledSize.height
      });

      // Generate YOLO label
      const label = generateYOLOLabel(
        position.x,
        position.y,
        scaledSize.width,
        scaledSize.height,
        canvasSize.width,
        canvasSize.height,
        element.classId || 0
      );

      labels.push(label);

      console.log(`   ✅ Element placed at (${position.x}, ${position.y})`);
    }

    // Apply augmentation if enabled
    if (augment) {
      applyAugmentation(ctx, canvas.width, canvas.height);
    }

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const labelText = labels.join('\n');

    // Generate filename
    const timestamp = Date.now();
    const filename = `synthetic_${timestamp}_${elements.length}elem`;

    console.log(`✅ Synthetic image created: ${filename}`);

    return {
      imageDataUrl: imageDataUrl,
      labelText: labelText,
      filename: filename,
      metadata: {
        canvasSize: canvasSize,
        backgroundColor: backgroundColor,
        elementsPlaced: placements.length,
        labels: labels
      }
    };

  } catch (error) {
    console.error("❌ Error creating synthetic image:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: ELEMENT SIZING
// ═══════════════════════════════════════════════════════════════════════════════

function calculateElementSize(img, canvasSize) {
  const maxWidth = canvasSize.width * MAX_ELEMENT_SCALE;
  const maxHeight = canvasSize.height * MAX_ELEMENT_SCALE;

  let width = img.width;
  let height = img.height;

  // Scale down if too large
  if (width > maxWidth || height > maxHeight) {
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY);

    width = width * scale;
    height = height * scale;

    console.log(`   📏 Scaled element: ${img.width}x${img.height} → ${Math.round(width)}x${Math.round(height)}`);
  }

  return { width, height };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: COLLISION DETECTION & PLACEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function findValidPosition(elementSize, canvasSize, existingPlacements) {
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    // Random position
    const x = Math.random() * (canvasSize.width - elementSize.width);
    const y = Math.random() * (canvasSize.height - elementSize.height);

    const position = {
      x: Math.round(x),
      y: Math.round(y)
    };

    // Check if within bounds
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x + elementSize.width > canvasSize.width ||
      position.y + elementSize.height > canvasSize.height
    ) {
      continue; // Out of bounds, try again
    }

    // Check for overlap with existing elements
    const hasOverlap = existingPlacements.some(existing =>
      checkOverlap(
        position.x,
        position.y,
        elementSize.width,
        elementSize.height,
        existing.x,
        existing.y,
        existing.width,
        existing.height
      )
    );

    if (!hasOverlap) {
      return position; // Found valid position!
    }
  }

  console.warn("⚠️ Could not find non-overlapping position after max attempts");
  return null;
}

function checkOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  // Add minimum spacing
  const spacing = MIN_SPACING;

  return !(
    x1 + w1 + spacing < x2 || // Element 1 is left of Element 2
    x1 > x2 + w2 + spacing || // Element 1 is right of Element 2
    y1 + h1 + spacing < y2 || // Element 1 is above Element 2
    y1 > y2 + h2 + spacing    // Element 1 is below Element 2
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: YOLO LABEL GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

function generateYOLOLabel(x, y, width, height, canvasWidth, canvasHeight, classId) {
  // Calculate center point
  const centerX = x + (width / 2);
  const centerY = y + (height / 2);

  // Normalize to 0-1 range
  const x_center = centerX / canvasWidth;
  const y_center = centerY / canvasHeight;
  const w_norm = width / canvasWidth;
  const h_norm = height / canvasHeight;

  // Format: classId x_center y_center width height
  return `${classId} ${x_center.toFixed(6)} ${y_center.toFixed(6)} ${w_norm.toFixed(6)} ${h_norm.toFixed(6)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: AUGMENTATION
// ═══════════════════════════════════════════════════════════════════════════════

function applyAugmentation(ctx, width, height) {
  // Get current image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Random augmentation parameters
  const brightness = 0.9 + Math.random() * 0.2; // 0.9-1.1
  const contrast = 0.95 + Math.random() * 0.1; // 0.95-1.05

  // Apply augmentation to each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Brightness
    data[i] = Math.min(255, data[i] * brightness);     // R
    data[i + 1] = Math.min(255, data[i + 1] * brightness); // G
    data[i + 2] = Math.min(255, data[i + 2] * brightness); // B

    // Contrast
    data[i] = ((data[i] - 128) * contrast) + 128;
    data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
    data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;

    // Clamp values
    data[i] = Math.max(0, Math.min(255, data[i]));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
  }

  // Put modified image data back
  ctx.putImageData(imageData, 0, 0);

  console.log("   🎨 Augmentation applied (brightness, contrast)");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

// Export for use in service worker
if (typeof self !== 'undefined' && self.importScripts) {
  // Service worker context
  self.BatchProcessor = {
    processCropBatch,
    createSyntheticImage,
    CANVAS_SIZES,
    BACKGROUND_COLORS
  };
} else {
  // Regular window context
  window.BatchProcessor = {
    processCropBatch,
    createSyntheticImage,
    CANVAS_SIZES,
    BACKGROUND_COLORS
  };
}

console.log("✅ batch_processor.js loaded successfully");
