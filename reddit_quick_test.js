// ═══════════════════════════════════════════════════════════════════════════════
// REDDIT QUICK SELECTOR TEST
// ═══════════════════════════════════════════════════════════════════════════════
// Run this in Reddit console to test all selectors instantly
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
  console.clear();
  console.log("🔍 REDDIT SELECTOR QUICK TEST\n");

  const tests = {
    "📦 Container": "shreddit-post",
    "👤 Username Link": "shreddit-post a[href^='/user/']",
    "🖼️ Profile Pic": "faceplate-img img",
    "📝 Post Title": "shreddit-post h1",
    "📄 Post Text": "div[slot='text-body']",
    "💬 Textarea": "shreddit-composer textarea",
    "🖼️ Image Container": "shreddit-aspect-ratio",
    "📷 Post Image": "shreddit-aspect-ratio img",
    "🎬 Post Video": "shreddit-player video",
    "⬆️ Upvote Button": "button[aria-label*='upvote' i]",
    "⬇️ Downvote Button": "button[aria-label*='downvote' i]",
    "🔢 Vote Count": "faceplate-number[pretty]",
    "💬 Comment Button": "button[aria-label*='comment' i]",
    "🔢 Comment Count": "span[id*='comment-count']",
    "🔗 Share Button": "button[aria-label*='share' i]",
    "💾 Save Button": "button[aria-label*='save' i]",
    "⋯ More Options": "button[aria-label*='more options' i]",
    "⏰ Timestamp": "time[datetime]"
  };

  const results = {};

  for (const [name, selector] of Object.entries(tests)) {
    try {
      const elements = document.querySelectorAll(selector);
      const found = elements.length;

      if (found > 0) {
        const sample = elements[0];
        const text = sample.textContent?.trim().substring(0, 50) || '';
        const href = sample.href || '';
        const src = sample.src || '';
        const ariaLabel = sample.getAttribute('aria-label') || '';

        console.log(`✅ ${name}: ${found} found`);
        console.log(`   Selector: "${selector}"`);

        if (text) console.log(`   Text: "${text}"`);
        if (href) console.log(`   Href: "${href}"`);
        if (src) console.log(`   Src: "${src.substring(0, 60)}..."`);
        if (ariaLabel) console.log(`   Aria: "${ariaLabel}"`);
        console.log('');

        results[name] = {
          selector: selector,
          count: found,
          works: true,
          sample: { text, href, src, ariaLabel }
        };
      } else {
        console.log(`❌ ${name}: NOT FOUND`);
        console.log(`   Selector: "${selector}"\n`);
        results[name] = {
          selector: selector,
          count: 0,
          works: false
        };
      }
    } catch (e) {
      console.log(`⚠️ ${name}: ERROR`);
      console.log(`   Selector: "${selector}"`);
      console.log(`   Error: ${e.message}\n`);
      results[name] = {
        selector: selector,
        error: e.message,
        works: false
      };
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("📊 SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  const working = Object.values(results).filter(r => r.works).length;
  const total = Object.keys(results).length;

  console.log(`✅ Working: ${working}/${total}`);
  console.log(`❌ Missing: ${total - working}/${total}\n`);

  console.log("📋 Copy results:");
  console.log("copy(JSON.stringify(window.redditTestResults, null, 2))\n");

  window.redditTestResults = results;

  // Generate working selectors JSON
  const workingSelectors = {};
  for (const [name, data] of Object.entries(results)) {
    if (data.works) {
      workingSelectors[name.replace(/[^\w]/g, '_').toLowerCase()] = {
        selector: data.selector,
        count: data.count,
        sample: data.sample
      };
    }
  }

  window.redditWorkingSelectors = workingSelectors;
  console.log("✅ Working selectors saved to: window.redditWorkingSelectors");
  console.log("📋 Copy: copy(JSON.stringify(window.redditWorkingSelectors, null, 2))");

})();
