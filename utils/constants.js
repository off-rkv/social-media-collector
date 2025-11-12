// ==================================================================================================
// Constants.js - Configuration for Social Media Data Collector
// ==================================================================================================

const DEFAULT_SETTINGS = {
  scrollSpeed: 35, //pixels to scroll per steps (CSS pixels)
  scrollDelay: 200, //milliseconds
  maxNoChangeScrolls: 10, // stop if no new content after x scrolls

  // Visual feedback
  highlightEnabled: true, // Show green boxes on captured elements?
  highlightDuration: 500, // How long to show highlight (milliseconds)
  highlightColor: "#00ff00", // Green color for highlight
  highlightOpacity: 0.3, // 30% transparency

  // Safe zone (avoid sticky headers)
  safeZoneTop: 60, // Pixels from top (CSS pixels)
  safeZoneBottom: 0, // Pixels from bottom

  // Browser identification
  defaultBrowserId: "b1", // Default browser ID for filename

  // Collection targets
  targetSamplesPure: 700, // Target for pure (non-augmented) samples
  targetSamplesAugmented: 300, // Target for augmented samples
  targetSamplesTotal: 1000, // Total per platform

  // Augmentation (will be configured later)
  augmentationFilters: ["brightness(1.2)", "contrast(1.15)", "saturate(1.1)"],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: PLATFORM NAMES
// ═══════════════════════════════════════════════════════════════════════════════

const PLATFORMS = {
  TWITTER: "twitter",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
};

const PLATFORM_URLS = {
  twitter: ["twitter.com", "x.com"],
  instagram: ["instagram.com"],
  facebook: ["facebook.com"],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: COLLECTION PHASES
// ═══════════════════════════════════════════════════════════════════════════════

const COLLECTION_PHASES = {
  PURE: "pure", // No augmentation
  AUGMENTED: "augmented", // With CSS filters
};

const FEED_TYPES = {
  MAIN_FEED: "feed", // Main timeline/feed
  PROFILE: "profile", // User profile page
  COMMENTS: "comments", // Comment section
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: FILE NAMING RULES
// ═══════════════════════════════════════════════════════════════════════════════

const FILENAME_RULES = {
  timestampFormat: "YYYYMMDDHHMMSSmmm", // 17 digits
  counterDigits: 4, // 0001-9999
  randomLength: 5, // 5 random alphanumeric chars
  imageExtension: "jpg", // Image file extension
  labelExtension: "txt", // Label file extension
  separator: "_", // Separator between components
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: VALIDATION RULES
// ═══════════════════════════════════════════════════════════════════════════════

const VALIDATION_RULES = {
  minCoordinate: 0.0, // Minimum valid coordinate (YOLO format)
  maxCoordinate: 1.0, // Maximum valid coordinate (YOLO format)
  minClassId: 0, // Minimum class ID
  maxClassId: 300, // Maximum class ID (increased for platform-specific)
  minElementsPerSample: 1, // Minimum elements in a sample
  maxElementsPerSample: 50, // Maximum elements in a sample (sanity check)
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: EXPORT ALL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// For Chrome extension (browser environment)
if (typeof window !== "undefined") {
  window.CONSTANTS = {
    DEFAULT_SETTINGS,
    PLATFORMS,
    PLATFORM_URLS,
    COLLECTION_PHASES,
    FEED_TYPES,
    FILENAME_RULES,
    VALIDATION_RULES,
  };

  console.log("✅ constants.js loaded successfully");
  console.log("📦 CONSTANTS available:", typeof window.CONSTANTS);
}

// For Node.js (Python scripts might use this)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    PLATFORMS,
    PLATFORM_URLS,
    COLLECTION_PHASES,
    FEED_TYPES,
    FILENAME_RULES,
    VALIDATION_RULES,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// END OF CONSTANTS.JS
// ═══════════════════════════════════════════════════════════════════════════════
