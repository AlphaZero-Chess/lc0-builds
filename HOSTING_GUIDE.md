# Hosting Guide for AlphaZero Engine with @require

## Problem: CORS/Sandbox Restrictions

When using `@require` with raw.githubusercontent.com, browsers block the script due to:
- Sandboxed iframe restrictions
- CORS (Cross-Origin Resource Sharing) policies
- Content Security Policy (CSP) restrictions

## ✅ Solutions (3 Options)

---

## Option 1: jsDelivr CDN (Recommended) ⭐

**Easiest and most reliable - No configuration needed!**

### Steps:

1. **Push your repository to GitHub:**
   ```bash
   git add .
   git commit -m "Add AlphaZero engine"
   git push origin main
   ```

2. **Update @require URL in bot script:**
   ```javascript
   // @require https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/lc0-alphazero-mcts.wasm.js
   ```

   Replace:
   - `YOUR_USERNAME` → Your GitHub username
   - `YOUR_REPO` → Your repository name

   **Example:**
   ```javascript
   // @require https://cdn.jsdelivr.net/gh/johndoe/chess-engine@main/lc0-alphazero-mcts.wasm.js
   ```

3. **Wait 5-10 minutes** for jsDelivr to cache your file

4. **Test the URL** in browser:
   - Open: `https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/lc0-alphazero-mcts.wasm.js`
   - You should see the JavaScript code

### Advantages:
✅ Free forever
✅ Fast CDN (global edge servers)
✅ No CORS issues
✅ Automatic updates when you push to GitHub
✅ No configuration needed

### Disadvantages:
⚠️ 5-10 minute cache delay for updates
⚠️ Requires public GitHub repository

---

## Option 2: GitHub Pages

**Good alternative if you want more control**

### Steps:

1. **Enable GitHub Pages:**
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Source: Select **main** branch
   - Folder: Select **/ (root)**
   - Click **Save**

2. **Wait 2-3 minutes** for GitHub to build your site

3. **Update @require URL:**
   ```javascript
   // @require https://YOUR_USERNAME.github.io/YOUR_REPO/lc0-alphazero-mcts.wasm.js
   ```

   **Example:**
   ```javascript
   // @require https://johndoe.github.io/chess-engine/lc0-alphazero-mcts.wasm.js
   ```

4. **Test the URL** in browser

### Advantages:
✅ Free
✅ No CORS issues
✅ Direct control
✅ Fast updates (2-3 minutes)

### Disadvantages:
⚠️ Requires public repository
⚠️ Extra setup step

---

## Option 3: Self-Hosting

**Maximum control, but more work**

### Steps:

