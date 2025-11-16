// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT DOM SELECTOR IDENTIFIER ($0 VERSION)
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Run this in F12 console on Reddit to find best selectors
//
// USAGE:
//   1. Open Reddit.com
//   2. Press F12 to open DevTools
//   3. In Elements tab, click on any post element
//   4. Go to Console tab
//   5. Paste this entire script
//   6. Press Enter
//   7. Copy the JSON output and send it back
//
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🔍 REDDIT SELECTOR FINDER");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1: Get Reference Element ($0)
  // ────────────────────────────────────────────────────────────────────────────

  const referenceElement = $0;

  if (!referenceElement) {
    console.error("❌ No element selected!");
    console.log("\n💡 Instructions:");
    console.log("   1. Switch to Elements tab");
    console.log("   2. Click on a Reddit post element");
    console.log("   3. Switch back to Console tab");
    console.log("   4. Run this script again\n");
    return;
  }

  console.log("✅ Reference element selected:");
  console.log(`   Tag: <${referenceElement.tagName.toLowerCase()}>`);
  console.log(`   Classes: ${referenceElement.className}`);
  console.log("");

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2: Find Post Container
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 Finding post container...\n");

  // Try to find the post container from the reference element
  let container = referenceElement;
  const containerSelectors = [
    'shreddit-post',
    'article',
    '[data-testid="post-container"]',
    'div[id^="t3_"]',
    '[data-post-id]'
  ];

  // Walk up the DOM tree to find a post container
  while (container && container !== document.body) {
    const tagName = container.tagName.toLowerCase();
    const testId = container.getAttribute('data-testid');
    const id = container.id;

    if (tagName === 'shreddit-post' ||
        tagName === 'article' ||
        testId === 'post-container' ||
        id?.startsWith('t3_') ||
        container.hasAttribute('data-post-id')) {
      break;
    }
    container = container.parentElement;
  }

  if (!container || container === document.body) {
    console.error("❌ Could not find post container!");
    console.log("💡 Try selecting an element inside a Reddit post\n");
    return;
  }

  console.log("✅ Post container found:");
  console.log(`   Tag: <${container.tagName.toLowerCase()}>`);
  console.log(`   Selector: ${container.tagName.toLowerCase()}`);
  console.log("");

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3: Define Reddit-Specific Elements to Search For
  // ────────────────────────────────────────────────────────────────────────────

  const elementTypes = {
    // ═══ PROFILE SECTION ═══
    profile_container: {
      patterns: [
        { selector: "div[slot='credit-bar']", priority: 1 },
        { selector: "shreddit-post-header", priority: 1 },
        { selector: "header", priority: 2 },
        { selector: "div[id*='post-header']", priority: 3 },
        { selector: "div:has(> a[href^='/user/'])", priority: 4 }
      ]
    },
    username: {
      patterns: [
        { selector: "a[href^='/user/']", priority: 1 },
        { selector: "a[href^='/u/']", priority: 1 },
        { selector: "faceplate-tracker[source='post'] a", priority: 2 },
        { selector: "[slot='credit-bar'] a", priority: 2 },
        { selector: "shreddit-post-header a[href*='/user/']", priority: 1 }
      ]
    },
    user_id: {
      patterns: [
        { selector: "a[href^='/user/']", priority: 1 },
        { selector: "a[href^='/u/']", priority: 1 },
        { selector: "[data-author]", priority: 2 },
        { selector: "[data-testid='post-author']", priority: 1 }
      ]
    },
    profile_picture: {
      patterns: [
        { selector: "faceplate-img img", priority: 1 },
        { selector: "img[alt*='Avatar']", priority: 1 },
        { selector: "img[src*='redd.it']", priority: 2 },
        { selector: "[slot='credit-bar'] img", priority: 2 },
        { selector: "shreddit-post-header img", priority: 3 }
      ]
    },

    // ═══ CONTENT SECTION ═══
    post_title: {
      patterns: [
        { selector: "h1", priority: 1 },
        { selector: "a[slot='title']", priority: 1 },
        { selector: "[data-testid='post-title']", priority: 1 },
        { selector: "div[slot='title']", priority: 2 }
      ]
    },
    textarea: {
      patterns: [
        { selector: "textarea[placeholder*='Add a comment']", priority: 1 },
        { selector: "textarea[placeholder*='comment']", priority: 1 },
        { selector: "shreddit-composer textarea", priority: 1 },
        { selector: "div[contenteditable='true']", priority: 2 },
        { selector: "faceplate-form textarea", priority: 2 },
        { selector: "textarea[name='body']", priority: 3 }
      ]
    },
    post_text: {
      patterns: [
        { selector: "div[slot='text-body']", priority: 1 },
        { selector: "[data-testid='post-text']", priority: 1 },
        { selector: "div[id*='-post-rtjson-content']", priority: 1 },
        { selector: "div.text-neutral-content", priority: 2 },
        { selector: "p", priority: 4 }
      ]
    },

    // ═══ MEDIA SECTION ═══
    image_video_container: {
      patterns: [
        { selector: "shreddit-player", priority: 1 },
        { selector: "div[slot='post-media-container']", priority: 1 },
        { selector: "shreddit-aspect-ratio", priority: 1 },
        { selector: "[data-testid='post-image']", priority: 2 },
        { selector: "[data-testid='post-video']", priority: 2 },
        { selector: "div:has(> img)", priority: 4 },
        { selector: "div:has(> video)", priority: 4 }
      ]
    },
    post_image: {
      patterns: [
        { selector: "shreddit-aspect-ratio img", priority: 1 },
        { selector: "img[src*='preview.redd.it']", priority: 1 },
        { selector: "img[src*='i.redd.it']", priority: 1 },
        { selector: "[slot='post-media-container'] img", priority: 2 },
        { selector: "img[alt='Post image']", priority: 2 }
      ]
    },
    post_video: {
      patterns: [
        { selector: "shreddit-player video", priority: 1 },
        { selector: "video[src*='v.redd.it']", priority: 1 },
        { selector: "[slot='post-media-container'] video", priority: 2 },
        { selector: "video", priority: 3 }
      ]
    },

    // ═══ REACTION/ENGAGEMENT SECTION ═══
    reaction_panel: {
      patterns: [
        { selector: "shreddit-post faceplate-batch", priority: 1 },
        { selector: "div[slot='actionRow']", priority: 1 },
        { selector: "[data-testid='post-action-bar']", priority: 1 },
        { selector: "div:has(> button[aria-label*='upvote'])", priority: 2 },
        { selector: "footer", priority: 3 }
      ]
    },
    upvote_button: {
      patterns: [
        { selector: "button[aria-label*='upvote' i]", priority: 1 },
        { selector: "shreddit-post-action-bar button[icon='upvote']", priority: 1 },
        { selector: "button[icon='upvote']", priority: 1 },
        { selector: "button:has(> svg[aria-label*='Upvote'])", priority: 2 }
      ]
    },
    downvote_button: {
      patterns: [
        { selector: "button[aria-label*='downvote' i]", priority: 1 },
        { selector: "shreddit-post-action-bar button[icon='downvote']", priority: 1 },
        { selector: "button[icon='downvote']", priority: 1 },
        { selector: "button:has(> svg[aria-label*='Downvote'])", priority: 2 }
      ]
    },
    vote_count: {
      patterns: [
        { selector: "faceplate-number[pretty]", priority: 1 },
        { selector: "span[id*='vote-count']", priority: 1 },
        { selector: "[data-testid='vote-count']", priority: 1 },
        { selector: "shreddit-post faceplate-number", priority: 2 },
        { selector: "div:has(> button[aria-label*='upvote']) span", priority: 3 }
      ]
    },
    comment_count: {
      patterns: [
        { selector: "span[id*='comment-count']", priority: 1 },
        { selector: "[aria-label*='comment' i] faceplate-number", priority: 1 },
        { selector: "button:has(> span:contains('Comment')) faceplate-number", priority: 2 },
        { selector: "[data-testid='comment-count']", priority: 2 }
      ]
    },
    comment_button: {
      patterns: [
        { selector: "button[aria-label*='comment' i]", priority: 1 },
        { selector: "a[aria-label*='comment' i]", priority: 1 },
        { selector: "button:has(> span:contains('Comment'))", priority: 2 },
        { selector: "button[id*='comment-button']", priority: 3 }
      ]
    },
    share_button: {
      patterns: [
        { selector: "button[aria-label*='share' i]", priority: 1 },
        { selector: "button[icon='share']", priority: 1 },
        { selector: "button:has(> span:contains('Share'))", priority: 2 }
      ]
    },
    save_button: {
      patterns: [
        { selector: "button[aria-label*='save' i]", priority: 1 },
        { selector: "button[icon='save']", priority: 1 },
        { selector: "button:has(> span:contains('Save'))", priority: 2 }
      ]
    },
    award_button: {
      patterns: [
        { selector: "button[aria-label*='award' i]", priority: 1 },
        { selector: "button[aria-label*='give award' i]", priority: 1 },
        { selector: "button[icon='gift']", priority: 2 }
      ]
    },
    more_options: {
      patterns: [
        { selector: "button[aria-label*='more options' i]", priority: 1 },
        { selector: "button[aria-label='More']", priority: 1 },
        { selector: "button[icon='overflow-horizontal']", priority: 1 },
        { selector: "button:has(> svg[aria-label='More'])", priority: 2 }
      ]
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 4: Test Each Selector Pattern
  // ────────────────────────────────────────────────────────────────────────────

  const results = {};

  console.log("🔎 Testing selectors in post container...\n");

  for (const [elementType, config] of Object.entries(elementTypes)) {
    console.log(`\n📍 ${elementType}`);

    const foundSelectors = [];

    for (const pattern of config.patterns) {
      try {
        const elements = container.querySelectorAll(pattern.selector);

        if (elements.length > 0) {
          const samples = [];

          for (let i = 0; i < Math.min(elements.length, 2); i++) {
            const elem = elements[i];
            const sample = {
              tag: elem.tagName.toLowerCase(),
              text: elem.textContent?.trim().substring(0, 60) || null,
              href: elem.href || null,
              src: elem.src || null,
              alt: elem.alt || null,
              ariaLabel: elem.getAttribute('aria-label') || null,
              id: elem.id || null,
              classes: elem.className || null,
              dataAttrs: {}
            };

            // Capture data-* attributes
            for (const attr of elem.attributes) {
              if (attr.name.startsWith('data-')) {
                sample.dataAttrs[attr.name] = attr.value?.substring(0, 50);
              }
            }

            samples.push(sample);
          }

          foundSelectors.push({
            selector: pattern.selector,
            priority: pattern.priority,
            count: elements.length,
            samples: samples
          });

          console.log(`   ✅ "${pattern.selector}"`);
          console.log(`      Found: ${elements.length} element(s)`);

          if (samples[0]) {
            if (samples[0].text) console.log(`      Text: "${samples[0].text}"`);
            if (samples[0].ariaLabel) console.log(`      Aria: "${samples[0].ariaLabel}"`);
            if (samples[0].href) console.log(`      Href: "${samples[0].href}"`);
          }
        }
      } catch (e) {
        // Invalid selector
      }
    }

    if (foundSelectors.length === 0) {
      console.log(`   ⚠️ No selectors found`);
    }

    results[elementType] = foundSelectors;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 5: Generate Output JSON
  // ────────────────────────────────────────────────────────────────────────────

  console.log("\n\n═══════════════════════════════════════════════════════════");
  console.log("  📋 RESULTS - Copy this and send it back");
  console.log("═══════════════════════════════════════════════════════════\n");

  const output = {
    platform: "reddit",
    url: window.location.href,
    timestamp: new Date().toISOString(),
    post_container: {
      selector: container.tagName.toLowerCase(),
      id: container.id || null,
      classes: container.className || null
    },
    elements: {}
  };

  // Add best selector for each element type
  for (const [elementType, selectors] of Object.entries(results)) {
    if (selectors.length > 0) {
      // Sort by priority first, then by count
      selectors.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.count - a.count;
      });

      const best = selectors[0];
      const fallbacks = selectors.slice(1, 4).map(s => s.selector);

      output.elements[elementType] = {
        selector: best.selector,
        fallbacks: fallbacks,
        count: best.count,
        samples: best.samples,
        allOptions: selectors.map(s => ({
          selector: s.selector,
          priority: s.priority,
          count: s.count
        }))
      };
    }
  }

  console.log(JSON.stringify(output, null, 2));

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Analysis Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n📝 Next Steps:");
  console.log("   1. Copy the JSON output above");
  console.log("   2. Send it back to me");
  console.log("   3. I'll tell you the best selectors to use!\n");

  // Save to window for easy copying
  window.redditSelectorResults = output;
  console.log("💾 Results saved to: window.redditSelectorResults");
  console.log("   Quick copy: copy(JSON.stringify(window.redditSelectorResults, null, 2))\n");

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 6: Visual Highlighting (Optional)
  // ────────────────────────────────────────────────────────────────────────────

  console.log("✨ Want to see the elements highlighted?");
  console.log("   Run: highlightRedditElements()");
  console.log("");

  window.highlightRedditElements = function() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];

    let colorIndex = 0;

    for (const [elementType, data] of Object.entries(output.elements)) {
      if (data.selector) {
        const elements = container.querySelectorAll(data.selector);
        const color = colors[colorIndex % colors.length];

        elements.forEach(elem => {
          elem.style.outline = `3px solid ${color}`;
          elem.style.outlineOffset = '2px';

          const label = document.createElement('div');
          label.textContent = elementType;
          label.style.cssText = `
            position: absolute;
            background: ${color};
            color: white;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 3px;
            z-index: 10000;
            pointer-events: none;
            font-family: monospace;
          `;
          elem.style.position = 'relative';
          elem.appendChild(label);
        });

        console.log(`🎨 Highlighted ${elements.length}x ${elementType} in ${color}`);
        colorIndex++;
      }
    }

    console.log("\n✅ Elements highlighted! Scroll around to see them.");
  };

})();
