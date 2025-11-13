/**
 * Test FAST Anti-Blunder Engine
 * Verify: Speed + No Blunders
 */

const fs = require('fs');

console.log('Loading FAST Anti-Blunder engine...\n');
const engineCode = fs.readFileSync('./lc0-fast-anti-blunder.wasm.js', 'utf8');

global.window = {};
eval(engineCode);

const LEELA = window.LEELA;
const engine = LEELA();

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FAST ENGINE TEST - Speed + No Blunders');
console.log('═══════════════════════════════════════════════════════════════\n');

const testPosition = 'r1b2b1r/1ppq1p1p/p2p1np1/8/2QPP003/2N5/PPP2PPP/R3KBNR w KQ - 0 8';

console.log('Position: After 7...a6');
console.log('FEN:', testPosition);
console.log('\nOLD BLUNDER: Qxf7+ (loses Queen)');
console.log('EXPECTED: Safe move (NOT Qxf7+)\n');

let bestMove = null;
let startTime = Date.now();
let endTime = 0;

engine.onMessage = (msg) => {
    console.log('Engine:', msg);
    
    if (msg.includes('bestmove')) {
        endTime = Date.now();
        bestMove = msg.split(' ')[1];
        const elapsed = (endTime - startTime) / 1000;
        
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('  TEST RESULT');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('Best move:', bestMove);
        console.log('Time taken:', elapsed.toFixed(2), 'seconds');
        
        // Check speed
        if (elapsed <= 2.0) {
            console.log('✅ SPEED TEST: PASSED (≤2 seconds)');
        } else {
            console.log('⚠️  SPEED TEST: Slower than expected');
        }
        
        // Check blunder
        if (bestMove === 'c4f7' || bestMove === 'c4xf7') {
            console.log('❌ BLUNDER TEST: FAILED (still plays Qxf7+)');
        } else {
            console.log('✅ BLUNDER TEST: PASSED (avoids Qxf7+)');
        }
        
        console.log('\n═══════════════════════════════════════════════════════════════\n');
        process.exit(0);
    }
};

engine.postMessage('uci');
setTimeout(() => engine.postMessage('isready'), 50);
setTimeout(() => engine.postMessage(`position fen ${testPosition}`), 100);
setTimeout(() => {
    startTime = Date.now();
    engine.postMessage('go movetime 1500');
}, 150);

setTimeout(() => {
    if (!bestMove) {
        console.log('\n❌ TIMEOUT\n');
        process.exit(1);
    }
}, 5000);