1. **Get hosting** (one of these):
   - [Netlify](https://www.netlify.com/) (Free)
   - [Vercel](https://vercel.com/) (Free)
   - [Cloudflare Pages](https://pages.cloudflare.com/) (Free)
   - Your own web server

2. **Upload `lc0-alphazero-mcts.wasm.js`** to your hosting

3. **Configure CORS headers** (IMPORTANT!):
   
   **For Netlify** - Create `netlify.toml`:
   ```toml
   [[headers]]
     for = "/*.js"
     [headers.values]
       Access-Control-Allow-Origin = "*"
       Content-Type = "application/javascript"
   ```

   **For Vercel** - Create `vercel.json`:
   ```json
   {
     "headers": [
       {
         "source": "/(.*).js",
         "headers": [
           {
             "key": "Access-Control-Allow-Origin",
             "value": "*"
           },
           {
             "key": "Content-Type",
             "value": "application/javascript"
           }
         ]
       }
     ]
   }
   ```

   **For Cloudflare Pages** - Add in dashboard:
   ```
   Access-Control-Allow-Origin: *
   Content-Type: application/javascript
   ```

4. **Update @require URL:**
   ```javascript
   // @require https://your-domain.com/lc0-alphazero-mcts.wasm.js
   ```

### Advantages:
✅ Full control
✅ Custom domain
✅ Instant updates
✅ Private hosting possible

### Disadvantages:
⚠️ More setup required
⚠️ Need to configure CORS
⚠️ May require paid hosting for private files

---

## Quick Setup Examples

### Example 1: Using jsDelivr (Fastest)

1. **Your GitHub repo:** `https://github.com/johndoe/chess-engine`

2. **Your @require line:**
   ```javascript
   // @require https://cdn.jsdelivr.net/gh/johndoe/chess-engine@main/lc0-alphazero-mcts.wasm.js
   ```

3. **Done!** Wait 5-10 minutes after pushing to GitHub

### Example 2: Using GitHub Pages

1. **Enable Pages** in Settings → Pages

2. **Your GitHub Pages URL:** `https://johndoe.github.io/chess-engine/`

3. **Your @require line:**
   ```javascript
   // @require https://johndoe.github.io/chess-engine/lc0-alphazero-mcts.wasm.js
   ```

4. **Done!** Wait 2-3 minutes

---

## Testing Your Setup

### Test 1: Direct URL Access
Open your engine URL in browser:
```
https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/lc0-alphazero-mcts.wasm.js
```

You should see JavaScript code starting with:
```javascript
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AlphaZero-Style Lc0 Chess Engine - MCTS + PUCT Implementation
 * ═══════════════════════════════════════════════════════════════════════════
```

### Test 2: Browser Console
1. Open Lichess.org
2. Press F12 (console)
3. Paste and run:
   ```javascript
   fetch('https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/lc0-alphazero-mcts.wasm.js')
     .then(r => r.text())
     .then(t => console.log('Engine loaded:', t.length, 'bytes'))
     .catch(e => console.error('Failed:', e));
   ```

Should output: `Engine loaded: XXXXX bytes`

### Test 3: Bot Loading
1. Install bot script in Tampermonkey
2. Go to Lichess
3. Check console for:
   ```
   ✓ AlphaZero Fast Engine loaded
   ✓ AlphaZero Bot loaded successfully!
   ```

---

## Troubleshooting

### Issue: "window.LEELA() not found"

**Cause:** Engine file not loading

**Solutions:**
1. Check URL is accessible in browser
2. Wait 5-10 minutes (jsDelivr cache)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check GitHub repository is public
5. Try GitHub Pages instead

### Issue: CORS Error

**Cause:** Server not allowing cross-origin requests

**Solutions:**
1. **jsDelivr:** No CORS issues (use this!)
2. **GitHub Pages:** No CORS issues
3. **Self-hosted:** Add CORS headers (see Option 3)

### Issue: 404 Not Found

**Cause:** Wrong URL or file not uploaded

**Solutions:**
1. Check filename matches exactly: `lc0-alphazero-mcts.wasm.js`
2. Check file is in repository root
3. Check branch name (main vs master)
4. Wait for GitHub Pages to build (2-3 min)

### Issue: Sandbox Error (from your screenshot)

**Cause:** Using raw.githubusercontent.com

**Solution:** Switch to jsDelivr or GitHub Pages (see above)

---

## Recommended Setup

**For most users:**
1. ✅ Use **jsDelivr CDN** (Option 1)
2. ✅ Public GitHub repository
3. ✅ Simple, fast, reliable

**URL format:**
```javascript
// @require https://cdn.jsdelivr.net/gh/YOUR_USERNAME/YOUR_REPO@main/lc0-alphazero-mcts.wasm.js
```

---

## File Checklist

Make sure these files are in your repository:

```
your-repo/
├── lc0-alphazero-mcts.wasm.js          ← Must be in root!
├── lichess-lc0-bot-require.user.js     ← Bot script
├── README.md
└── other files...
```

---

## Security Notes

1. **Public Repository Required** for free hosting options
   - jsDelivr requires public repo
   - GitHub Pages requires public repo
   - Consider this before hosting

2. **Content Delivery**
   - All free options serve files publicly
   - Anyone can access your engine URL
   - This is normal for userscripts

3. **Private Hosting**
   - Use Option 3 (Self-hosting) with authentication
   - Requires paid hosting or own server
   - More complex setup

---

## Quick Reference

| Hosting Method | URL Format | Setup Time | CORS Issues | Cost |
|----------------|------------|------------|-------------|------|
| **jsDelivr (Recommended)** | `cdn.jsdelivr.net/gh/USER/REPO@main/file.js` | 5-10 min | ✅ None | Free |
| **GitHub Pages** | `USER.github.io/REPO/file.js` | 2-3 min | ✅ None | Free |
| **Self-Hosted** | `your-domain.com/file.js` | Varies | ⚠️ Need config | Free-Paid |

---

## Complete Working Example

### 1. Files in GitHub repo:
```
my-chess-bot/
├── lc0-alphazero-mcts.wasm.js
└── lichess-lc0-bot-require.user.js
```

### 2. Bot script @require line:
```javascript
// @require https://cdn.jsdelivr.net/gh/myusername/my-chess-bot@main/lc0-alphazero-mcts.wasm.js
```

### 3. Installation:
1. Push to GitHub
2. Wait 5-10 minutes
3. Install bot script in Tampermonkey
4. Go to Lichess
5. ✅ Works!

---

## Still Having Issues?

If none of the above work:

1. **Use standalone version instead:**
   - File: `/app/lichess-lc0-bot-standalone.user.js`
   - No external hosting needed
   - Engine embedded directly
   - Works immediately

2. **Check browser console** (F12) for specific error messages

3. **Verify your files are uploaded correctly** to GitHub

---

**Recommended: Use jsDelivr CDN for easiest setup with @require!** ✅
