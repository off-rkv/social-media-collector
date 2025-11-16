// ═══════════════════════════════════════════════════════════════════════════════
// QUICK REDDIT BUTTON TEST
// ═══════════════════════════════════════════════════════════════════════════════
// Run this in Reddit console to verify buttons are found
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("🧪 QUICK BUTTON TEST\n");

  const post = document.querySelector('shreddit-post');
  if (!post) {
    console.error("❌ No post found!");
    return;
  }

  const tests = {
    "Upvote": "button[upvote]",
    "Downvote": "button[downvote]",
    "Comment": "button[data-post-click-location='comments-button']",
    "Share (primary)": "shreddit-post-share-button",
    "Share (fallback)": "button:has(svg[icon-name='share'])",
    "Award": "award-button",
    "More": "shreddit-post-overflow-menu",
    "Vote Count": "faceplate-number[pretty]",
    "Reaction Panel": "div[data-testid='action-row']"
  };

  let found = 0;
  let notFound = 0;

  for (const [name, selector] of Object.entries(tests)) {
    try {
      const elem = post.querySelector(selector);
      if (elem) {
        const rect = elem.getBoundingClientRect();
        console.log(`✅ ${name}`);
        console.log(`   selector: "${selector}"`);
        console.log(`   position: top=${Math.round(rect.top)}, left=${Math.round(rect.left)}`);
        console.log(`   size: ${Math.round(rect.width)}×${Math.round(rect.height)}`);
        console.log("");
        found++;
      } else {
        console.log(`❌ ${name}: NOT FOUND`);
        console.log(`   selector: "${selector}"`);
        console.log("");
        notFound++;
      }
    } catch (e) {
      console.log(`⚠️ ${name}: ERROR - ${e.message}`);
      console.log("");
      notFound++;
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log(`📊 Result: ${found}/${found + notFound} found`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (found === 0) {
    console.log("❌ PROBLEM: No buttons found at all!");
    console.log("   Make sure you're on a Reddit post page");
  } else if (notFound > 0) {
    console.log(`⚠️ WARNING: ${notFound} buttons not found`);
    console.log("   This is normal if they're in overflow menu or hidden");
  } else {
    console.log("✅ ALL BUTTONS FOUND!");
    console.log("   If extension still not capturing, check:");
    console.log("   1. Extension is reloaded (chrome://extensions)");
    console.log("   2. Zone detection (run reddit_zone_diagnostic.js)");
    console.log("   3. Console logs when collection starts");
  }
})();
