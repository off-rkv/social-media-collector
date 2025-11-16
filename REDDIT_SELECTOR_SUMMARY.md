# 📊 REDDIT SELECTOR ANALYSIS - SUMMARY

**Date:** 2025-11-16
**Platform:** Reddit (New Design)
**Status:** ✅ **COMPLETE!** (20/21 selectors working, 1 TODO)

---

## ✅ WORKING SELECTORS (20/21)

These selectors are **confirmed working** and added to `platform_ids.json`:

| Element | Class ID | Selector | Status |
|---------|----------|----------|--------|
| **Container** | 100 | `shreddit-post` | ✅ Working |
| **Profile Picture** | 101 | `[slot='credit-bar'] img` | ✅ Working |
| **Subreddit Name** | 102 | `[slot='credit-bar'] a[data-testid='subreddit-name']` | ✅ Working |
| **Username** | 103 | `a.author-name` | ✅ Working |
| **Post Title** | 104 | `a[slot='title']` | ✅ Working |
| **Post Text** | 105 | `div[id*='-post-rtjson-content']` | ✅ Working |
| **Image Container** | 106 | `div[slot='post-media-container']` | ✅ Working |
| **Post Image** | 107 | `shreddit-aspect-ratio img` | ✅ Working |
| **Post Video** | 108 | `shreddit-player video` | ⚠️ Only on video posts |
| **Vote Count** | 109 | `faceplate-number[pretty]` | ✅ Working |
| **Timestamp** | 110 | `time[datetime]` | ✅ Working |
| **Upvote Button** | 111 | `button[upvote]` | ✅ Working |
| **Downvote Button** | 112 | `button[downvote]` | ✅ Working |
| **Comment Button** | 113 | `button[data-post-click-location='comments-button']` | ✅ Working |
| **Comment Count** | 114 | `button[data-post-click-location='comments-button'] faceplate-number` | ✅ Working |
| **Share Button** | 115 | `shreddit-post-share-button` | ✅ Working |
| **Award Button** | 117 | `award-button` | ✅ Working |
| **More Options** | 118 | `shreddit-post-overflow-menu` | ✅ Working |
| **Comment Textarea** | 119 | `shreddit-composer textarea` | ⚠️ Only after clicking "Add comment" |
| **Reaction Panel** | 120 | `div[data-testid='action-row']` | ✅ Working |

---

## ❌ STILL MISSING (1/21)

| Element | Class ID | Status |
|---------|----------|--------|
| **Save Button** | 116 | 🔍 Need to find - likely hidden in overflow menu or requires interaction |

---

## 🔍 NEXT STEPS TO FIND MISSING SELECTORS

### Step 1: Run Button Finder Script

1. **Stay on Reddit** (reddit.com)
2. Press **F12** → **Console**
3. Copy and paste **`reddit_find_buttons.js`** into console
4. Press **Enter**
5. **Read the output** - it will show you:
   - All buttons found
   - Button `aria-label` attributes
   - Button `icon` attributes
   - Shadow DOM elements
   - Custom element types

### Step 2: Open a Post Detail Page

Some buttons only appear when you open a post:

1. **Click on any Reddit post** to open it
2. **Run `reddit_find_buttons.js` again**
3. Compare results

### Step 3: Activate Comment Textarea

1. **Click "Add a comment"** or "Reply" on a post
2. **Run `reddit_find_buttons.js` again**
3. Look for textarea elements

### Step 4: Manual Inspection

For any remaining missing elements:

1. **Right-click the element** (e.g., upvote button)
2. **Click "Inspect"**
3. In Elements tab, note:
   - Tag name
   - `aria-label` attribute
   - `icon` attribute
   - Parent elements
4. Test selector in console:
   ```javascript
   post = document.querySelector('shreddit-post');
   post.querySelector('YOUR_SELECTOR_HERE');
   ```

---

## 📋 EXPECTED BUTTON ATTRIBUTES

Based on Reddit's typical structure, buttons likely use:

