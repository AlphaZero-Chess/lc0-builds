# Recovery System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CHESS ENGINE BOT                         │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Position Received from Lichess              │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │    Set processingMove = true                       │   │
│  │    Set processingStartTime = now                   │   │
│  │    Start Engine Timeout Timer (15s)                │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Send Position to Engine                     │   │
│  │         (ucinewgame + position fen + go)           │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│         ┌───────────┴────────────┬─────────────┐          │
│         │                        │             │          │
│         ▼                        ▼             ▼          │
│    ┌─────────┐            ┌──────────┐  ┌──────────┐    │
│    │ Engine  │            │ Timeout  │  │ Watchdog │    │
│    │Response │            │ (15s)    │  │ (5s int) │    │
│    │  OK     │            │          │  │          │    │
│    └────┬────┘            └─────┬────┘  └────┬─────┘    │
│         │                       │            │          │
│         ▼                       ▼            ▼          │
│  ┌─────────────┐      ┌──────────────┐  ┌─────────┐   │
│  │ Clear       │      │ RECOVERY     │  │ Check   │   │
│  │ Timeout     │      │ TRIGGERED    │  │ Health  │   │
│  │ Reset Flags │      │              │  │         │   │
│  │ Send Move   │      └──────┬───────┘  └────┬────┘   │
│  └─────────────┘             │               │        │
│                              ▼               ▼        │
│                       ┌──────────────────────────┐   │
│                       │  Force Recovery:         │   │
│                       │  1. Clear all timers     │   │
│                       │  2. Stop engine          │   │
│                       │  3. Reset all flags      │   │
│                       │  4. Retry if position OK │   │
│                       └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Protection Layers

```
Layer 1: Try-Finally Blocks
    ↓ (Always executes cleanup)
    
Layer 2: Engine Timeout (15s)
    ↓ (Catches stuck engine)
    
Layer 3: Processing Max Time (20s)
    ↓ (Watchdog detects)
    
Layer 4: Manual Recovery
    ↓ (User can force reset)
    
Result: NEVER PERMANENTLY STUCK!
```

## State Transitions

### Before Patch
```
IDLE → PROCESSING → [STUCK] ⚠️ 
                      ↓
                   (Forever)
```

### After Patch
```
IDLE → PROCESSING → SUCCESS → IDLE ✅
         ↓
      TIMEOUT/ERROR
         ↓
     RECOVERY → RETRY → SUCCESS → IDLE ✅
         ↓
     (Always recovers within 20s)
```

## Recovery Triggers

```
┌─────────────────────────────────────────┐
│        Recovery Trigger Points          │
├─────────────────────────────────────────┤
│                                         │
│  1. Engine Timeout (15s)                │
│     ↓ No bestmove received              │
│                                         │
│  2. Processing Timeout (20s)            │
│     ↓ Watchdog detects stuck state      │
│                                         │
│  3. Invalid Response                    │
│     ↓ Bad move format or data           │
│                                         │
│  4. Network Failure                     │
│     ↓ WebSocket send fails              │
│                                         │
│  5. Multiple Errors (3+)                │
│     ↓ Consecutive failures              │
│                                         │
│  6. Manual Trigger                      │
│     ↓ User calls forceRecovery()        │
│                                         │
│  ALL → RECOVERY MANAGER → RESET → OK ✅ │
└─────────────────────────────────────────┘
```

## Watchdog Operation

```
Every 5 seconds:

┌─────────────────────────────────────┐
│     Watchdog Health Check           │
├─────────────────────────────────────┤
│                                     │
│  ✓ Check if processingMove = true  │
│  ✓ Check processingStartTime        │
│  ✓ Calculate elapsed time           │
│                                     │
│  IF elapsed > 20s:                  │
│    → TRIGGER RECOVERY ⚠️            │
│                                     │
│  IF elapsed > 30s (no activity):    │
│    → LOG WARNING ⚠️                 │
│                                     │
│  ELSE:                              │
│    → Continue monitoring ✅         │
│                                     │
└─────────────────────────────────────┘
```

## Error Handling Flow

