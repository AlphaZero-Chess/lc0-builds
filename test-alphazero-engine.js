/**
 * Test Script for AlphaZero MCTS Chess Engine
 * 
 * This script tests the AlphaZero engine implementation
 * Run in Node.js or browser console
 */

// Load the engine
const fs = require('fs');
const engineCode = fs.readFileSync('./lc0-alphazero-mcts.wasm.js', 'utf8');

// Create a mock window object for Node.js
global.window = {};
eval(engineCode);

const LEELA = window.LEELA;

console.log('═══════════════════════════════════════════════════════════════');
console.log('  AlphaZero MCTS Engine - Test Suite');
console.log('═══════════════════════════════════════════════════════════════\n');

// Create engine instance
const engine = LEELA();

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Engine Initialization
console.log('Test 1: Engine Initialization');
try {
    if (engine && typeof engine.postMessage === 'function') {
        console.log('✅ PASSED: Engine created successfully\n');
        testsPassed++;
    } else {
        throw new Error('Engine not properly initialized');
    }
} catch (e) {
    console.log('❌ FAILED:', e.message, '\n');
    testsFailed++;
}

// Test 2: UCI Protocol
console.log('Test 2: UCI Protocol');
let uciokReceived = false;
engine.onmessage = (msg) => {
    if (msg.includes('uciok')) {
        uciokReceived = true;
    }
};

engine.postMessage('uci');
setTimeout(() => {
    if (uciokReceived) {
        console.log('✅ PASSED: UCI protocol working\n');
        testsPassed++;
    } else {
        console.log('❌ FAILED: uciok not received\n');
        testsFailed++;
    }
}, 100);

// Test 3: Position Setup
console.log('Test 3: Position Setup');
setTimeout(() => {
    try {
        engine.postMessage('position startpos');
        console.log('✅ PASSED: Starting position set\n');
        testsPassed++;
    } catch (e) {
        console.log('❌ FAILED:', e.message, '\n');
        testsFailed++;
    }
}, 200);

// Test 4: Search Functionality
console.log('Test 4: MCTS Search');
let bestmoveReceived = false;
setTimeout(() => {
    engine.onmessage = (msg) => {
        console.log('Engine output:', msg);
        if (msg.includes('bestmove')) {
            bestmoveReceived = true;
            const move = msg.split(' ')[1];
            console.log('Best move:', move);
            
            // Check if move is valid UCI format
            if (/^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(move)) {
                console.log('✅ PASSED: Valid move generated:', move, '\n');
                testsPassed++;
            } else {
                console.log('❌ FAILED: Invalid move format:', move, '\n');
                testsFailed++;
            }
        }
    };
    
    engine.postMessage('go movetime 1000');
    
    // Wait for search to complete
    setTimeout(() => {
        if (!bestmoveReceived) {
            console.log('❌ FAILED: No bestmove received\n');
            testsFailed++;
        }
        
        // Print final results
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('  Test Results');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`Total Tests: ${testsPassed + testsFailed}`);
        console.log(`✅ Passed: ${testsPassed}`);
        console.log(`❌ Failed: ${testsFailed}`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        if (testsFailed === 0) {
            console.log('🎉 All tests passed! Engine is working correctly.\n');
        } else {
            console.log('⚠️  Some tests failed. Please review the output above.\n');
        }
    }, 5000);
}, 300);

// Test positions for manual verification
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  Test Positions for Manual Verification');
console.log('═══════════════════════════════════════════════════════════════');

const testPositions = [
    {
        name: 'Mate in 2',
        fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
        expected: 'Engine should find Qxf7# or similar mating move'
    },
    {
        name: 'Opening Position',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        expected: 'Should play e4, d4, Nf3, or c4'
    },
    {
        name: 'Tactical Position',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6',
        expected: 'Should consider Bxf7+ (fork) or castling'
    },
    {
        name: 'Endgame',
        fen: '8/8/8/4k3/8/8/4K3/8 w - - 0 1',
        expected: 'Should play king moves (Kd2, Ke2, Kf2, etc.)'
    }
];

testPositions.forEach(pos => {
    console.log(`\n${pos.name}:`);
    console.log(`FEN: ${pos.fen}`);
    console.log(`Expected: ${pos.expected}`);
});

console.log('\n═══════════════════════════════════════════════════════════════\n');
console.log('To manually test positions:');
console.log('1. Load engine in browser console');
console.log('2. Use: engine.postMessage("position fen <FEN>")');
console.log('3. Use: engine.postMessage("go movetime 2000")');
console.log('4. Check output for bestmove\n');

console.log('═══════════════════════════════════════════════════════════════\n');
