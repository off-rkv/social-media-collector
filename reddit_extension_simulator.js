// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT EXTENSION SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════
// Simulates EXACTLY what the extension sees when processing Reddit posts
// Run this to see what the extension will find and capture
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🔬 EXTENSION SIMULATOR");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Simulate zone (typical extension setup)
  // ═══════════════════════════════════════════════════════════════════════════
  const collectionZone = {
    top: 60,
    bottom: window.innerHeight,
    left: 0,
    right: window.innerWidth
  };

  console.log("📦 SIMULATED CAPTURE ZONE:");
  console.log(`   Top: ${collectionZone.top}px`);
  console.log(`   Bottom: ${collectionZone.bottom}px`);
  console.log(`   Height: ${collectionZone.bottom - collectionZone.top}px`);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Find post container
  // ═══════════════════════════════════════════════════════════════════════════
  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No shreddit-post found!");
    return;
  }

  console.log("✅ Post container found:", post.id);
  const postRect = post.getBoundingClientRect();
  console.log(`   Position: top=${Math.round(postRect.top)}, bottom=${Math.round(postRect.bottom)}`);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Simulate element detection (EXACT extension logic)
  // ═══════════════════════════════════════════════════════════════════════════

  const config = {
    "reddit_upvote_button": {
      selector: "button[upvote]",
      classId: 111
    },
    "reddit_downvote_button": {
      selector: "button[downvote]",
      classId: 112
    },
    "reddit_comment_button": {
      selector: "button[data-post-click-location='comments-button']",
      classId: 113
    },
    "reddit_comment_count": {
      selector: "button[data-post-click-location='comments-button'] faceplate-number",
      classId: 114
    },
    "reddit_share_button": {
      selector: "shreddit-post-share-button",
      classId: 115
    },
    "reddit_award_button": {
      selector: "award-button",
      classId: 117
    },
    "reddit_more_options": {
      selector: "shreddit-post-overflow-menu",
      classId: 118
    },
    "reddit_reaction_panel": {
      selector: "div[data-testid='action-row']",
      classId: 120
    }
  };

  console.log("🔍 SIMULATING ELEMENT DETECTION:\n");

  const foundElements = [];
  let capturedCount = 0;
  let rejectedCount = 0;

  for (const [elementType, elementConfig] of Object.entries(config)) {
    const selector = elementConfig.selector;
    const classId = elementConfig.classId;

    // Try to find element
    const elements = post.querySelectorAll(selector);

    if (elements.length === 0) {
      console.log(`❌ ${elementType}: NOT FOUND`);
      console.log(`   Selector: "${selector}"`);
      console.log("");
      continue;
    }

    // Check each element
    for (const elem of elements) {
      // ═══ EXACT EXTENSION LOGIC ═══
      const isReactionElement =
        elementType.includes('reaction') ||
        elementType.includes('button') ||
        elementType.includes('_panel');

      const rect = elem.getBoundingClientRect();

      // Dimension check
      if (rect.width === 0 || rect.height === 0) {
        console.log(`⚠️ ${elementType}: ZERO DIMENSIONS`);
        console.log(`   Size: ${Math.round(rect.width)}×${Math.round(rect.height)}`);
        console.log("");
        rejectedCount++;
        continue;
      }

      if (isReactionElement) {
        // Use overlap check
        const overlapsZone =
          rect.bottom > collectionZone.top &&
          rect.top < collectionZone.bottom &&
          rect.right > collectionZone.left &&
          rect.left < collectionZone.right;

        if (overlapsZone) {
          console.log(`✅ ${elementType} (classId: ${classId}) [overlap]`);
          console.log(`   Selector: "${selector}"`);
          console.log(`   Position: top=${Math.round(rect.top)}, bottom=${Math.round(rect.bottom)}`);
          console.log(`   Size: ${Math.round(rect.width)}×${Math.round(rect.height)}`);
          console.log(`   Zone check: overlap=true`);
          console.log("");
          foundElements.push({ elementType, classId });
          capturedCount++;
        } else {
          console.log(`❌ ${elementType}: OUTSIDE ZONE`);
          console.log(`   Position: top=${Math.round(rect.top)}, bottom=${Math.round(rect.bottom)}`);
          console.log(`   Zone: top=${collectionZone.top}, bottom=${collectionZone.bottom}`);
          console.log(`   Reason: No overlap`);
          console.log("");
          rejectedCount++;
        }
      } else {
        // Use full containment check
        const fullyInside =
          rect.top >= collectionZone.top &&
          rect.bottom <= collectionZone.bottom &&
          rect.left >= collectionZone.left &&
          rect.right <= collectionZone.right;

        if (fullyInside) {
          console.log(`✅ ${elementType} (classId: ${classId})`);
          console.log(`   Selector: "${selector}"`);
          console.log(`   Position: top=${Math.round(rect.top)}, bottom=${Math.round(rect.bottom)}`);
          console.log("");
          foundElements.push({ elementType, classId });
          capturedCount++;
        } else {
          console.log(`❌ ${elementType}: OUTSIDE ZONE (not fully inside)`);
          console.log(`   Position: top=${Math.round(rect.top)}, bottom=${Math.round(rect.bottom)}`);
          console.log(`   Zone: top=${collectionZone.top}, bottom=${collectionZone.bottom}`);
          console.log("");
          rejectedCount++;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📊 SIMULATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`✅ Would capture: ${capturedCount} elements`);
  console.log(`❌ Would reject: ${rejectedCount} elements`);
  console.log("");

  if (capturedCount === 0) {
    console.log("🚨 PROBLEM: Extension would capture NOTHING!");
    console.log("");
    console.log("Possible causes:");
    console.log("  1. Elements are outside the capture zone");
    console.log("  2. Elements have zero dimensions");
    console.log("  3. Zone boundaries are incorrect");
    console.log("");
    console.log("Solutions:");
    console.log("  1. Scroll the post into the zone (between green lines)");
    console.log("  2. Adjust zone top/bottom in extension settings");
    console.log("  3. Check if post is fully loaded");
  } else if (rejectedCount > 0) {
    console.log("⚠️ Some elements would be rejected");
    console.log("Review the logs above to see why each element was rejected");
  } else {
    console.log("🎉 ALL ELEMENTS WOULD BE CAPTURED!");
    console.log("");
    console.log("If extension still not working:");
    console.log("  1. Make sure extension is reloaded (chrome://extensions)");
    console.log("  2. Check browser console for errors");
    console.log("  3. Verify platform_ids.json is loaded correctly");
  }

  console.log("");
  console.log("💾 Results saved to: window.extensionSimulation");

  window.extensionSimulation = {
    zone: collectionZone,
    foundElements: foundElements,
    capturedCount: capturedCount,
    rejectedCount: rejectedCount
  };

})();
