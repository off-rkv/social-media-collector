# 🎯 Element Cropper - Synthetic Data Generation

## Overview

The **Element Cropper** is a powerful feature that allows you to manually select and crop UI elements with pixel-perfect accuracy, then automatically generate synthetic training images with YOLO labels.

## 🎨 Two Modes Available

| Mode | Purpose | Usage |
|------|---------|-------|
| **Zone Scanner** | Automated bulk collection | Collect 10k samples from social media |
| **Element Cropper** | Manual precision cropping | Create synthetic datasets with perfect control |

---

## 🚀 Quick Start

### 1. Activate Element Cropper

**Method A: From Console (Temporary)**
```javascript
chrome.runtime.sendMessage({action: "ACTIVATE_CROPPER"})
```

**Method B: Add UI Button (Permanent)**
- Coming soon - will add toggle button to popup

### 2. Use the Cropper

Once activated, you'll see:
- ✅ Green UI panel (top-right corner)
- ✅ Crosshair cursor
- ✅ Instructions

### 3. Crop Elements

**Auto-Crop (Click):**
1. Hover over any element
2. See green highlight box
3. Single click to auto-crop
4. Element captured with perfect bounds!

**Manual Crop (Drag):**
1. Click and hold
2. Drag to select area
3. See red dashed selection box
4. Release to crop
5. Area captured with exact coordinates!

### 4. Process Batch

- Collect 3 elements (automatic batch)
- Or click "Process Batch" button
- Synthetic images auto-generated
- Files downloaded to `synthetic_data/` folder

### 5. Exit Cropper

Click "Exit Cropper" button or run:
```javascript
chrome.runtime.sendMessage({action: "DEACTIVATE_CROPPER"})
```

---

## 📐 How It Works

### Coordinate Tracking

```
Element at screen position: (123px, 456px)
Element size: 40px × 40px

Tracked Data:
├─ CSS Pixels:     123, 456, 40, 40
├─ Display Pixels: 246, 912, 80, 80  (2x DPR)
└─ YOLO Label:     0 0.123 0.456 0.04 0.04  (normalized)
```

**Perfect accuracy guaranteed!** ✅

### Batch Processing

```
Step 1: Collect 3 Elements
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Button  │  │  Icon   │  │  Text   │
└─────────┘  └─────────┘  └─────────┘

Step 2: Place on Canvas (1920×1080)
┌──────────────────────────────────┐
│                                   │
│  ┌─────┐         ┌──┐            │
│  │Btn  │         │IC│            │
│  └─────┘         └──┘            │
│                                   │
│                         ┌──────┐ │
│                         │ Text │ │
│                         └──────┘ │
│                                   │
└──────────────────────────────────┘

Step 3: Generate YOLO Label
0 0.234 0.345 0.05 0.04
1 0.567 0.234 0.03 0.03
2 0.789 0.678 0.08 0.05

Step 4: Download Files
✅ synthetic_1234567890_3elem.jpg
✅ synthetic_1234567890_3elem.txt
```

### Collision Detection

The system ensures **no overlap** between elements:

```
❌ BEFORE (Overlap):
┌─────────┐
│ Elem 1  │
│    ┌────┼───┐
│    │ O  │   │
└────┼────┘   │
     │ Elem 2 │
     └────────┘

✅ AFTER (No Overlap):
┌─────────┐       ┌────────┐
│ Elem 1  │       │ Elem 2 │
└─────────┘       └────────┘

Minimum spacing: 20px guaranteed
```

### Boundary Checking

Elements **always stay within canvas**:

```
❌ BEFORE (Out of bounds):
┌─────────────┐
│ Canvas      │
│         ┌───┼──┐
│         │Ele│  │ ← Clipped!
└─────────┼───┘  │
          └──────┘

✅ AFTER (Fully inside):
┌─────────────┐
│ Canvas  ┌──┐│
│         │El││
│         └──┘│
└─────────────┘
```

### Smart Scaling

Elements are scaled if too large:

```
Original: 800px × 600px
Canvas:   1920px × 1080px
Max size: 30% of canvas = 576px × 324px

Scaled:   512px × 384px ✅
(maintains aspect ratio, no blur)
```

---

## 🎨 Supported Canvas Sizes

| Name | Resolution | Aspect Ratio | Use Case |
|------|------------|--------------|----------|
| FHD | 1920×1080 | 16:9 | Desktop, laptop screens |
| HD | 1280×720 | 16:9 | Smaller displays |
| 2K | 2560×1440 | 16:9 | High-res displays |
| Square | 640×640 | 1:1 | Mobile, square crops |

---

## 🎨 Background Colors

- `#000000` - Pure black (dark theme)
- `#1a1a1a` - Dark gray
- `#FFFFFF` - Pure white (light theme)
- `#f5f5f5` - Light gray
- `#0d1117` - GitHub dark mode
- More colors configurable in `batch_processor.js`

---

## 📊 Output Format

### Image File
```
synthetic_1234567890_3elem.jpg
├─ Format: JPEG
├─ Quality: 95%
├─ Size: 1920×1080 (or selected canvas)
└─ Contains: 3 cropped elements placed smartly
```

### Label File (YOLO Format)
```
synthetic_1234567890_3elem.txt
├─ Format: Plain text
├─ Lines: One per element
└─ Format: classId x_center y_center width height
```

