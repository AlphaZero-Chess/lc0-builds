# Testing the Recovery System

## Quick Test Commands

### 1. Check System Status
```javascript
// In browser console on Lichess
window.Lc0Bot.checkHealth()
```

**Expected Output:**
- Shows current processing state
- Shows error counts
- Shows time since last activity
- Health status message

### 2. View Statistics
```javascript
window.Lc0Bot.showStats()
```

**Expected Output:**
- Moves played
- Average think time
- Error counts
- Recovery counts (should be 0 if stable)
- Timeout counts

### 3. Test Manual Recovery
```javascript
window.Lc0Bot.forceRecovery()
```

**Expected Output:**
- "Recovery initiated"
- Console logs showing recovery process
- System resets and is ready

### 4. Monitor Watchdog
The watchdog runs automatically every 5 seconds. Check console for:
```
[Lc0Bot] Watchdog started
```

### 5. Test Scenarios

#### Scenario A: Normal Game
1. Start a game on Lichess
2. Watch console for engine activity
3. Verify moves are made
4. Check health periodically
5. Verify no errors

#### Scenario B: Force Stuck State (Testing)
1. Open browser console
2. Run: `STATE.processingMove = true`
3. Wait 20+ seconds
4. Watch watchdog detect and recover
5. Verify system continues working

#### Scenario C: Multiple Errors
1. Simulate network issues
2. Watch error counter increase
3. After 3 errors, auto-recovery triggers
4. System resets and continues

## Success Criteria

✅ **Recovery System Working If:**
1. Watchdog starts on initialization
2. Health checks show valid data
3. Manual recovery works
4. No stuck states last >20 seconds
5. Stats show recovery counts when needed
6. Games continue without manual refresh

## Console Output Examples

### Healthy System
```
[Lc0Bot] 🧠 Real Lc0 Chess Engine - JavaScript Implementation
[Lc0Bot] ✓ WebSocket proxy installed
[Lc0Bot] ✓ Engine initialization started
[Lc0Bot] ✓ Watchdog system started
[Lc0Bot] 📊 Analyzing position 1 (White to move)
[Lc0Bot] ✓ Best move selected: e2e4
[Lc0Bot] 📤 Move sent: e2e4
```

### Recovery in Action
```
[Lc0Bot] ⏱️ Engine timeout - no response received
[Lc0Bot] 🔧 Force recovery triggered: Engine timeout
[Lc0Bot] ✓ Recovery complete - system reset
[Lc0Bot] Retrying position analysis after recovery
[Lc0Bot] 📊 Analyzing position 2 (Black to move)
```

### Watchdog Detection
```
[Lc0Bot] Processing stuck for 21000ms - forcing recovery
[Lc0Bot] 🔧 Force recovery triggered: Processing timeout
[Lc0Bot] ✓ Recovery complete - system reset
```

## Troubleshooting

### If Bot Seems Stuck
1. Run `window.Lc0Bot.checkHealth()`
2. If processingTime > 20000ms, watchdog should auto-recover
3. If not, manually run `window.Lc0Bot.forceRecovery()`
4. Check console for error messages

### If Moves Aren't Made
1. Check `CONFIG.enabled` (should be true)
2. Check `CONFIG.playAsWhite` and `CONFIG.playAsBlack`
3. Verify it's your turn
4. Check WebSocket connection
5. Try manual recovery

### If Errors Keep Occurring
1. Check internet connection
2. Verify Lichess website is working
3. Look for JavaScript errors in console
4. Try `window.Lc0Bot.resetErrors()`
5. Reload page as last resort

## Performance Monitoring

### Key Metrics to Watch
```javascript
// Get full state
window.Lc0Bot.getState()

// Get configuration
window.Lc0Bot.getConfig()

// Get current position
window.Lc0Bot.getCurrentFen()

// Get analysis data
window.Lc0Bot.getAnalysis()
```

## Advanced Testing

### Stress Test
1. Start rapid game (1+0 or 3+0)
2. Monitor for any timeouts
3. Check if recovery needed
4. Verify consistent performance

### Long Game Test  
1. Start long game (15+10)
2. Let bot play for 20+ moves
3. Monitor stability
4. Check error accumulation
5. Verify no memory leaks

### Network Interruption Test
1. Start game
2. Temporarily disable network
3. Re-enable network
4. Verify recovery and continuation
5. Check recovery count increased

## Automated Test (If Possible)

```javascript
// Simulate full recovery cycle
async function testRecovery() {
    console.log('Starting recovery test...');
    
    // Force stuck state
    STATE.processingMove = true;
    STATE.processingStartTime = Date.now() - 25000;
    
    // Wait for watchdog (runs every 5s)
    await new Promise(r => setTimeout(r, 6000));
    
    // Check if recovered
    const health = window.Lc0Bot.checkHealth();
    
    if (!health.processingMove) {
        console.log('✅ AUTO-RECOVERY TEST PASSED');
    } else {
        console.log('❌ AUTO-RECOVERY TEST FAILED');
    }
}

// Run test
testRecovery();
```

## Expected Behavior Summary

| Situation | Old Bot | New Bot (Patched) |
|-----------|---------|-------------------|
| Engine timeout | Stuck forever | Auto-recover in 15s |
| Network error | Stuck forever | Auto-recover + retry |
| Invalid move | Stuck forever | Auto-recover + reset |
| Processing >20s | Stuck forever | Watchdog recovers |
| 3+ errors | Stuck forever | Auto-recover |
| Manual recovery | Not available | Works instantly |

## Final Validation

After playing a few games, run:
```javascript
window.Lc0Bot.showStats()
```

✅ **Patch Success Indicators:**
- `recoveries` counter exists (even if 0)
- `timeouts` counter exists (even if 0)
- `errors` are low (<5% of moves)
- `movesPlayed` increasing steadily
- No stuck states observed

🎉 **If all checks pass, the patch is working perfectly!**