### Upvote/Downvote
```html
<button aria-label="Upvote" icon="upvote">
<button aria-label="Downvote" icon="downvote">
```
**Possible selectors:**
- `button[aria-label*='upvote' i]`
- `button[icon='upvote']`
- `shreddit-post button[aria-label*='Upvote']`

### Comment Button
```html
<a aria-label="Comment" href="/r/.../comments/...">
<button aria-label="Comment" icon="comment">
```
**Possible selectors:**
- `a[aria-label*='comment' i]`
- `button[aria-label*='comment' i]`
- `a[href*='/comments/']`

### Share Button
```html
<button aria-label="Share" icon="share">
```
**Possible selectors:**
- `button[aria-label*='share' i]`
- `button[icon='share']`

### Save Button
```html
<button aria-label="Save" icon="bookmark">
```
**Possible selectors:**
- `button[aria-label*='save' i]`
- `button[icon='bookmark']`

---

## 🎯 HOW TO UPDATE platform_ids.json

Once you find a working selector:

1. Open `config/platform_ids.json`
2. Find the element (e.g., `reddit_upvote_button`)
3. Replace `"selector": "TODO"` with the working selector
4. Example:
   ```json
   "reddit_upvote_button": {
     "selector": "button[aria-label='Upvote']",
     "fallbackSelectors": [
       "button[icon='upvote']"
     ],
     "classId": 111,
     "description": "Reddit: Upvote button"
   }
   ```

---

## 🔧 DEBUGGING TIPS

### If selectors return too many results:
```javascript
// Be more specific
post.querySelector('shreddit-post button[icon="upvote"]')
```

### If selectors return nothing:
1. Check if element is in **Shadow DOM**
2. Try broader selectors:
   ```javascript
   post.querySelectorAll('button')  // Get all buttons
   ```
3. Inspect element attributes manually

### Check for custom attributes:
```javascript
button = post.querySelector('button');
console.log(button.attributes);  // See all attributes
```

---

## 📊 REDDIT-SPECIFIC NOTES

### Custom Web Components
Reddit uses custom elements like:
- `<shreddit-post>` - Post container
- `<shreddit-aspect-ratio>` - Image wrapper
- `<shreddit-player>` - Video player
- `<faceplate-number>` - Vote count display
- `<faceplate-img>` - Image wrapper

### Data Attributes
Common data attributes:
- `[data-testid='subreddit-name']`
- `[data-author]`
- `[id*='post-title']`
- `[id*='comment-count']`

### Slot Attributes
Reddit uses slots for content:
- `[slot='credit-bar']` - Header area
- `[slot='title']` - Post title
- `[slot='text-body']` - Post text
- `[slot='post-media-container']` - Media
- `[slot='actionRow']` - Buttons (likely)

---

## 🚀 QUICK REFERENCE

### Test a selector:
```javascript
post = document.querySelector('shreddit-post');
post.querySelector('YOUR_SELECTOR');
```

### Get all elements of type:
```javascript
post.querySelectorAll('button');
```

### Check element attributes:
```javascript
elem = post.querySelector('button');
console.log(elem.getAttribute('aria-label'));
console.log(elem.getAttribute('icon'));
```

### Export results:
```javascript
copy(JSON.stringify(window.redditSelectorResults, null, 2));
```

---

## ✅ FILES CREATED

1. **`reddit_selector_finder.js`** - Advanced $0-based selector finder
2. **`reddit_quick_test.js`** - Quick test of all selectors
3. **`reddit_find_buttons.js`** - ⭐ **Use this to find missing buttons!**
4. **`REDDIT_BEST_SELECTORS.md`** - Reference guide
5. **`config/platform_ids.json`** - ✅ **Updated with Reddit config (Class IDs 100-120)**

---

## 📞 NEXT ACTION

**Run this in Reddit console:**
```javascript
// Paste contents of reddit_find_buttons.js
```

Then send me the output, and I'll help you identify the correct selectors! 🚀
