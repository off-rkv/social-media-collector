// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT SELECTOR VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
// Run this script to validate ALL Reddit selectors from platform_ids.json
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  ✅ REDDIT SELECTOR VALIDATION");
  console.log("═══════════════════════════════════════════════════════════\n");

  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No shreddit-post found! Are you on Reddit?");
    return;
  }

  console.log("✅ Testing on post:", post.id);
  console.log("");

  // All selectors from platform_ids.json
  const selectors = {
    // Class ID 100-110: Basic Elements
    "Container (100)": { selector: "shreddit-post", context: document },
    "Profile Picture (101)": { selector: "[slot='credit-bar'] img", context: post },
    "Subreddit Name (102)": { selector: "[slot='credit-bar'] a[data-testid='subreddit-name']", context: post },
    "Username (103)": { selector: "a.author-name", context: post },
    "Post Title (104)": { selector: "a[slot='title']", context: post },
    "Post Text (105)": { selector: "div[id*='-post-rtjson-content']", context: post },
    "Image Container (106)": { selector: "div[slot='post-media-container']", context: post },
    "Post Image (107)": { selector: "shreddit-aspect-ratio img", context: post },
    "Post Video (108)": { selector: "shreddit-player video", context: post },
    "Vote Count (109)": { selector: "faceplate-number[pretty]", context: post },
    "Timestamp (110)": { selector: "time[datetime]", context: post },

    // Class ID 111-120: Buttons & Interactions
    "Upvote Button (111)": { selector: "button[upvote]", context: post },
    "Downvote Button (112)": { selector: "button[downvote]", context: post },
    "Comment Button (113)": { selector: "button[data-post-click-location='comments-button']", context: post },
    "Comment Count (114)": { selector: "button[data-post-click-location='comments-button'] faceplate-number", context: post },
    "Share Button (115)": { selector: "shreddit-post-share-button", context: post },
    "Save Button (116)": { selector: "TODO_NEED_TO_FIND", context: post },
    "Award Button (117)": { selector: "award-button", context: post },
    "More Options (118)": { selector: "shreddit-post-overflow-menu", context: post },
    "Comment Textarea (119)": { selector: "shreddit-composer textarea", context: post },
    "Reaction Panel (120)": { selector: "div[data-testid='action-row']", context: post }
  };

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  console.log("📋 TESTING ALL SELECTORS...\n");

  for (const [name, config] of Object.entries(selectors)) {
    const { selector, context } = config;

    // Skip TODO items
    if (selector.startsWith('TODO')) {
      console.log(`⏭️  ${name}: SKIPPED (marked as TODO)`);
      skipped++;
      continue;
    }

    try {
      const elements = context.querySelectorAll(selector);

      if (elements.length > 0) {
        const elem = elements[0];
        const text = elem.textContent?.trim().substring(0, 40) || '';
        const href = elem.href || '';
        const src = elem.src?.substring(0, 50) || '';

        console.log(`✅ ${name}: FOUND (${elements.length})`);
        console.log(`   Selector: "${selector}"`);
        if (text) console.log(`   Text: "${text}"`);
        if (href) console.log(`   Href: "${href}"`);
        if (src) console.log(`   Src: "${src}..."`);
        console.log('');

        passed++;
      } else {
        console.log(`❌ ${name}: NOT FOUND`);
        console.log(`   Selector: "${selector}"`);
        console.log('');

        failed++;
      }
    } catch (e) {
      console.log(`⚠️  ${name}: ERROR`);
      console.log(`   Selector: "${selector}"`);
      console.log(`   Error: ${e.message}`);
      console.log('');

      failed++;
    }
  }

  // Summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📊 VALIDATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  const total = passed + failed + skipped;
  const passRate = Math.round((passed / (total - skipped)) * 100);

  console.log(`✅ Passed: ${passed}/${total - skipped} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}/${total - skipped}`);
  console.log(`⏭️  Skipped: ${skipped}/${total}`);
  console.log('');

  if (failed > 0) {
    console.log("💡 TIPS FOR FAILED SELECTORS:");
    console.log("   1. Some elements only appear in specific contexts:");
    console.log("      - Video: Only on video posts");
    console.log("      - Textarea: Only after clicking 'Add a comment'");
    console.log("      - Save: May be hidden in overflow menu");
    console.log('');
    console.log("   2. Try inspecting the element manually:");
    console.log("      - Right-click element → Inspect");
    console.log("      - Note its attributes and structure");
    console.log("      - Test in console: post.querySelector('YOUR_SELECTOR')");
    console.log('');
  }

  if (passed === total - skipped) {
    console.log("🎉 ALL SELECTORS VALIDATED SUCCESSFULLY!");
    console.log("   Your Reddit configuration is ready to use!");
    console.log('');
  }

  // Save results
  window.redditValidationResults = {
    passed,
    failed,
    skipped,
    total,
    passRate,
    timestamp: new Date().toISOString()
  };

  console.log("💾 Results saved to: window.redditValidationResults");
  console.log("   Copy: copy(JSON.stringify(window.redditValidationResults, null, 2))");
  console.log('');

})();