**Example:**
```
0 0.456789 0.234567 0.045678 0.034567
1 0.789012 0.456789 0.023456 0.023456
2 0.123456 0.789012 0.087654 0.045678
```

---

## ⚙️ Configuration

### Adjust Settings

Edit `background/batch_processor.js`:

```javascript
// Maximum element size (30% of canvas)
const MAX_ELEMENT_SCALE = 0.3;

// Minimum spacing between elements
const MIN_SPACING = 20;

// Maximum attempts to find valid position
const MAX_PLACEMENT_ATTEMPTS = 100;
```

### Add Custom Canvas Size

```javascript
const CANVAS_SIZES = [
  { width: 1920, height: 1080, name: 'FHD' },
  { width: 3840, height: 2160, name: '4K' }, // ← Add this
];
```

### Add Custom Background

```javascript
const BACKGROUND_COLORS = [
  '#000000', // Black
  '#0a0a0a', // ← Add custom dark color
];
```

---

## 🔧 Advanced Usage

### Programmatic Batch Processing

```javascript
// Send custom batch for processing
chrome.runtime.sendMessage({
  action: 'PROCESS_CROP_BATCH',
  elements: [
    {
      image: '<base64_data_url>',
      classId: 0,
      bbox: { x: 10, y: 20, width: 100, height: 50, ... }
    },
    {
      image: '<base64_data_url>',
      classId: 1,
      bbox: { x: 150, y: 80, width: 80, height: 80, ... }
    },
    {
      image: '<base64_data_url>',
      classId: 2,
      bbox: { x: 300, y: 200, width: 120, height: 60, ... }
    }
  ],
  batchSize: 3,
  canvasSize: { width: 1920, height: 1080 },
  backgroundColor: '#000000',
  augment: true
}, (response) => {
  console.log('✅ Created', response.imagesCreated, 'synthetic images');
});
```

### Disable Augmentation

```javascript
chrome.runtime.sendMessage({
  action: 'PROCESS_CROP_BATCH',
  elements: [...],
  augment: false  // ← No brightness/contrast changes
});
```

---

## 🎯 Use Cases

### 1. Button Dataset
```
Crop 50 different buttons
↓
Generate 500 synthetic images (50 buttons × 10 variations)
↓
Train YOLO to detect buttons
```

### 2. Icon Recognition
```
Crop social media icons (like, comment, share)
↓
Place 3 per image on various backgrounds
↓
Train model to recognize icons anywhere
```

### 3. UI Element Detection
```
Crop: textboxes, dropdowns, checkboxes
↓
Generate synthetic forms
↓
Train model for UI automation
```

### 4. Multi-Platform Training
```
Crop elements from Twitter, Instagram, Facebook
↓
Mix them in synthetic images
↓
Train unified cross-platform model
```

---

## 📈 Benefits vs. Manual Cropping

| Aspect | Manual Cropping | Element Cropper |
|--------|-----------------|-----------------|
| **Coordinate Accuracy** | Approximate | Pixel-perfect ✅ |
| **Batch Processing** | One at a time | 3 per image ✅ |
| **Overlap Checking** | Manual | Automatic ✅ |
| **Boundary Checking** | Manual | Automatic ✅ |
| **YOLO Label Generation** | Manual calculation | Automatic ✅ |
| **Augmentation** | External tool | Built-in ✅ |
| **Time for 1000 samples** | ~5 hours | ~30 minutes ✅ |

---

## 🐛 Troubleshooting

### Cropper Not Activating

**Check console for errors:**
```javascript
// Make sure scripts are loaded
console.log(typeof window.cropperActive); // Should not be 'undefined'
```

### Elements Not Being Captured

**Verify element is visible:**
- Not covered by overlay
- Not outside viewport
- Not transparent (opacity > 0)

### Batch Not Processing

**Check console:**
```javascript
// Look for error messages
chrome.runtime.sendMessage({action: "PROCESS_CROP_BATCH", ...})
```

### Downloads Not Working

**Check permissions:**
- Extension has "downloads" permission ✅
- Check Chrome downloads folder

---

## 🔮 Future Enhancements

- [ ] Dual-tab UI in popup (Zone Scanner | Element Cropper)
- [ ] Keyboard shortcuts (Esc to cancel, Enter to capture)
- [ ] Undo/redo cropping
- [ ] Preview before processing
- [ ] Adjust classId per element
- [ ] Export to different formats (COCO, Pascal VOC)
- [ ] Cloud sync for datasets
- [ ] Collaborative cropping (team mode)

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `content/cropper.js` | Element selection & cropping UI |
| `background/batch_processor.js` | Synthetic image generation |
| `background/service_worker.js` | Message handling & downloads |
| `manifest.json` | Extension configuration |

---

## ✅ Summary

**Element Cropper gives you:**
1. ✅ Pixel-perfect coordinate tracking
2. ✅ Smart batch processing (3 elements per image)
3. ✅ Automatic collision detection
4. ✅ Boundary checking
5. ✅ Intelligent scaling
6. ✅ YOLO label generation
7. ✅ Built-in augmentation
8. ✅ Multiple canvas sizes
9. ✅ Custom backgrounds
10. ✅ Automated downloads

**Result:** High-quality synthetic training datasets in minutes instead of hours!

🎉 **Happy cropping!**
