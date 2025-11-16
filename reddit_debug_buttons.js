// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT BUTTON DEBUG SCRIPT
// ═══════════════════════════════════════════════════════════════════════════════
// Run this to debug why reaction buttons aren't being captured
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("🔧 REDDIT BUTTON DEBUG\n");

  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No shreddit-post found!");
    return;
  }

  console.log("✅ Post found:", post.id);
  console.log("");

  // Test selectors
  const selectors = {
    "Reaction Panel": "div[data-testid='action-row']",
    "Upvote Button": "button[upvote]",
    "Downvote Button": "button[downvote]",
    "Comment Button": "button[data-post-click-location='comments-button']",
    "Share Button": "shreddit-post-share-button",
    "Award Button": "award-button",
    "More Options": "shreddit-post-overflow-menu"
  };

  console.log("📍 TESTING SELECTORS:\n");

  for (const [name, selector] of Object.entries(selectors)) {
    const elem = post.querySelector(selector);

    if (elem) {
      const rect = elem.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(elem);

      console.log(`✅ ${name}:`);
      console.log(`   Selector: "${selector}"`);
      console.log(`   Found: YES`);
      console.log(`   Position:`);
      console.log(`     - Left: ${Math.round(rect.left)}`);
      console.log(`     - Top: ${Math.round(rect.top)}`);
      console.log(`     - Width: ${Math.round(rect.width)}`);
      console.log(`     - Height: ${Math.round(rect.height)}`);
      console.log(`   Visibility:`);
      console.log(`     - display: ${computedStyle.display}`);
      console.log(`     - visibility: ${computedStyle.visibility}`);
      console.log(`     - opacity: ${computedStyle.opacity}`);
      console.log(`   Classes: ${elem.className}`);
      console.log(`   Text: "${elem.textContent?.trim().substring(0, 30) || '(no text)'}"`);
      console.log("");
    } else {
      console.log(`❌ ${name}:`);
      console.log(`   Selector: "${selector}"`);
      console.log(`   Found: NO`);
      console.log("");
    }
  }

  // Check post container dimensions
  const postRect = post.getBoundingClientRect();
  console.log("📦 POST CONTAINER DIMENSIONS:");
  console.log(`   Left: ${Math.round(postRect.left)}`);
  console.log(`   Top: ${Math.round(postRect.top)}`);
  console.log(`   Width: ${Math.round(postRect.width)}`);
  console.log(`   Height: ${Math.round(postRect.height)}`);
  console.log("");

  // Find ALL buttons in post
  const allButtons = post.querySelectorAll('button');
  console.log(`🔍 FOUND ${allButtons.length} TOTAL BUTTONS IN POST:\n`);

  allButtons.forEach((btn, idx) => {
    const rect = btn.getBoundingClientRect();
    const ariaLabel = btn.getAttribute('aria-label');
    const upvote = btn.hasAttribute('upvote');
    const downvote = btn.hasAttribute('downvote');
    const text = btn.textContent?.trim().substring(0, 20) || '';

    console.log(`Button ${idx + 1}:`);
    if (upvote) console.log(`  ⬆️ UPVOTE BUTTON`);
    if (downvote) console.log(`  ⬇️ DOWNVOTE BUTTON`);
    if (ariaLabel) console.log(`  aria-label: "${ariaLabel}"`);
    if (text) console.log(`  text: "${text}"`);
    console.log(`  Position: left=${Math.round(rect.left)}, top=${Math.round(rect.top)}`);
    console.log(`  Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    console.log("");
  });

  // Check if action-row exists anywhere
  const actionRow = document.querySelector('div[data-testid="action-row"]');
  if (actionRow) {
    const rect = actionRow.getBoundingClientRect();
    console.log("✅ ACTION ROW FOUND (global search):");
    console.log(`   Position: left=${Math.round(rect.left)}, top=${Math.round(rect.top)}`);
    console.log(`   Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    console.log(`   Inside post: ${post.contains(actionRow) ? 'YES' : 'NO'}`);
  } else {
    console.log("❌ ACTION ROW NOT FOUND (even with global search)");
  }

  console.log("\n" + "═".repeat(60));
  console.log("💾 Results saved to: window.redditButtonDebug");

  window.redditButtonDebug = {
    post: post,
    postRect: postRect,
    buttons: allButtons,
    actionRow: actionRow
  };

})();
