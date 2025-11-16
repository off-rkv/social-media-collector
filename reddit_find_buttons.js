// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT BUTTON & INTERACTION FINDER
// ═══════════════════════════════════════════════════════════════════════════════
// Run this script to find all interactive elements (buttons, textareas, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🔍 REDDIT BUTTON & INTERACTION FINDER");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Get first post container
  const post = document.querySelector('shreddit-post');

  if (!post) {
    console.error("❌ No shreddit-post found! Make sure you're on Reddit.");
    return;
  }

  console.log("✅ Post found:", post.id);
  console.log("");

  // ────────────────────────────────────────────────────────────────────────────
  // SCAN 1: Find ALL buttons
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 SCANNING FOR BUTTONS...\n");

  const buttons = post.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons total\n`);

  buttons.forEach((btn, idx) => {
    const ariaLabel = btn.getAttribute('aria-label');
    const icon = btn.getAttribute('icon');
    const text = btn.textContent.trim().substring(0, 30);
    const classes = btn.className.substring(0, 60);

    console.log(`Button #${idx + 1}:`);
    if (ariaLabel) console.log(`  aria-label: "${ariaLabel}"`);
    if (icon) console.log(`  icon: "${icon}"`);
    if (text) console.log(`  text: "${text}"`);
    console.log(`  classes: "${classes}"`);
    console.log('');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SCAN 2: Find ALL links (a tags)
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 SCANNING FOR LINKS...\n");

  const links = post.querySelectorAll('a');
  console.log(`Found ${links.length} links total\n`);

  const userLinks = [];
  const otherLinks = [];

  links.forEach((link) => {
    const href = link.href;
    const text = link.textContent.trim().substring(0, 50);

    if (href?.includes('/user/') || href?.includes('/u/')) {
      userLinks.push({ href, text, el: link });
    } else if (href && text) {
      otherLinks.push({ href, text, el: link });
    }
  });

  console.log("👤 USER LINKS:");
  userLinks.forEach((link, idx) => {
    console.log(`  ${idx + 1}. "${link.text}"`);
    console.log(`     href: ${link.href}`);
  });

  if (userLinks.length === 0) {
    console.log("  ⚠️ No /user/ or /u/ links found");
    console.log("  💡 This might be a subreddit post (r/...) not a user post (u/...)");
  }

  console.log("");

  // ────────────────────────────────────────────────────────────────────────────
  // SCAN 3: Find shadow DOM elements
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 SCANNING FOR SHADOW DOM...\n");

  function findShadowRoots(element, depth = 0) {
    if (depth > 5) return; // Limit recursion

    if (element.shadowRoot) {
      console.log(`${'  '.repeat(depth)}📦 Shadow root found in: <${element.tagName.toLowerCase()}>`);

      // Find buttons in shadow root
      const shadowButtons = element.shadowRoot.querySelectorAll('button');
      if (shadowButtons.length > 0) {
        console.log(`${'  '.repeat(depth)}   → ${shadowButtons.length} buttons inside shadow DOM`);
        shadowButtons.forEach((btn, idx) => {
          const ariaLabel = btn.getAttribute('aria-label');
          const icon = btn.getAttribute('icon');
          const text = btn.textContent?.trim().substring(0, 20);
          console.log(`${'  '.repeat(depth)}   Button ${idx + 1}: aria="${ariaLabel}" icon="${icon}" text="${text}"`);
        });
      }

      // Find textareas in shadow root
      const shadowTextareas = element.shadowRoot.querySelectorAll('textarea');
      if (shadowTextareas.length > 0) {
        console.log(`${'  '.repeat(depth)}   → ${shadowTextareas.length} textareas inside shadow DOM`);
        shadowTextareas.forEach((textarea, idx) => {
          const placeholder = textarea.getAttribute('placeholder');
          console.log(`${'  '.repeat(depth)}   Textarea ${idx + 1}: placeholder="${placeholder}"`);
        });
      }

      // Recurse into shadow DOM children
      element.shadowRoot.querySelectorAll('*').forEach(child => {
        findShadowRoots(child, depth + 1);
      });
    }

    // Recurse into regular children
    if (element.children) {
      Array.from(element.children).forEach(child => {
        findShadowRoots(child, depth);
      });
    }
  }

  findShadowRoots(post);

  // ────────────────────────────────────────────────────────────────────────────
  // SCAN 4: Find textareas anywhere on page
  // ────────────────────────────────────────────────────────────────────────────

  console.log("\n🔍 SCANNING FOR TEXTAREAS ON PAGE...\n");

  const allTextareas = document.querySelectorAll('textarea');
  console.log(`Found ${allTextareas.length} textareas total on page\n`);

  allTextareas.forEach((textarea, idx) => {
    const placeholder = textarea.getAttribute('placeholder');
    const name = textarea.getAttribute('name');
    const classes = textarea.className.substring(0, 60);

    console.log(`Textarea #${idx + 1}:`);
    if (placeholder) console.log(`  placeholder: "${placeholder}"`);
    if (name) console.log(`  name: "${name}"`);
    console.log(`  classes: "${classes}"`);
    console.log('');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SCAN 5: Find specific Reddit action elements
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 SCANNING FOR REDDIT-SPECIFIC ELEMENTS...\n");

  const patterns = [
    { name: "Upvote", selectors: ["button[aria-label*='upvote' i]", "button[icon='upvote']", "shreddit-post button:has(svg)"] },
    { name: "Comment", selectors: ["a[href*='/comments/']", "button:has(svg)", "faceplate-tracker"] },
    { name: "Share", selectors: ["button[aria-label*='share' i]", "button[icon='share']"] },
    { name: "Save", selectors: ["button[aria-label*='save' i]", "button[icon='bookmark']"] },
    { name: "Overflow menu", selectors: ["button[aria-label*='overflow' i]", "button[icon='overflow']"] }
  ];

  patterns.forEach(({ name, selectors }) => {
    console.log(`📍 ${name}:`);
    let found = false;

    for (const selector of selectors) {
      try {
        const elements = post.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`  ✅ "${selector}" → ${elements.length} found`);
          found = true;
        }
      } catch (e) {
        // Invalid selector
      }
    }

    if (!found) {
      console.log(`  ❌ Not found with any selector`);
    }
    console.log('');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // SCAN 6: Get ALL element types in post
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 ALL ELEMENT TYPES IN POST...\n");

  const elementTypes = new Set();
  post.querySelectorAll('*').forEach(el => {
    elementTypes.add(el.tagName.toLowerCase());
  });

  const sortedTypes = Array.from(elementTypes).sort();
  console.log("Found element types:", sortedTypes.join(', '));
  console.log("");

  // Look for Reddit-specific custom elements
  const redditElements = sortedTypes.filter(tag =>
    tag.startsWith('shreddit-') || tag.startsWith('faceplate-')
  );

  if (redditElements.length > 0) {
    console.log("Reddit custom elements:", redditElements.join(', '));
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  💡 TIPS");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("1. If buttons are missing, try:");
  console.log("   - Opening a post detail page (click on a post)");
  console.log("   - Scrolling down to load comments");
  console.log("   - Running this script again");
  console.log("");
  console.log("2. To inspect a specific element:");
  console.log("   - Right-click it → Inspect");
  console.log("   - In Elements tab, note the selector");
  console.log("   - Test in console: post.querySelector('YOUR_SELECTOR')");
  console.log("");
  console.log("3. For comment textarea:");
  console.log("   - Click 'Add a comment' or 'Reply'");
  console.log("   - Run this script again to find the textarea");
  console.log("");

  // Save post to window for manual inspection
  window.redditPost = post;
  console.log("💾 Post saved to: window.redditPost");
  console.log("   Inspect it with: console.dir(window.redditPost)\n");

})();
