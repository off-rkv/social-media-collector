// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTOR.JS - Main Collection Engine
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Orchestrates the entire data collection process:
//   1. Find elements using test IDs
//   2. Filter elements by capture zone
//   3. Calculate bounding boxes
//   4. Show visual highlights (if enabled)
//   5. Capture screenshot
//   6. Generate YOLO annotations
//   7. Download files
//   8. Update progress
//   9. Save state
//   10. Scroll and repeat
//
// THIS IS THE MAIN WORKER - Everything happens here!
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════════════════

let isCollecting = false;
let collectionConfig = null;
let collectionSettings = null;
let collectionZone = null;
let currentPlatform = null;

// Counters
let samplesCollected = 0;
let pureCount = 0;
let augmentedCount = 0;
let unchangedScrollCount = 0;

// Targets
const TARGET_PURE = 700;
const TARGET_AUGMENTED = 300;
const TARGET_TOTAL = 1000;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: MESSAGE LISTENER (from popup via service worker)
// ═══════════════════════════════════════════════════════════════════════════════

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 collector.js received message:", message.action);

  // ─────────────────────────────────────────────────────────────────────────────
  // START COLLECTION
  // ─────────────────────────────────────────────────────────────────────────────
  if (message.action === "START_COLLECTION") {
    console.log("📨 Received START_COLLECTION message");
    console.log("📋 Platform:", message.platform);
    console.log("📋 Zone:", message.zone);
    console.log("📋 Config:", message.config);
    console.log("📋 Settings:", message.settings);

    // Store configuration
    collectionConfig = message.config;
    collectionSettings = message.settings;
    collectionZone = message.zone;
    currentPlatform = message.platform;

    console.log("✅ Configuration stored");

    // Start collection
    console.log("🚀 Calling startCollection()...");
    startCollection()
      .then(() => {
        console.log("✅ startCollection() completed successfully");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("❌ startCollection() error:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STOP COLLECTION
  // ─────────────────────────────────────────────────────────────────────────────
  if (message.action === "STOP_COLLECTION") {
    console.log("📨 Received STOP_COLLECTION message");

    stopCollection();
    sendResponse({ success: true });
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAUSE COLLECTION
  // ─────────────────────────────────────────────────────────────────────────────
  if (message.action === "PAUSE_COLLECTION") {
    console.log("📨 Received PAUSE_COLLECTION message");

    isCollecting = false;
    sendResponse({ success: true });
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESUME COLLECTION
  // ─────────────────────────────────────────────────────────────────────────────
  if (message.action === "RESUME_COLLECTION") {
    console.log("📨 Received RESUME_COLLECTION message");

    // Load saved state
    const state = message.state;
    samplesCollected = state.samplesCollected || 0;
    pureCount = state.pureCount || 0;
    augmentedCount = state.augmentedCount || 0;

    // Resume collection
    isCollecting = true;
    collectionLoop();

    sendResponse({ success: true });
    return true;
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: START COLLECTION
// ═══════════════════════════════════════════════════════════════════════════════

async function startCollection() {
  console.log("▶️ Starting collection...");
  console.log("Platform:", currentPlatform);
  console.log("Zone:", collectionZone);
  console.log("Config:", collectionConfig);
  console.log("Settings:", collectionSettings);

  // ═══ RESET STATE on start ═══
  samplesCollected = 0;
  pureCount = 0;
  augmentedCount = 0;
  unchangedScrollCount = 0;
  console.log("✅ Counters reset to 0");
  // ═══ END RESET ═══

  // ═══ Clean up old visuals ═══
  if (window.VisualFeedback) {
    console.log("🧹 Cleaning up old visuals...");
    window.VisualFeedback.cleanupVisuals();
  }
  await window.CollectorHelpers.sleep(100);
  // ═══ END CLEANUP ═══

  // Show zone border
  if (collectionZone && window.VisualFeedback) {
    console.log("📍 Showing zone border...");
    window.VisualFeedback.showZoneBorder(collectionZone);
    console.log("✅ Zone border shown");
  } else {
    console.error("❌ Missing zone or VisualFeedback!");
  }

  // ═══ CRITICAL FIX: Start the collection loop! ═══
  isCollecting = true;
  console.log("✅ isCollecting set to TRUE");

  // Save initial state
  await saveState();
  console.log("✅ Initial state saved");

  // Start the collection loop
  console.log("🚀 Starting collection loop...");
  collectionLoop();
  console.log("✅ Collection loop started!");
  // ═══ END FIX ═══
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: COLLECTION LOOP (THE HEART!)
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// FIXED COLLECTION LOOP - Replace in collector.js starting at line ~155
// ═══════════════════════════════════════════════════════════════════════════════

async function collectionLoop() {
  console.log("🔄 Collection loop started");
  console.log("Platform:", currentPlatform);
  console.log("Zone:", collectionZone);
  console.log("Config:", collectionConfig);
  console.log("Settings:", collectionSettings);

  // Validate configuration
  if (!collectionConfig || !collectionZone || !collectionSettings) {
    console.error("❌ Missing required configuration!");
    stopCollection();
    return;
  }

  let emptyLoopCount = 0;
  let unchangedScrollCount = 0;
  const MAX_EMPTY_LOOPS = 10;

  while (isCollecting && samplesCollected < TARGET_TOTAL) {
    try {
      // ═══════════════════════════════════════════════════════════════════════
      // STEP 1: Find TWEET CONTAINERS
      // ═══════════════════════════════════════════════════════════════════════
      const tweetContainers = document.querySelectorAll('[data-testid="tweet"]');
      
      if (tweetContainers.length === 0) {
        emptyLoopCount++;
        console.log(`⚠️ No tweets found (${emptyLoopCount}/${MAX_EMPTY_LOOPS})`);
        
        if (emptyLoopCount >= MAX_EMPTY_LOOPS) {
          console.error("❌ No tweets after max attempts");
          await completeCollection();
          break;
        }
        
        window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
        await window.CollectorHelpers.sleep(1000);
        continue;
      }

      console.log(`📦 Found ${tweetContainers.length} tweets`);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 2: Find ALL tweets in zone (not just one!)
      // ═══════════════════════════════════════════════════════════════════════
      const targetContainers = [];

      for (const container of tweetContainers) {
        const rect = container.getBoundingClientRect();
        const containerMiddle = rect.top + (rect.height / 2);

        // Any part of tweet overlaps with zone
        const overlapsZone =
          rect.bottom > collectionZone.top &&
          rect.top < collectionZone.bottom &&
          rect.right > collectionZone.left &&
          rect.left < collectionZone.right;

        if (overlapsZone) {
          targetContainers.push(container);
          console.log(`✅ Tweet in zone (top: ${Math.round(rect.top)}, bottom: ${Math.round(rect.bottom)})`);
        }
      }

      if (targetContainers.length === 0) {
        console.log("⚠️ No tweets in zone, scrolling...");
        window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
        await window.CollectorHelpers.sleep(200);
        continue;
      }

      console.log(`🎯 Processing ${targetContainers.length} tweet(s) in zone`);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 3: Find ALL elements in ALL tweets in zone
      // ═══════════════════════════════════════════════════════════════════════
      const foundElements = [];

      // Process each tweet container in zone
      for (const targetContainer of targetContainers) {
        // Add container itself first
        if (collectionConfig.twitter_tweet_container) {
          if (window.CollectorHelpers.isElementInZone(targetContainer, collectionZone)) {
            foundElements.push({
              element: targetContainer,
              type: 'twitter_tweet_container',
              classId: collectionConfig.twitter_tweet_container.classId
            });
            console.log('✅ Container added (classId: 0)');
          }
        }

        // Find all other elements within this tweet
        for (const [elementType, elementConfig] of Object.entries(collectionConfig)) {
          if (elementType === 'twitter_tweet_container') continue;

          const selector = elementConfig.selector;
          const fallbackSelectors = elementConfig.fallbackSelectors || [];

          // Try primary
          let elements = targetContainer.querySelectorAll(selector);

          // Try fallbacks if needed
          if (elements.length === 0 && fallbackSelectors.length > 0) {
            for (const fallback of fallbackSelectors) {
              elements = targetContainer.querySelectorAll(fallback);
              if (elements.length > 0) {
                break;
              }
            }
          }

          // Add elements to list
          for (const elem of elements) {
            // ═══ SPECIAL HANDLING for profile pictures ═══
            // Profile pics might be partially outside zone, so be lenient
            const isProfilePic = elementType === 'twitter_profile_picture';

            // Skip visibility check for profile pics - they have their own overlap check
            if (!isProfilePic) {
              const isVisible = window.CollectorHelpers.isElementVisible(elem);
              if (!isVisible) {
                continue;
              }
            }

            // For profile pics, only check if it overlaps with zone (not fully inside)
            if (isProfilePic) {
              const rect = elem.getBoundingClientRect();

              // Basic dimension check
              if (rect.width === 0 || rect.height === 0) {
                console.log(`⚠️ ${elementType} has zero dimensions`);
                continue;
              }

              const overlapsZone =
                rect.bottom > collectionZone.top &&
                rect.top < collectionZone.bottom &&
                rect.right > collectionZone.left &&
                rect.left < collectionZone.right;

              if (overlapsZone) {
                foundElements.push({
                  element: elem,
                  type: elementType,
                  classId: elementConfig.classId
                });
                console.log(`✅ ${elementType} (classId: ${elementConfig.classId}) [overlap]`);
              } else {
                console.log(`⚠️ ${elementType} outside zone (left: ${Math.round(rect.left)}, zone.left: ${collectionZone.left})`);
              }
            } else {
              // For other elements, check if fully in zone
              if (window.CollectorHelpers.isElementInZone(elem, collectionZone)) {
                foundElements.push({
                  element: elem,
                  type: elementType,
                  classId: elementConfig.classId
                });
                console.log(`✅ ${elementType} (classId: ${elementConfig.classId})`);
              }
            }
          }
        }
      }

      if (foundElements.length === 0) {
        console.log("⚠️ No elements in tweet");
        window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
        await window.CollectorHelpers.sleep(200);
        continue;
      }

      emptyLoopCount = 0;
      unchangedScrollCount = 0;
      
      console.log(`✅ Total elements: ${foundElements.length}`);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 4: Calculate bounding boxes
      // ═══════════════════════════════════════════════════════════════════════
      const annotations = [];
      const highlightElements = [];

      for (const item of foundElements) {
        const bbox = window.CollectorHelpers.convertBboxToYOLO(item.element);

        if (bbox) {
          annotations.push({
            classId: item.classId,
            bbox: bbox,
          });

          highlightElements.push(item.element);
        }
      }

      if (annotations.length === 0) {
        console.log("⚠️ No valid boxes");
        window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
        await window.CollectorHelpers.sleep(200);
        continue;
      }

      console.log(`✅ ${annotations.length} annotations`);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 5: Show highlights (if enabled)
      // ═══════════════════════════════════════════════════════════════════════
      if (collectionSettings.highlightEnabled && window.VisualFeedback) {
        console.log("💚 Showing highlights on", highlightElements.length, "elements");
        window.VisualFeedback.showMultipleHighlights(highlightElements, 500);

        // WAIT for highlights to disappear
        await window.CollectorHelpers.sleep(600);
        console.log("✅ Highlights finished");
      }

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 6: HIDE zone border before screenshot
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📸 Preparing to capture screenshot...");
      if (window.VisualFeedback) {
        window.VisualFeedback.hideZoneBorder();
        console.log("✅ Zone border hidden");
      }

      await window.CollectorHelpers.sleep(100);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 7: Capture screenshot
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📸 Calling captureScreenshotViaBackground()...");
      const screenshot = await captureScreenshotViaBackground();

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 8: RESTORE zone border
      // ═══════════════════════════════════════════════════════════════════════
      if (window.VisualFeedback) {
        window.VisualFeedback.showZoneBorder(collectionZone);
        console.log("✅ Zone border restored");
      }

      if (!screenshot) {
        console.error("❌ Screenshot capture FAILED!");
        console.error("   This usually means background service worker error");
        console.error("   Scrolling to next tweet and retrying...");

        // ═══ CRITICAL: SCROLL even on error! ═══
        window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
        await window.CollectorHelpers.sleep(500);
        continue;
      }

      console.log("✅ Screenshot captured successfully!");

      // ═══════════════════════════════════════════════════════════════════════
      // VERIFY: Check screenshot dimensions match normalization
      // ═══════════════════════════════════════════════════════════════════════
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = () => {
          const dpr = window.devicePixelRatio || 1.0;
          const expectedWidth = window.innerWidth * dpr;
          const expectedHeight = window.innerHeight * dpr;

          console.log("📐 Screenshot dimensions verification:");
          console.log(`   Expected: ${expectedWidth} x ${expectedHeight}`);
          console.log(`   Actual: ${img.width} x ${img.height}`);

          if (Math.abs(img.width - expectedWidth) > 1 || Math.abs(img.height - expectedHeight) > 1) {
            console.warn("⚠️ DIMENSION MISMATCH! YOLO labels may be inaccurate!");
            console.warn(`   Difference: ${img.width - expectedWidth} x ${img.height - expectedHeight} pixels`);
          } else {
            console.log("✅ Dimensions match (within 1px tolerance)");
          }
          resolve();
        };
        img.src = screenshot;
      });
      console.log("   Screenshot size:", screenshot.length, "characters");

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 9: Generate annotation file
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📝 Generating YOLO annotations...");
      const annotationText = window.CollectorHelpers.generateAnnotation(annotations);
      console.log("✅ Annotation text generated:");
      console.log(annotationText);

      const annotationDataUrl = await window.CollectorHelpers.annotationToDataUrl(annotationText);
      console.log("✅ Annotation converted to data URL");

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 10: Save files
      // ═══════════════════════════════════════════════════════════════════════
      const baseFilename = window.CollectorHelpers.generateFilename(
        currentPlatform,
        samplesCollected + 1 // Use next number for filename
      );

      const imageFilename = baseFilename + ".jpg";
      const labelFilename = baseFilename + ".txt";

      console.log("💾 Downloading files:");
      console.log("   Image:", imageFilename);
      console.log("   Label:", labelFilename);

      const downloadResult = await downloadFiles(screenshot, annotationDataUrl, imageFilename, labelFilename);

      if (!downloadResult || !downloadResult.success) {
        console.error("❌ File download FAILED!");
        console.error("   Result:", downloadResult);
        console.error("   Skipping this sample and moving to next tweet...");

        // ═══ DON'T increment counter on download failure ═══
        window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
        await window.CollectorHelpers.sleep(500);
        continue;
      }

      // ═══ SUCCESS: Now increment counters ═══
      samplesCollected++;

      if (pureCount < TARGET_PURE) {
        pureCount++;
      } else {
        augmentedCount++;
      }

      console.log("✅ Files downloaded successfully!");
      console.log("📊 Current progress:");
      console.log("   Samples:", samplesCollected);
      console.log("   Pure:", pureCount);
      console.log("   Augmented:", augmentedCount);

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 11: Update progress
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📤 Sending progress update to popup...");
      await updateProgress();
      await saveState();
      console.log("✅ Progress saved");

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 12: Scroll to next tweet
      // ═══════════════════════════════════════════════════════════════════════
      console.log("📜 Scrolling to next tweet...");
      const scrollResult = window.CollectorHelpers.scroll(collectionSettings.scrollDirection, 35);
      console.log("✅ Scrolled:", scrollResult.scrolled ? "YES" : "NO", "- Position:", scrollResult.position);

      await window.CollectorHelpers.sleep(200);
      console.log("✅ Sample #" + samplesCollected + " complete! Moving to next...\n");
      
    } catch (error) {
      console.error("❌ Loop error:", error);
      await window.CollectorHelpers.sleep(1000);
    }
  }

  // Collection complete
  if (samplesCollected >= TARGET_TOTAL) {
    console.log("🎉 Complete!");
    await completeCollection();
  }
}

/**
 * Wait for tweet container to be fully visible in zone
 */
async function waitForContainerInZone(container, zone, maxWait = 2000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const rect = container.getBoundingClientRect();
    
    // Check if top half of container is in zone
    const containerMiddle = rect.top + (rect.height / 2);
    
    if (rect.top >= zone.top && containerMiddle <= zone.bottom) {
      return true; // Container is properly in view
    }
    
    await window.CollectorHelpers.sleep(50);
  }
  
  return false; // Timeout
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: FIND ELEMENTS (Updated for role+aria-label support)
// ═══════════════════════════════════════════════════════════════════════════════

function findElements(config) {
  const foundElements = [];

  // Loop through each element type in config
  for (const [elementType, elementConfig] of Object.entries(config)) {
    try {
      const primarySelector = elementConfig.selector;
      const fallbackSelector = elementConfig.fallback;
      const classId = elementConfig.classId;

      let elements = [];

      // ─────────────────────────────────────────────────────────────────────────
      // TRY PRIMARY SELECTOR FIRST
      // ─────────────────────────────────────────────────────────────────────────
      try {
        const primaryElements = document.querySelectorAll(primarySelector);
        if (primaryElements.length > 0) {
          elements = Array.from(primaryElements);
          console.log(
            `✅ Found ${elements.length} ${elementType} using PRIMARY selector`
          );
        }
      } catch (error) {
        console.warn(`⚠️ Primary selector failed for ${elementType}:`, error);
      }

      // ─────────────────────────────────────────────────────────────────────────
      // IF PRIMARY FAILS, TRY FALLBACK SELECTOR
      // ─────────────────────────────────────────────────────────────────────────
      if (elements.length === 0 && fallbackSelector) {
        try {
          const fallbackElements = document.querySelectorAll(fallbackSelector);
          if (fallbackElements.length > 0) {
            elements = Array.from(fallbackElements);
            console.log(
              `✅ Found ${elements.length} ${elementType} using FALLBACK selector`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ Fallback selector failed for ${elementType}:`,
            error
          );
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // IF STILL NO ELEMENTS, TRY SMART DETECTION (role + aria-label)
      // ─────────────────────────────────────────────────────────────────────────
      if (elements.length === 0) {
        elements = findByRoleAndLabel(elementType);
        if (elements.length > 0) {
          console.log(
            `✅ Found ${elements.length} ${elementType} using SMART detection`
          );
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // FILTER: Only elements in zone and visible
      // ─────────────────────────────────────────────────────────────────────────
      for (let element of elements) {
        // ─────────────────────────────────────────────────────────────────────────
        // IMPORTANT: If element is SVG, get the clickable parent (button/div)
        // Instagram/Threads/Facebook use SVG icons inside buttons
        // ─────────────────────────────────────────────────────────────────────────
        if (element.tagName === "svg" || element.tagName === "SVG") {
          const clickableParent =
            element.closest("button") ||
            element.closest('[role="button"]') ||
            element.closest('div[role="button"]') ||
            element.closest("a");

          if (clickableParent) {
            element = clickableParent;
            console.log(
              `✅ Found SVG parent for ${elementType}: ${element.tagName}`
            );
          }
        }

        // Filter by zone and visibility
        if (
          window.CollectorHelpers.isElementInZone(element, collectionZone) &&
          window.CollectorHelpers.isElementVisible(element)
        ) {
          foundElements.push({
            element: element,
            type: elementType,
            classId: classId,
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error finding ${elementType}:`, error);
    }
  }

  return foundElements;
}

/**
 * Smart detection: Find elements by role and aria-label
 * Used as last resort when both primary and fallback selectors fail
 */
function findByRoleAndLabel(elementType) {
  const results = [];

  // Mapping of element types to aria-label keywords
  const labelKeywords = {
    like_button: ["Like", "like"],
    comment_button: ["Comment", "Reply", "reply"],
    repost_button: ["Repost", "Retweet", "retweet"],
    share_button: ["Share", "share"],
    bookmark_button: ["Save", "Bookmark", "bookmark"],
  };

  const keywords = labelKeywords[elementType];
  if (!keywords) return results;

  // Find all buttons and links with role
  const candidates = document.querySelectorAll(
    '[role="button"], [role="link"], button, a'
  );

  for (const candidate of candidates) {
    // Check aria-label
    const ariaLabel = candidate.getAttribute("aria-label");
    if (ariaLabel) {
      for (const keyword of keywords) {
        if (ariaLabel.includes(keyword)) {
          results.push(candidate);
          break;
        }
      }
      continue;
    }

    // Check SVG title inside element
    const svg = candidate.querySelector("svg");
    if (svg) {
      const title = svg.querySelector("title");
      if (title) {
        const titleText = title.textContent;
        for (const keyword of keywords) {
          if (titleText.includes(keyword)) {
            results.push(candidate);
            break;
          }
        }
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: SCREENSHOT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════════

async function captureScreenshotViaBackground() {
  return new Promise((resolve) => {
    console.log("📤 Sending CAPTURE_SCREENSHOT message to background...");
    chrome.runtime.sendMessage(
      {
        action: "CAPTURE_SCREENSHOT",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Screenshot message error:", chrome.runtime.lastError);
          resolve(null);
          return;
        }

        console.log("📨 Screenshot response received");
        console.log("   Response type:", typeof response);
        console.log("   Response keys:", response ? Object.keys(response) : "null");
        console.log("   Response.success:", response?.success);
        console.log("   Response.dataUrl exists:", !!response?.dataUrl);
        console.log("   Response.dataUrl type:", typeof response?.dataUrl);
        console.log("   Response.dataUrl length:", response?.dataUrl?.length);

        if (response && response.dataUrl) {
          console.log("✅ Screenshot dataUrl present, length:", response.dataUrl.length);
          resolve(response.dataUrl);
        } else {
          console.error("❌ Screenshot response missing dataUrl");
          console.error("   Full response:", JSON.stringify(response));
          resolve(null);
        }
      }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: FILE DOWNLOAD
// ═══════════════════════════════════════════════════════════════════════════════

async function downloadFiles(
  imageDataUrl,
  labelDataUrl,
  imageFilename,
  labelFilename
) {
  return new Promise((resolve) => {
    console.log("📤 Sending DOWNLOAD_FILES message to background...");
    chrome.runtime.sendMessage(
      {
        action: "DOWNLOAD_FILES",
        imageDataUrl: imageDataUrl,
        labelDataUrl: labelDataUrl,
        imageFilename: imageFilename,
        labelFilename: labelFilename,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Download error:", chrome.runtime.lastError);
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }

        console.log("📨 Download response:", response);
        resolve(response);
      }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: PROGRESS UPDATE
// ═══════════════════════════════════════════════════════════════════════════════

async function updateProgress() {
  chrome.runtime.sendMessage({
    action: "UPDATE_PROGRESS",
    data: {
      platform: currentPlatform,
      samplesCollected: samplesCollected,
      pureCount: pureCount,
      augmentedCount: augmentedCount,
      scrollPosition: window.scrollY,
      timestamp: Date.now(),
      isActive: isCollecting,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

async function saveState() {
  await chrome.storage.local.set({
    collection_state: {
      platform: currentPlatform,
      samplesCollected: samplesCollected,
      pureCount: pureCount,
      augmentedCount: augmentedCount,
      scrollPosition: window.scrollY,
      timestamp: Date.now(),
      isActive: isCollecting,
    },
  });
}

async function loadSavedState() {
  const result = await chrome.storage.local.get("collection_state");

  if (result.collection_state && result.collection_state.isActive) {
    const state = result.collection_state;

    // Resume from saved state
    samplesCollected = state.samplesCollected || 0;
    pureCount = state.pureCount || 0;
    augmentedCount = state.augmentedCount || 0;

    // Scroll to saved position
    window.scrollTo(0, state.scrollPosition || 0);

    console.log(`✅ Resumed from sample ${samplesCollected}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: STOP & COMPLETE
// ═══════════════════════════════════════════════════════════════════════════════

async function stopCollection() {
  console.log("⏹️ STOPPING collection...");

  // Set flag to false
  isCollecting = false;

  // ═══ RESET ALL COUNTERS ═══
  samplesCollected = 0;
  pureCount = 0;
  augmentedCount = 0;
  unchangedScrollCount = 0;
  // ═══ END RESET ═══

  // Hide visuals
  if (window.VisualFeedback) {
    window.VisualFeedback.cleanupVisuals();
  }

  // Clear saved state
  await chrome.storage.local.remove("collection_state");

  // Send final update to popup
  chrome.runtime.sendMessage({
    action: "UPDATE_PROGRESS",
    data: {
      isActive: false,
      samplesCollected: 0,
      pureCount: 0,
      augmentedCount: 0,
      platform: currentPlatform,
    },
  });

  console.log("✅ Collection stopped");
  console.log("Final count: 0 samples"); // ← Should show 0 after reset
}

async function completeCollection() {
  isCollecting = false;

  // Hide zone border
  if (window.VisualFeedback) {
    window.VisualFeedback.hideZoneBorder();
  }

  // Send completion message
  chrome.runtime.sendMessage({
    action: "COLLECTION_COMPLETE",
    platform: currentPlatform,
    totalSamples: samplesCollected,
    pureCount: pureCount,
    augmentedCount: augmentedCount,
  });

  console.log("🎉 Collection complete!");
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

console.log("✅ collector.js loaded successfully");
console.log("📦 Dependencies check:");
console.log("  - CollectorHelpers:", typeof window.CollectorHelpers);
console.log("  - VisualFeedback:", typeof window.VisualFeedback);
console.log("🎯 Collector ready to receive START_COLLECTION message");

// ═══════════════════════════════════════════════════════════════════════════════
// END OF COLLECTOR.JS
// ═══════════════════════════════════════════════════════════════════════════════
//
// SUMMARY OF WHAT THIS FILE DOES:
//   ✅ Receives START message from popup
//   ✅ Loads configuration and settings
//   ✅ Shows zone border
//   ✅ Enters collection loop:
//      1. Find elements using test IDs
//      2. Filter by zone and visibility
//      3. Calculate bounding boxes
//      4. Show highlights (if enabled)
//      5. Capture screenshot
//      6. Generate annotations
//      7. Create unique filenames
//      8. Download files
//      9. Update counters
//      10. Update progress
//      11. Save state
//      12. Scroll
//      13. Repeat
//   ✅ Handles STOP/PAUSE/RESUME
//   ✅ State persistence (no restart issue)
//   ✅ Completes when target reached
//
// THE COMPLETE SYSTEM IS NOW READY! 🚀
//
// ═══════════════════════════════════════════════════════════════════════════════
