# 🎯 REDDIT BEST SELECTORS

Based on analysis of modern Reddit (2024-2025), here are the most reliable CSS selectors:

## 📦 POST CONTAINER
```css
shreddit-post
/* or fallback */
article
```

---

## 👤 PROFILE SECTION

### Profile Container
```css
div[slot='credit-bar']
shreddit-post-header
```

### Username
```css
a[href^='/user/']
a[href^='/u/']
faceplate-tracker[source='post'] a
```
**Extract from:** `href` attribute (e.g., `/user/john_doe` → `john_doe`)

### User ID (Same as username on Reddit)
```css
a[href^='/user/']
[data-author]
```

### Profile Picture
```css
faceplate-img img
img[alt*='Avatar']
shreddit-post-header img
```

---

## 📝 CONTENT SECTION

### Post Title
```css
h1
a[slot='title']
div[slot='title']
```

### Post Text (Body)
```css
div[slot='text-body']
div[id*='-post-rtjson-content']
```

### Textarea (Comment Input)
```css
shreddit-composer textarea
textarea[placeholder*='Add a comment']
faceplate-form textarea
```

---

## 🖼️ MEDIA SECTION

### Image/Video Container
```css
shreddit-player
div[slot='post-media-container']
shreddit-aspect-ratio
```

### Post Image
```css
shreddit-aspect-ratio img
img[src*='preview.redd.it']
img[src*='i.redd.it']
```

### Post Video
```css
shreddit-player video
video[src*='v.redd.it']
```

---

## 👍 REACTION PANEL & COUNTS

### Reaction Panel (Action Bar)
```css
shreddit-post faceplate-batch
div[slot='actionRow']
```

### Upvote Button
```css
button[aria-label*='upvote' i]
button[icon='upvote']
shreddit-post-action-bar button[icon='upvote']
```

### Downvote Button
```css
button[aria-label*='downvote' i]
button[icon='downvote']
```

### Vote Count (Score)
```css
faceplate-number[pretty]
span[id*='vote-count']
shreddit-post faceplate-number
```

### Comment Button
```css
button[aria-label*='comment' i]
a[aria-label*='comment' i]
```

### Comment Count
```css
span[id*='comment-count']
button[aria-label*='comment' i] faceplate-number
```

### Share Button
```css
button[aria-label*='share' i]
button[icon='share']
```

### Save Button
```css
button[aria-label*='save' i]
button[icon='save']
```

### More Options
```css
button[aria-label*='more options' i]
button[icon='overflow-horizontal']
```

---

## 🔍 VERIFICATION TIPS

To test these selectors on Reddit:

1. Open Reddit in browser
2. Press F12 → Console
3. Run:
```javascript
// Test container
document.querySelectorAll('shreddit-post').length

// Test username
document.querySelector('shreddit-post a[href^="/user/"]')?.textContent

// Test vote count
document.querySelector('faceplate-number[pretty]')?.textContent

// Test comment count
document.querySelector('span[id*="comment-count"]')?.textContent
```

---

## ⚠️ IMPORTANT NOTES

1. **Reddit uses Web Components** (`shreddit-*`, `faceplate-*`)
2. **Shadow DOM may be used** - some elements might be in shadow roots
3. **Old Reddit vs New Reddit** - these selectors are for NEW Reddit
4. **Dynamic content** - vote/comment counts update in real-time
5. **Mobile vs Desktop** - selectors may differ between views

---

## 🎨 PRIORITY RECOMMENDATIONS

### HIGH PRIORITY (Most Reliable)
- Container: `shreddit-post`
- Username: `a[href^='/user/']`
- Vote count: `faceplate-number[pretty]`
- Comment count: `span[id*='comment-count']`
- Buttons: `button[aria-label*='...']` patterns

### MEDIUM PRIORITY
- Images: `shreddit-aspect-ratio img`
- Text: `div[slot='text-body']`
- Textarea: `shreddit-composer textarea`

### LOW PRIORITY (May need refinement)
- Profile picture: `faceplate-img img` (multiple matches possible)
- Links: `a[href^='/']` (too broad)

---

## 📊 SELECTOR SPECIFICITY

**Best Practice Order:**
1. Custom element tags (`shreddit-post`, `faceplate-number`)
2. Data attributes (`[data-author]`, `[slot='...']`)
3. ARIA labels (`[aria-label*='upvote']`)
4. ID patterns (`[id*='comment-count']`)
5. Class names (least reliable - often obfuscated)

---

Generated: 2025-11-16
Platform: Reddit (New Design)
