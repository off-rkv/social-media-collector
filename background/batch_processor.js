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
// SECTION 7: GRID-BASED BATCH GENERATION WITH VARIATIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function processCropBatchWithVariations(elements, config, tabId = null) {
  console.log(`📦 Processing batch with variations...`);
  console.log(`⚙️ Config:`, config);

  const {
    canvasSizes = [CANVAS_SIZES[0]],
    backgrounds = [BACKGROUND_COLORS[0]],
    positionLevel = "medium",
    enableRotation = true,
    enableScaling = true,
    gridStepSize = 50
  } = config;

  // Define variations
  const rotations = enableRotation ? [0, 90, 180, 270] : [0];
  const scales = enableScaling ? [0.8, 1.0, 1.2] : [1.0];

  // Calculate total images to generate
  let totalImagesToGenerate = 0;
  for (const canvasSize of canvasSizes) {
    const layouts = generateGridLayouts(elements, canvasSize, positionLevel, gridStepSize);
    totalImagesToGenerate += layouts.length * backgrounds.length * rotations.length * scales.length;
  }

  console.log(`📊 Total images to generate: ${totalImagesToGenerate}`);

  const results = [];
  let totalGenerated = 0;

  // Generate position layouts for each canvas size
  for (const canvasSize of canvasSizes) {
    console.log(`📐 Generating layouts for ${canvasSize.name} (${canvasSize.width}×${canvasSize.height})...`);

    // Generate grid-based position layouts
    const layouts = generateGridLayouts(elements, canvasSize, positionLevel, gridStepSize);
    console.log(`  ✅ Generated ${layouts.length} position layouts`);

    // For each layout, generate variations
    for (const layout of layouts) {
      for (const backgroundColor of backgrounds) {
        for (const rotation of rotations) {
          for (const scale of scales) {
            // Create synthetic image with this configuration
            const result = await createSyntheticImageWithVariation(
              elements,
              layout,
              canvasSize,
              backgroundColor,
              rotation,
              scale
            );

            if (result) {
              results.push(result);
              totalGenerated++;

              // Send progress update every 10 images or every 100 images (depending on total)
              const updateInterval = totalImagesToGenerate > 1000 ? 100 : totalImagesToGenerate > 100 ? 10 : 1;
              if (totalGenerated % updateInterval === 0 || totalGenerated === totalImagesToGenerate) {
                console.log(`  📊 Generated ${totalGenerated}/${totalImagesToGenerate} images...`);

                // Send progress update to tab if tabId is provided
                if (tabId) {
                  try {
                    chrome.tabs.sendMessage(tabId, {
                      action: 'BATCH_PROGRESS_UPDATE',
                      data: {
                        phase: 'generating',
                        current: totalGenerated,
                        total: totalImagesToGenerate,
                        message: `Generating images... (${totalGenerated}/${totalImagesToGenerate})`
                      }
                    }).catch(() => {}); // Ignore errors
                  } catch (e) {
                    // Ignore errors
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`✅ Generated ${totalGenerated} total images`);

  return {
    success: true,
    imagesCreated: totalGenerated,
    results: results
  };
}

function generateGridLayouts(elements, canvasSize, positionLevel, gridStepSize) {
  // Determine number of layouts based on level
  let targetLayouts = 200; // medium
  if (positionLevel === "low") targetLayouts = 50;
  else if (positionLevel === "high") targetLayouts = 500;
  else if (positionLevel === "maximum") targetLayouts = 1000;

  const layouts = [];
  const maxAttempts = targetLayouts * 10; // Try 10x more to find valid layouts
  let attempts = 0;

  while (layouts.length < targetLayouts && attempts < maxAttempts) {
    attempts++;

    const layout = [];
    const placements = [];

    // Try to place all 3 elements
    let allPlaced = true;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Get element size (use display size for calculations)
      const elemWidth = element.bbox.displayWidth || element.bbox.width;
      const elemHeight = element.bbox.displayHeight || element.bbox.height;

      // Scale down if too large (max 30% of canvas)
      const maxSize = Math.min(canvasSize.width, canvasSize.height) * 0.3;
      let scaledWidth = elemWidth;
      let scaledHeight = elemHeight;

      if (elemWidth > maxSize || elemHeight > maxSize) {
        const scale = maxSize / Math.max(elemWidth, elemHeight);
        scaledWidth = elemWidth * scale;
        scaledHeight = elemHeight * scale;
      }

      // Try grid positions
      const placement = findGridPosition(scaledWidth, scaledHeight, canvasSize, placements, gridStepSize);

      if (placement) {
        placements.push({
          x: placement.x,
          y: placement.y,
          width: scaledWidth,
          height: scaledHeight
        });

        layout.push({
          elementIndex: i,
          x: placement.x,
          y: placement.y,
          width: scaledWidth,
          height: scaledHeight
        });
      } else {
        allPlaced = false;
        break;
      }
    }

    // If all elements placed successfully, add layout
    if (allPlaced && layout.length === elements.length) {
      layouts.push(layout);
    }
  }

  console.log(`  🎯 Generated ${layouts.length} valid layouts (${attempts} attempts)`);
  return layouts;
}

function findGridPosition(width, height, canvasSize, existingPlacements, gridStepSize) {
  // Create grid points
  const gridXPoints = [];
  const gridYPoints = [];

  for (let x = 0; x <= canvasSize.width - width; x += gridStepSize) {
    gridXPoints.push(x);
  }

  for (let y = 0; y <= canvasSize.height - height; y += gridStepSize) {
    gridYPoints.push(y);
  }

  // Shuffle grid points for randomness
  shuffleArray(gridXPoints);
  shuffleArray(gridYPoints);

  // Try grid positions
  for (const x of gridXPoints) {
    for (const y of gridYPoints) {
      // Check if position is valid (no overlap with existing)
      const hasOverlap = existingPlacements.some(existing =>
        checkOverlap(x, y, width, height, existing.x, existing.y, existing.width, existing.height)
      );

      if (!hasOverlap) {
        return { x: Math.round(x), y: Math.round(y) };
      }
    }
  }

  return null; // No valid position found
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function createSyntheticImageWithVariation(elements, layout, canvasSize, backgroundColor, rotation, scale) {
  try {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const labels = [];

    // Place each element according to layout
    for (let i = 0; i < layout.length; i++) {
      const placement = layout[i];
      const element = elements[placement.elementIndex];

      // Load element image
      const img = await loadImage(element.image);

      // Apply transformations
      ctx.save();

      // Translate to center of placement
      const centerX = placement.x + placement.width / 2;
      const centerY = placement.y + placement.height / 2;
      ctx.translate(centerX, centerY);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply scale
      const finalWidth = placement.width * scale;
      const finalHeight = placement.height * scale;

      // Draw image
      ctx.drawImage(img, -finalWidth / 2, -finalHeight / 2, finalWidth, finalHeight);

      ctx.restore();

      // Generate YOLO label (using final transformed dimensions)
      const labelCenterX = centerX / canvasSize.width;
      const labelCenterY = centerY / canvasSize.height;
      const labelWidth = finalWidth / canvasSize.width;
      const labelHeight = finalHeight / canvasSize.height;

      const label = `${element.classId} ${labelCenterX.toFixed(6)} ${labelCenterY.toFixed(6)} ${labelWidth.toFixed(6)} ${labelHeight.toFixed(6)}`;
      labels.push(label);
    }

    // Convert canvas to image
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const labelText = labels.join('\n');
    const timestamp = Date.now();
    const filename = `synthetic_${canvasSize.name}_${backgroundColor.replace('#', '')}_r${rotation}_s${scale.toFixed(1)}_${timestamp}`;

    return {
      imageDataUrl,
      labelText,
      filename
    };

  } catch (error) {
    console.error('❌ Error creating synthetic image:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

// Export for use in service worker
if (typeof self !== 'undefined' && self.importScripts) {
  // Service worker context
  self.BatchProcessor = {
    processCropBatch,
    processCropBatchWithVariations,
    createSyntheticImage,
    CANVAS_SIZES,
    BACKGROUND_COLORS
  };
} else {
  // Regular window context
  window.BatchProcessor = {
    processCropBatch,
    processCropBatchWithVariations,
    createSyntheticImage,
    CANVAS_SIZES,
    BACKGROUND_COLORS
  };
}

console.log("✅ batch_processor.js loaded successfully");
