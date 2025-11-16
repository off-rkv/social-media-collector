// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT SHADOW DOM TEST
// ═══════════════════════════════════════════════════════════════════════════════
// Check if buttons are hidden in Shadow DOM
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("👻 SHADOW DOM DETECTIVE\n");

  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No shreddit-post found!");
    return;
  }

  console.log("✅ Post found:", post.id);
  console.log("");

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 1: Direct querySelector (regular DOM)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🔍 TEST 1: Direct querySelector (regular DOM)\n");

  const tests = {
    "Upvote button": "button[upvote]",
    "Downvote button": "button[downvote]",
    "Comment button": "button[data-post-click-location='comments-button']",
    "Reaction panel": "div[data-testid='action-row']",
    "Share button": "shreddit-post-share-button",
    "Award button": "award-button"
  };

  let foundInRegularDOM = 0;

  for (const [name, selector] of Object.entries(tests)) {
    const elem = post.querySelector(selector);
    if (elem) {
      console.log(`✅ ${name}: FOUND in regular DOM`);
      foundInRegularDOM++;
    } else {
      console.log(`❌ ${name}: NOT in regular DOM`);
    }
  }

  console.log(`\nRegular DOM: ${foundInRegularDOM}/${Object.keys(tests).length} found\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 2: Check for Shadow DOM
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("👻 TEST 2: Shadow DOM Detection\n");

  if (post.shadowRoot) {
    console.log("✅ Post HAS Shadow DOM!");
    console.log("");

    // Try to find buttons in shadow DOM
    for (const [name, selector] of Object.entries(tests)) {
      const elem = post.shadowRoot.querySelector(selector);
      if (elem) {
        console.log(`✅ ${name}: FOUND in Shadow DOM`);
      } else {
        console.log(`❌ ${name}: NOT in Shadow DOM either`);
      }
    }
  } else {
    console.log("❌ Post has NO Shadow DOM");
    console.log("   Elements should be in regular DOM");
  }

  console.log("");

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 3: Search entire document (not scoped to post)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🌍 TEST 3: Global search (entire document)\n");

  let foundGlobally = 0;

  for (const [name, selector] of Object.entries(tests)) {
    const elem = document.querySelector(selector);
    if (elem) {
      console.log(`✅ ${name}: FOUND globally`);
      const rect = elem.getBoundingClientRect();
      console.log(`   Position: top=${Math.round(rect.top)}, left=${Math.round(rect.left)}`);

      // Check if it's actually inside the post
      const isInPost = post.contains(elem);
      console.log(`   Inside post: ${isInPost ? 'YES' : 'NO'}`);

      foundGlobally++;
    } else {
      console.log(`❌ ${name}: NOT found globally`);
    }
  }

  console.log(`\nGlobal search: ${foundGlobally}/${Object.keys(tests).length} found\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Test 4: Find all custom elements with shadow roots
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("🔎 TEST 4: All Shadow Roots in Post\n");

  function findShadowRoots(element, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return;

    if (element.shadowRoot) {
      console.log(`${'  '.repeat(depth)}📦 <${element.tagName.toLowerCase()}> has Shadow DOM`);

      // Check if buttons are inside
      const upvote = element.shadowRoot.querySelector('button[upvote]');
      const downvote = element.shadowRoot.querySelector('button[downvote]');
      const actionRow = element.shadowRoot.querySelector('div[data-testid="action-row"]');

      if (upvote || downvote || actionRow) {
        console.log(`${'  '.repeat(depth)}   🎯 BUTTONS FOUND IN HERE!`);
        if (upvote) console.log(`${'  '.repeat(depth)}      - Upvote button ✅`);
        if (downvote) console.log(`${'  '.repeat(depth)}      - Downvote button ✅`);
        if (actionRow) console.log(`${'  '.repeat(depth)}      - Action row ✅`);
      }

      // Recurse into shadow DOM
      const shadowChildren = element.shadowRoot.querySelectorAll('*');
      shadowChildren.forEach(child => findShadowRoots(child, depth + 1, maxDepth));
    }

    // Recurse into regular children
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      findShadowRoots(children[i], depth, maxDepth);
    }
  }

  findShadowRoots(post);

  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📊 DIAGNOSIS");
  console.log("═══════════════════════════════════════════════════════════\n");

  if (foundInRegularDOM > 0) {
    console.log("✅ Buttons are in REGULAR DOM");
    console.log("   Extension selectors should work!");
    console.log("");
    console.log("If extension not capturing:");
    console.log("  1. Reload extension (chrome://extensions)");
    console.log("  2. Check zone boundaries");
    console.log("  3. Verify platform_ids.json is loaded");
  } else if (foundGlobally > 0) {
    console.log("⚠️ Buttons found GLOBALLY but NOT in post context");
    console.log("   This means buttons exist but aren't inside <shreddit-post>");
    console.log("");
    console.log("Solution:");
    console.log("  - Change selectors to search globally, not in post");
    console.log("  - Or find the correct container element");
  } else {
    console.log("🚨 BUTTONS NOT FOUND ANYWHERE!");
    console.log("");
    console.log("Possible causes:");
    console.log("  1. Buttons in Shadow DOM (need shadowRoot access)");
    console.log("  2. Buttons loaded dynamically (not loaded yet)");
    console.log("  3. Different Reddit page type (not a standard post)");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Inspect button manually (right-click → Inspect)");
    console.log("  2. Check if it's inside a #shadow-root");
    console.log("  3. Provide the HTML path from DevTools");
  }

})();
