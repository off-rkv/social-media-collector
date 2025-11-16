// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT ZONE DIAGNOSTIC SCRIPT
// ═══════════════════════════════════════════════════════════════════════════════
// Run this to diagnose why reaction buttons aren't being captured
// Shows zone boundaries and element positions with visual indicators
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🔍 REDDIT ZONE DIAGNOSTIC");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Find the post container
  // ═══════════════════════════════════════════════════════════════════════════
  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No shreddit-post found! Are you on Reddit?");
    return;
  }

  console.log("✅ Post found:", post.id);
  const postRect = post.getBoundingClientRect();
  console.log(`   Position: top=${Math.round(postRect.top)}, left=${Math.round(postRect.left)}`);
  console.log(`   Size: ${Math.round(postRect.width)}×${Math.round(postRect.height)}`);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Simulate capture zone (typical zone setup)
  // ═══════════════════════════════════════════════════════════════════════════
  const zone = {
    top: 60,                    // Below header/nav
    bottom: window.innerHeight, // Full viewport height
    left: 0,
    right: window.innerWidth
  };

  console.log("📦 CAPTURE ZONE BOUNDARIES:");
  console.log(`   Top: ${zone.top}px`);
  console.log(`   Bottom: ${zone.bottom}px`);
  console.log(`   Left: ${zone.left}px`);
  console.log(`   Right: ${zone.right}px`);
  console.log(`   Zone Height: ${zone.bottom - zone.top}px`);
  console.log(`   Zone Width: ${zone.right - zone.left}px`);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Test Reddit elements against zone
  // ═══════════════════════════════════════════════════════════════════════════
  const elementsToTest = {
    "Container": "shreddit-post",
    "Profile Picture": "[slot='credit-bar'] img",
    "Subreddit Name": "[slot='credit-bar'] a[data-testid='subreddit-name']",
    "Username": "a.author-name",
    "Post Title": "a[slot='title']",
    "Post Text": "div[id*='-post-rtjson-content']",
    "Vote Count": "faceplate-number[pretty]",
    "Timestamp": "time[datetime]",
    "Upvote Button": "button[upvote]",
    "Downvote Button": "button[downvote]",
    "Comment Button": "button[data-post-click-location='comments-button']",
    "Share Button": "shreddit-post-share-button",
    "Award Button": "award-button",
    "More Options": "shreddit-post-overflow-menu",
    "Reaction Panel": "div[data-testid='action-row']"
  };

  console.log("🧪 TESTING ELEMENTS AGAINST ZONE:\n");

  let inZoneCount = 0;
  let outZoneCount = 0;
  let partialCount = 0;

  for (const [name, selector] of Object.entries(elementsToTest)) {
    try {
      let elem;

      // For container, use document; for others use post
      if (selector === "shreddit-post") {
        elem = post;
      } else {
        elem = post.querySelector(selector);
      }

      if (!elem) {
        console.log(`❌ ${name}:`);
        console.log(`   NOT FOUND with selector: "${selector}"`);
        console.log("");
        continue;
      }

      const rect = elem.getBoundingClientRect();

      // Check zone containment
      const fullyInside =
        rect.top >= zone.top &&
        rect.bottom <= zone.bottom &&
        rect.left >= zone.left &&
        rect.right <= zone.right;

      const overlapsZone =
        rect.bottom > zone.top &&
        rect.top < zone.bottom &&
        rect.right > zone.left &&
        rect.left < zone.right;

      const hasValidDimensions = rect.width > 0 && rect.height > 0;

      // Determine status
      let status = "";
      let emoji = "";

      if (!hasValidDimensions) {
        emoji = "⚠️";
        status = "ZERO DIMENSIONS";
      } else if (fullyInside) {
        emoji = "✅";
        status = "FULLY IN ZONE";
        inZoneCount++;
      } else if (overlapsZone) {
        emoji = "⚡";
        status = "PARTIAL (overlap but not fully inside)";
        partialCount++;
      } else {
        emoji = "❌";
        status = "OUTSIDE ZONE";
        outZoneCount++;
      }

      console.log(`${emoji} ${name}: ${status}`);
      console.log(`   Selector: "${selector}"`);
      console.log(`   Position:`);
      console.log(`     - Top: ${Math.round(rect.top)} (zone: ${zone.top})`);
      console.log(`     - Bottom: ${Math.round(rect.bottom)} (zone: ${zone.bottom})`);
      console.log(`     - Left: ${Math.round(rect.left)} (zone: ${zone.left})`);
      console.log(`     - Right: ${Math.round(rect.right)} (zone: ${zone.right})`);
      console.log(`   Size: ${Math.round(rect.width)}×${Math.round(rect.height)}`);

      // Show specific violations
      if (!fullyInside && hasValidDimensions) {
        const violations = [];
        if (rect.top < zone.top) violations.push(`Top too high (${Math.round(rect.top)} < ${zone.top})`);
        if (rect.bottom > zone.bottom) violations.push(`Bottom too low (${Math.round(rect.bottom)} > ${zone.bottom})`);
        if (rect.left < zone.left) violations.push(`Left too far left (${Math.round(rect.left)} < ${zone.left})`);
        if (rect.right > zone.right) violations.push(`Right too far right (${Math.round(rect.right)} > ${zone.right})`);

        if (violations.length > 0) {
          console.log(`   🚫 Violations:`);
          violations.forEach(v => console.log(`      - ${v}`));
        }
      }

      console.log("");

    } catch (error) {
      console.log(`⚠️ ${name}: ERROR`);
      console.log(`   ${error.message}`);
      console.log("");
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  const total = inZoneCount + partialCount + outZoneCount;
  console.log(`✅ Fully in zone: ${inZoneCount}/${total}`);
  console.log(`⚡ Partial overlap: ${partialCount}/${total}`);
  console.log(`❌ Outside zone: ${outZoneCount}/${total}`);
  console.log("");

  if (partialCount > 0) {
    console.log("💡 ISSUE FOUND:");
    console.log(`   ${partialCount} element(s) partially overlap but aren't fully inside zone`);
    console.log(`   The extension requires elements to be FULLY inside the zone`);
    console.log("");
    console.log("🔧 SOLUTIONS:");
    console.log("   1. Increase zone height (move zone.top higher or zone.bottom lower)");
    console.log("   2. Add special handling for reaction panel (use overlap check)");
    console.log("");
  }

  if (outZoneCount > 0) {
    console.log("⚠️ WARNING:");
    console.log(`   ${outZoneCount} element(s) are completely outside the capture zone`);
    console.log(`   These will NEVER be captured with current zone settings`);
    console.log("");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Visual zone indicator
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🎨 VISUAL ZONE OVERLAY:");
  console.log("   Creating visual zone border on page...");

  // Remove existing zone border if any
  const existingBorder = document.getElementById('reddit-zone-diagnostic-border');
  if (existingBorder) existingBorder.remove();

  // Create zone border
  const zoneBorder = document.createElement('div');
  zoneBorder.id = 'reddit-zone-diagnostic-border';
  zoneBorder.style.cssText = `
    position: fixed;
    top: ${zone.top}px;
    left: ${zone.left}px;
    width: ${zone.right - zone.left}px;
    height: ${zone.bottom - zone.top}px;
    border: 3px solid #00ff00;
    background: rgba(0, 255, 0, 0.05);
    pointer-events: none;
    z-index: 999999;
    box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.3);
  `;

  // Add zone label
  const label = document.createElement('div');
  label.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #00ff00;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    font-weight: bold;
  `;
  label.textContent = `CAPTURE ZONE (${zone.right - zone.left}×${zone.bottom - zone.top})`;
  zoneBorder.appendChild(label);

  document.body.appendChild(zoneBorder);

  console.log("   ✅ Green border shows capture zone");
  console.log("   📍 Elements must be FULLY inside green zone to be captured");
  console.log("");

  console.log("💾 Results saved to: window.redditZoneDiagnostic");

  window.redditZoneDiagnostic = {
    zone,
    postRect,
    inZoneCount,
    partialCount,
    outZoneCount,
    total
  };

  console.log("\n⏱️ Zone border will stay visible for inspection");
  console.log("   To remove: document.getElementById('reddit-zone-diagnostic-border').remove()");
  console.log("");

})();
