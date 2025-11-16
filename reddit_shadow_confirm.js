// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW DOM CONFIRMATION TEST
// ═══════════════════════════════════════════════════════════════════════════════
// Verify buttons ARE in Shadow DOM and show how to access them
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🎯 SHADOW DOM CONFIRMATION");
  console.log("═══════════════════════════════════════════════════════════\n");

  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No post found!");
    return;
  }

  console.log("✅ Post found:", post.id);
  console.log("");

  // Check for Shadow DOM
  if (!post.shadowRoot) {
    console.error("❌ Post has NO Shadow DOM!");
    console.log("   Buttons should be in regular DOM");
    return;
  }

  console.log("✅ Post HAS Shadow DOM\n");

  // Test button selectors in Shadow DOM
  const tests = {
    "Upvote button": "button[upvote]",
    "Downvote button": "button[downvote]",
    "Comment button": "button[data-post-click-location='comments-button']",
    "Reaction panel": "div[data-testid='action-row']",
    "Vote count": "faceplate-number[pretty]",
    "Share button": "shreddit-post-share-button",
    "Award button": "award-button"
  };

  console.log("🔍 SEARCHING IN SHADOW DOM:\n");

  let foundCount = 0;

  for (const [name, selector] of Object.entries(tests)) {
    const elem = post.shadowRoot.querySelector(selector);

    if (elem) {
      const rect = elem.getBoundingClientRect();
      console.log(`✅ ${name}: FOUND`);
      console.log(`   Selector: ${selector}`);
      console.log(`   Position: top=${Math.round(rect.top)}, left=${Math.round(rect.left)}`);
      console.log(`   Size: ${Math.round(rect.width)}×${Math.round(rect.height)}`);
      console.log(`   Visible: ${rect.width > 0 && rect.height > 0 ? 'YES' : 'NO'}`);
      console.log("");
      foundCount++;
    } else {
      console.log(`❌ ${name}: NOT FOUND`);
      console.log(`   Selector: ${selector}`);
      console.log("");
    }
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  📊 RESULTS");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`✅ Found in Shadow DOM: ${foundCount}/${Object.keys(tests).length}`);
  console.log("");

  if (foundCount > 0) {
    console.log("🎉 SUCCESS! Buttons ARE in Shadow DOM!");
    console.log("");
    console.log("📝 FIX REQUIRED:");
    console.log("   Extension must use shadowRoot.querySelector() instead of querySelector()");
    console.log("");
    console.log("   Example:");
    console.log("   ❌ WRONG: post.querySelector('button[upvote]')");
    console.log("   ✅ RIGHT: post.shadowRoot.querySelector('button[upvote]')");
    console.log("");
    console.log("   In collector.js, change:");
    console.log("   const elements = targetContainer.querySelectorAll(selector);");
    console.log("   TO:");
    console.log("   const elements = (targetContainer.shadowRoot || targetContainer).querySelectorAll(selector);");
  } else {
    console.log("⚠️ Buttons not in Shadow DOM either!");
    console.log("   They might be in nested Shadow DOMs");
    console.log("   Need deeper investigation");
  }

  console.log("");
  console.log("💾 Shadow root saved to: window.redditShadowRoot");
  window.redditShadowRoot = post.shadowRoot;

})();