```
┌────────────────────────────────────────────────────┐
│              Error Occurs                          │
└──────────────────┬─────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Log Error      │
         │  Increment      │
         │  Counter        │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │  Auto-Recovery  │
         │  Enabled?       │
         └────┬──────┬─────┘
              │      │
         YES  │      │  NO
              │      │
              ▼      ▼
    ┌──────────┐  ┌────────────┐
    │ Trigger  │  │ Just Reset │
    │ Recovery │  │ Flags      │
    └────┬─────┘  └─────┬──────┘
         │              │
         └──────┬───────┘
                │
                ▼
       ┌─────────────────┐
       │  System Ready   │
       │  for Next Move  │
       └─────────────────┘
```

## Recovery Manager Details

```
┌──────────────────────────────────────────────────┐
│           RecoveryManager Methods                │
├──────────────────────────────────────────────────┤
│                                                  │
│  startWatchdog()                                 │
│    ↓ Starts 5s interval health checks           │
│                                                  │
│  checkHealth()                                   │
│    ↓ Validates system state                     │
│    ↓ Detects stuck processing                   │
│    ↓ Triggers recovery if needed                │
│                                                  │
│  forceRecovery(reason)                           │
│    ↓ Clears all timers                          │
│    ↓ Stops engine                               │
│    ↓ Resets all flags                           │
│    ↓ Logs recovery event                        │
│    ↓ Retries position (if available)            │
│                                                  │
│  setEngineTimeout(callback)                      │
│    ↓ Sets 15s timeout for engine                │
│    ↓ Calls callback if timeout                  │
│                                                  │
│  clearEngineTimeout()                            │
│    ↓ Clears active engine timeout               │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Timeline Example

```
Time    Event                          Action
─────────────────────────────────────────────────────────
0ms     Position received              → Start processing
        
100ms   Engine analyzing               → Timeout set (15s)
        
200ms   Watchdog check                 → All OK ✅
        
5000ms  Watchdog check                 → All OK ✅
        
10000ms Watchdog check                 → All OK ✅
        
12000ms Engine returns bestmove        → Clear timeout
        
12100ms Move sent                      → Reset flags
        
12200ms IDLE - Ready for next          → Success ✅

─────────────────────────────────────────────────────────

Alternative Timeline (Stuck):

0ms     Position received              → Start processing
        
100ms   Engine analyzing               → Timeout set (15s)
        
5000ms  Watchdog check                 → All OK ✅
        
10000ms Watchdog check                 → All OK ✅
        
15000ms ENGINE TIMEOUT                 → RECOVERY! ⚠️
        
15100ms Recovery complete              → Reset done ✅
        
15200ms Retry position                 → Start over
        
16000ms Engine returns bestmove        → Success ✅
```

## Comparison: Before vs After

### Before Patch
```
Normal:  IDLE → PROCESSING → MOVE → IDLE ✅

Stuck:   IDLE → PROCESSING → [INFINITE WAIT] ❌
                              ↓
                         Page Refresh
                         Required
```

### After Patch
```
Normal:  IDLE → PROCESSING → MOVE → IDLE ✅

Timeout: IDLE → PROCESSING → TIMEOUT(15s) → RECOVERY → RETRY → MOVE → IDLE ✅

Stuck:   IDLE → PROCESSING → WATCHDOG(20s) → RECOVERY → RETRY → MOVE → IDLE ✅

Error:   IDLE → PROCESSING → ERROR → RECOVERY → RETRY → MOVE → IDLE ✅
```

## Key Metrics

```
┌──────────────────────────────────────────┐
│        Monitored Metrics                 │
├──────────────────────────────────────────┤
│                                          │
│  • Processing Time                       │
│  • Last Activity Time                    │
│  • Consecutive Errors                    │
│  • Total Recoveries                      │
│  • Total Timeouts                        │
│  • Engine Ready State                    │
│  • WebSocket State                       │
│                                          │
└──────────────────────────────────────────┘
```

## Success Guarantee

```
╔══════════════════════════════════════════╗
║                                          ║
║  MAXIMUM STUCK TIME: 20 seconds          ║
║                                          ║
║  Watchdog checks every 5s                ║
║  Engine timeout at 15s                   ║
║  Force recovery at 20s                   ║
║                                          ║
║  = NEVER PERMANENTLY STUCK! ✅           ║
║                                          ║
╚══════════════════════════════════════════╝
```
