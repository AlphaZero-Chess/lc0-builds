/**
 * Test Script - Verify Qxf7+ Blunder is Fixed
 * 
 * This tests the patched engine on the exact position where
 * the original engine blundered with Qxf7+
 */

const fs = require('fs');

// Load the PATCHED engine
console.log('Loading PATCHED AlphaZero engine...\n');
const engineCode = fs.readFileSync('./lc0-alphazero-top-tier-PATCHED.wasm.js', 'utf8');

global.window = {};
eval(engineCode);

const LEELA = window.LEELA;
const engine = LEELA();

console.log('═══════════════════════════════════════════════════════════════');
console.log('  BLUNDER FIX VERIFICATION TEST');
console.log('═══════════════════════════════════════════════════════════════\n');

// Game position before the blunder
// After: 1. d4 Nf6 2. Qd3 g6 3. Bf4 Bg7 4. Nc3 Kf8 5. e4 d6 6. Qb5 Qd7 7. Qc4 a6
const testPosition = 'r1b2b1r/1ppq1p1p/p2p1np1/8/2QPP3/2N5/PPP2PPP/R3KBNR w KQ - 0 8';

console.log('Position: After 7...a6');
console.log('FEN:', testPosition);
console.log('\nBLUNDER MOVE (old engine): Qxf7+ (loses Queen for pawn)');
console.log('EXPECTED (patched): ANY move except Qxf7+\n');
console.log('Testing...\n');

let bestMove = null;
let receivedBestmove = false;

engine.onMessage = (msg) => {
    console.log('Engine:', msg);
    
    if (msg.includes('bestmove')) {
        receivedBestmove = true;
        bestMove = msg.split(' ')[1];
        
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('  TEST RESULT');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('Best move found:', bestMove);
        
        // Check if it's the blunder
        if (bestMove === 'c4f7' || bestMove === 'c4xf7') {
            console.log('\n❌ FAILED: Engine still plays Qxf7+ blunder!');
            console.log('   This means SEE is not working properly.\n');
        } else {
            console.log('\n✅ PASSED: Engine avoids Qxf7+ blunder!');
            console.log('   SEE anti-blunder system is working correctly.\n');
            
            // Show what the engine chose instead
            console.log('Reasonable alternatives:');
            console.log('  - Nf3 (develop)');
            console.log('  - Bd3 (develop)');
            console.log('  - O-O-O (castle)');
            console.log('  - Nge2 (develop)');
            console.log('  - h3 (prevent pin)');
            console.log('\n');
        }
        
        console.log('═══════════════════════════════════════════════════════════════\n');
        process.exit(receivedBestmove && bestMove !== 'c4f7' ? 0 : 1);
    }
};

// Set up position
engine.postMessage('uci');
setTimeout(() => {
    engine.postMessage('isready');
}, 100);

setTimeout(() => {
    engine.postMessage(`position fen ${testPosition}`);
}, 200);

setTimeout(() => {
    // Use higher simulations for accurate test
    engine.postMessage('go simulations 2000 movetime 3000');
}, 300);

// Timeout after 10 seconds
setTimeout(() => {
    if (!receivedBestmove) {
        console.log('\n❌ TIMEOUT: Engine did not respond within 10 seconds\n');
        process.exit(1);
    }
}, 10000);
