// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL SOCIAL MEDIA DOM IDENTIFIER
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE: Run this script in F12 console on any social media platform to
//          automatically extract all selectors for platform_ids.json
//
// USAGE:
//   1. Open social media site (Twitter/Instagram/Facebook/Threads)
//   2. Press F12 to open DevTools
//   3. Go to Console tab
//   4. Copy and paste this entire script
//   5. Press Enter to run
//   6. Copy the JSON output
//   7. Give it to Claude to generate platform_ids.json
//
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  UNIVERSAL SOCIAL MEDIA DOM IDENTIFIER");
  console.log("═══════════════════════════════════════════════════════════\n");

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1: Detect Platform
  // ────────────────────────────────────────────────────────────────────────────

  const hostname = window.location.hostname;
  let platform = "unknown";

  if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    platform = "twitter";
  } else if (hostname.includes("instagram.com")) {
    platform = "instagram";
  } else if (hostname.includes("facebook.com")) {
    platform = "facebook";
  } else if (hostname.includes("threads.net")) {
    platform = "threads";
  }

  console.log(`🌐 Platform detected: ${platform}`);
  console.log(`📍 URL: ${window.location.href}\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2: Find Post Containers
  // ────────────────────────────────────────────────────────────────────────────

  console.log("🔍 Looking for post containers...\n");

  const containerCandidates = [
    { selector: "article", name: "article" },
    { selector: "article[role='article']", name: "article[role='article']" },
    { selector: "article[role='presentation']", name: "article[role='presentation']" },
    { selector: "article:not([role])", name: "article without role" },
    { selector: "[data-testid='tweet']", name: "Twitter tweet container" },
    { selector: "div[role='article']", name: "div[role='article']" },
    { selector: "[data-pagelet*='FeedUnit']", name: "Facebook feed unit" },
  ];

  let containers = [];
  let containerSelector = null;

  for (const candidate of containerCandidates) {
    const found = document.querySelectorAll(candidate.selector);
    if (found.length > 0) {
      // Check if containers have actual content
      let hasContent = false;
      for (let i = 0; i < Math.min(found.length, 3); i++) {
        if (found[i].children.length > 0 && found[i].innerHTML.length > 100) {
          hasContent = true;
          break;
        }
      }

      if (hasContent) {
        console.log(`✅ Found ${found.length} containers: ${candidate.name}`);
        console.log(`   Selector: "${candidate.selector}"`);
        containers = Array.from(found).slice(0, 3); // Get first 3 for analysis
        containerSelector = candidate.selector;
        break;
      } else {
        console.log(`⚠️ Found ${found.length} ${candidate.name} but they're empty`);
      }
    }
  }

  if (containers.length === 0) {
    console.error("❌ No valid post containers found!");
    console.log("\n💡 Try scrolling down to load posts, then run the script again.");
    return;
  }

  console.log(`\n📦 Analyzing ${containers.length} post containers...\n`);

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3: Define Element Types to Search For
  // ────────────────────────────────────────────────────────────────────────────

  const elementTypes = {
    profile_picture: {
      patterns: [
        { selector: "img[alt*='profile picture']", priority: 1 },
        { selector: "img[alt*=\"'s profile\"]", priority: 1 },
        { selector: "header img", priority: 2 },
        { selector: "img[alt]", priority: 3 },
        { selector: "a[role='link'] img", priority: 3 },
        { selector: "canvas", priority: 4 }
      ]
    },
    username: {
      patterns: [
        { selector: "a[href^='/@']", priority: 1 },
        { selector: "a[href^='/']", priority: 2 },
        { selector: "header a", priority: 2 },
        { selector: "[data-testid='User-Name']", priority: 1 },
        { selector: "a[role='link']", priority: 3 }
      ]
    },
    verified_badge: {
      patterns: [
        { selector: "svg[aria-label='Verified']", priority: 1 },
        { selector: "svg[aria-label*='Verified']", priority: 1 },
        { selector: "[data-testid='icon-verified']", priority: 1 }
      ]
    },
    timestamp: {
      patterns: [
        { selector: "time[datetime]", priority: 1 },
        { selector: "time", priority: 2 },
        { selector: "a[href*='/status/'] time", priority: 1 },
        { selector: "[aria-label*='ago']", priority: 2 }
      ]
    },
    post_text: {
      patterns: [
        { selector: "[data-testid='tweetText']", priority: 1 },
        { selector: "h1", priority: 2 },
        { selector: "[lang]", priority: 3 },
        { selector: "span[dir='auto']", priority: 3 },
        { selector: "div[dir='auto']", priority: 4 }
      ]
    },
    post_image: {
      patterns: [
        { selector: "img[alt*='Photo by']", priority: 1 },
        { selector: "img[alt*='Image']", priority: 2 },
        { selector: "[data-testid='tweetPhoto'] img", priority: 1 },
        { selector: "img[srcset]", priority: 3 }
      ]
    },
    like_button: {
      patterns: [
        { selector: "svg[aria-label='Like']", priority: 1 },
        { selector: "svg[aria-label*='like' i]", priority: 1 },
        { selector: "[data-testid='like']", priority: 1 },
        { selector: "button[aria-label*='Like']", priority: 2 }
      ]
    },
    comment_button: {
      patterns: [
        { selector: "svg[aria-label='Comment']", priority: 1 },
        { selector: "svg[aria-label='Reply']", priority: 1 },
        { selector: "svg[aria-label*='comment' i]", priority: 1 },
        { selector: "[data-testid='reply']", priority: 1 },
        { selector: "button[aria-label*='Comment']", priority: 2 }
      ]
    },
    share_button: {
      patterns: [
        { selector: "svg[aria-label='Share']", priority: 1 },
        { selector: "svg[aria-label*='share' i]", priority: 1 },
        { selector: "button[aria-label*='Share']", priority: 2 }
      ]
    },
    repost_button: {
      patterns: [
        { selector: "svg[aria-label='Repost']", priority: 1 },
        { selector: "svg[aria-label='Retweet']", priority: 1 },
        { selector: "[data-testid='retweet']", priority: 1 },
        { selector: "button[aria-label*='Repost']", priority: 2 }
      ]
    },
    save_button: {
      patterns: [
        { selector: "svg[aria-label='Save']", priority: 1 },
        { selector: "svg[aria-label='Bookmark']", priority: 1 },
        { selector: "[data-testid='bookmark']", priority: 1 },
        { selector: "button[aria-label*='Save']", priority: 2 }
      ]
    },
    more_options: {
      patterns: [
        { selector: "svg[aria-label='More']", priority: 1 },
        { selector: "svg[aria-label='More options']", priority: 1 },
        { selector: "button[aria-label*='More']", priority: 2 }
      ]
    },
    like_count: {
      patterns: [
        { selector: "[data-testid='like'] span", priority: 1 },
        { selector: "a[href*='/liked_by/'] span", priority: 1 },
        { selector: "button span", priority: 3 }
      ]
    },
    comment_count: {
      patterns: [
        { selector: "[data-testid='reply'] span", priority: 1 },
        { selector: "a[href*='/comments/'] span", priority: 2 }
      ]
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 4: Analyze Each Container and Find Elements
  // ────────────────────────────────────────────────────────────────────────────

  const results = {};

  for (const [elementType, config] of Object.entries(elementTypes)) {
    console.log(`\n🔎 Searching for: ${elementType}`);

    const foundSelectors = [];

    // Test each pattern on all containers
    for (const pattern of config.patterns) {
      let totalFound = 0;
      let successfulContainers = 0;
      const sampleElements = [];

      for (const container of containers) {
        try {
          const elements = container.querySelectorAll(pattern.selector);
          if (elements.length > 0) {
            totalFound += elements.length;
            successfulContainers++;

            // Collect sample info
            if (sampleElements.length < 3) {
              for (let i = 0; i < Math.min(elements.length, 1); i++) {
                const elem = elements[i];
                const info = {
                  tag: elem.tagName.toLowerCase(),
                  text: elem.textContent.trim().substring(0, 50),
                  alt: elem.alt || null,
                  ariaLabel: elem.getAttribute('aria-label'),
                  href: elem.href || null
                };
                sampleElements.push(info);
              }
            }
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }

      if (successfulContainers > 0) {
        foundSelectors.push({
          selector: pattern.selector,
          priority: pattern.priority,
          foundInContainers: successfulContainers,
          totalElements: totalFound,
          samples: sampleElements
        });

        console.log(`   ✅ "${pattern.selector}"`);
        console.log(`      Found in ${successfulContainers}/${containers.length} posts (${totalFound} total)`);
        if (sampleElements.length > 0 && sampleElements[0].text) {
          console.log(`      Sample: "${sampleElements[0].text}"`);
        }
        if (sampleElements.length > 0 && sampleElements[0].ariaLabel) {
          console.log(`      Aria: "${sampleElements[0].ariaLabel}"`);
        }
      }
    }

    if (foundSelectors.length === 0) {
      console.log(`   ⚠️ No selectors found`);
    }

    results[elementType] = foundSelectors;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 5: Generate JSON Output
  // ────────────────────────────────────────────────────────────────────────────

  console.log("\n\n═══════════════════════════════════════════════════════════");
  console.log("  📋 RESULTS - Copy this JSON output");
  console.log("═══════════════════════════════════════════════════════════\n");

  const output = {
    platform: platform,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    post_container: {
      selector: containerSelector,
      count: containers.length,
      description: `${platform}: Post container`
    },
    elements: {}
  };

  // Add best selector for each element type
  for (const [elementType, selectors] of Object.entries(results)) {
    if (selectors.length > 0) {
      // Sort by priority and coverage
      selectors.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.foundInContainers - a.foundInContainers;
      });

      const best = selectors[0];
      const fallbacks = selectors.slice(1, 3).map(s => s.selector);

      output.elements[elementType] = {
        selector: best.selector,
        fallbackSelectors: fallbacks,
        coverage: `${best.foundInContainers}/${containers.length} posts`,
        totalElements: best.totalElements,
        sample: best.samples[0] || null,
        description: `${platform}: ${elementType.replace(/_/g, ' ')}`
      };
    }
  }

  console.log(JSON.stringify(output, null, 2));

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅ Analysis Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n📝 Instructions:");
  console.log("   1. Copy the JSON output above");
  console.log("   2. Give it to Claude with this prompt:");
  console.log('      "Convert this DOM analysis to platform_ids.json format"');
  console.log("   3. Claude will generate the perfect configuration!\n");

  // Also save to window for easy access
  window.domAnalysisResult = output;
  console.log("💾 Results also saved to: window.domAnalysisResult");
  console.log("   Access it with: copy(window.domAnalysisResult)\n");

})();
