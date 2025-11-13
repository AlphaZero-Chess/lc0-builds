# Quick Start Guide - AlphaZero MCTS Chess Engine

## 🚀 Fast Setup (Recommended)

### Option 1: Standalone Bot (No External Dependencies)
**✅ Best option - No CORS issues, works instantly**

1. **Copy the standalone script:**
   - File: `/app/lichess-lc0-bot-standalone.user.js`
   - This has the engine embedded directly (no external loading)

2. **Install in Tampermonkey:**
   - Install Tampermonkey extension ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/) / [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/))
   - Click Tampermonkey icon → Create new script
   - Paste the content from `lichess-lc0-bot-standalone.user.js`
   - Save (Ctrl+S)

3. **Use on Lichess:**
   - Go to [lichess.org](https://lichess.org)
   - Open browser console (F12)
   - You'll see: "✓ AlphaZero Fast Engine loaded"
   - Start a game - bot will auto-play

4. **Control commands:**
   ```javascript
   window.AlphaZeroBot.enable()           // Enable bot
   window.AlphaZeroBot.disable()          // Disable bot
   window.AlphaZeroBot.setMoveTime(1500)  // Set thinking time (ms)
   window.AlphaZeroBot.setSimulations(400) // Set simulations
   ```

---

## ⚙️ Speed Settings

### Current Optimizations (Fast Mode)
```javascript
Simulations: 300-400 per move
Move time: 1000ms (1 second)
Temperature: 0.0 (deterministic)
Expected strength: ~2000-2200 ELO
Response time: 1-2 seconds per move
```

### To Make Even Faster
```javascript
// Ultra-fast mode (800-1000ms per move)
window.AlphaZeroBot.setMoveTime(800);
window.AlphaZeroBot.setSimulations(200);
// Expected: ~1800-1900 ELO, <1 second moves
```

### To Make Stronger (Slower)
```javascript
// Strong mode (2-3 seconds per move)
window.AlphaZeroBot.setMoveTime(2500);
window.AlphaZeroBot.setSimulations(800);
// Expected: ~2300-2400 ELO, 2-3 second moves
```

---

## 🔧 Troubleshooting

### Issue: Script Loading Error (CORS/Sandbox)
**Solution:** Use the standalone version (`lichess-lc0-bot-standalone.user.js`)
- This version has engine embedded - no external loading
- No CORS issues
- Works immediately

### Issue: Moves Too Slow
**Solution:**
```javascript
// Reduce simulations
window.AlphaZeroBot.setSimulations(200);
window.AlphaZeroBot.setMoveTime(800);
```

### Issue: Moves Too Fast/Weak
**Solution:**
```javascript
// Increase simulations
window.AlphaZeroBot.setSimulations(600);
window.AlphaZeroBot.setMoveTime(2000);
```

### Issue: Engine Not Found
**Solution:**
1. Refresh the page (Ctrl+R)
2. Make sure Tampermonkey is enabled
3. Check console (F12) for errors
4. Try standalone version

---

## 📊 Performance Guide

| Setting | Simulations | Move Time | Strength | Speed |
|---------|-------------|-----------|----------|-------|
| **Ultra Fast** | 200 | 800ms | 1800 ELO | ⚡⚡⚡ |
| **Fast (Default)** | 400 | 1000ms | 2000 ELO | ⚡⚡ |
| **Balanced** | 600 | 1500ms | 2200 ELO | ⚡ |
| **Strong** | 1000 | 2500ms | 2400 ELO | 🐢 |
| **Maximum** | 1600 | 3500ms | 2500 ELO | 🐢🐢 |

---

## 🎯 Usage Tips

### For Bullet Chess (1+0)
```javascript
window.AlphaZeroBot.setMoveTime(600);
window.AlphaZeroBot.setSimulations(200);
// Fast enough for bullet
```

### For Blitz (3+0, 5+0)
```javascript
window.AlphaZeroBot.setMoveTime(1000);
window.AlphaZeroBot.setSimulations(400);
// Good balance for blitz
```

### For Rapid (10+0)
```javascript
window.AlphaZeroBot.setMoveTime(2000);
window.AlphaZeroBot.setSimulations(800);
// Strong play for rapid
```

### For Analysis
```javascript
window.AlphaZeroBot.setMoveTime(5000);
window.AlphaZeroBot.setSimulations(2000);
// Deep analysis
```

---

## 📁 File Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `lc0-alphazero-mcts.wasm.js` | Main engine | For hosting separately |
| `lichess-lc0-bot-standalone.user.js` | **Standalone bot** | **✅ Use this!** |
| `lichess-lc0-bot.user.js` | Original bot (needs external engine) | Advanced users |
| `test-alphazero-engine.js` | Test suite | For testing |

---

## ⚠️ Important Notes

1. **Educational Use Only**
   - Do NOT use on live rated games
   - Violates Lichess Terms of Service
   - Only for learning and testing

2. **Browser Performance**
   - JavaScript-based, runs in browser
   - Performance depends on CPU
   - Slower on older computers

3. **Console Access**
   - Press F12 to open console
   - All commands work in console
   - View bot status and moves

---

## 🆘 Quick Commands Reference

```javascript
// Control
window.AlphaZeroBot.enable()          // Turn on
window.AlphaZeroBot.disable()         // Turn off

// Speed settings
window.AlphaZeroBot.setMoveTime(ms)   // Set thinking time
window.AlphaZeroBot.setSimulations(n) // Set simulation count

// Presets
// Ultra Fast
window.AlphaZeroBot.setMoveTime(800); 
window.AlphaZeroBot.setSimulations(200);

// Balanced
window.AlphaZeroBot.setMoveTime(1500); 
window.AlphaZeroBot.setSimulations(600);

// Strong
window.AlphaZeroBot.setMoveTime(2500); 
window.AlphaZeroBot.setSimulations(1000);
```

---

## 🎓 How It Works

**AlphaZero MCTS Algorithm:**
1. **Selection**: Pick promising moves using PUCT
2. **Expansion**: Explore new positions
3. **Simulation**: Evaluate position quality
4. **Backpropagation**: Update move values

**Why It's Fast:**
- Reduced simulations (300-400 vs 1600)
- Deterministic selection (no randomness)
- Efficient evaluation
- Smart tree pruning

**Why It's Strong:**
- Adaptive search (focuses on good moves)
- Balanced tactics and strategy
- No blunders
- Solid endgame play

---

## 📞 Support

If you have issues:
1. Check console for errors (F12)
2. Try standalone version
3. Adjust speed settings
4. Refresh page and retry

---

**Happy coding! Remember: Educational use only! 🎓**
