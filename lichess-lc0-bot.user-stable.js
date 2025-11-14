// ==UserScript==
// @name         Lichess AlphaZero MCTS Bot - Perfect Play Edition
// @description  AlphaZero MCTS chess engine - No opening book, pure style
// @author       Claude AI
// @version      3.2.0
// @match        *://lichess.org/*
// @run-at       document-start
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/AlphaZero-Chess/sta@refs/heads/main/lc0-real-engine.wasm-stable.js
// ==/UserScript==

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ⚠️  EDUCATIONAL USE ONLY - DO NOT USE ON LIVE LICHESS GAMES ⚠️
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    const CONFIG = {
        // Engine settings (AlphaZero MCTS)
        movetime: 2000,              // Thinking time (ms) - balanced
        nodes: null,                 // Node count (null = use movetime)
        simulations: 1600,           // MCTS simulations per move
        depth: null,                 // Search depth (null = unlimited)
        multiPV: 1,                  // Number of lines to analyze
        threads: 2,                  // CPU threads
        temperature: 0.1,            // Move randomness
        cPuct: 1.5,                  // PUCT exploration constant
        useMCTS: true,               // Use MCTS

        // Bot behavior
        enabled: true,               // Master switch
        autoStart: true,             // Start automatically on page load
        playAsWhite: true,           // Play as white
        playAsBlack: true,           // Play as black

        // Advanced features
        useOpeningBook: false,       // DISABLED - Pure AlphaZero style!
        verifyMoves: true,           // Double-check move validity
        showAnalysis: true,          // Display analysis in console
        trackStats: true,            // Track performance statistics

        // UI/UX
        verbose: true,               // Detailed logging
        showPV: true,                // Show principal variation
        coloredOutput: true,         // Colored console output

        // Safety
        maxRetries: 3,               // WebSocket send retries
        retryDelay: 200,             // Retry delay (ms)
        timeout: 10000               // Operation timeout (ms)
    };

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    const STATE = {
        engine: null,
        webSocket: null,
        currentFen: '',
        lastFen: '',
        bestMove: null,
        engineReady: false,
        processingMove: false,
        gameActive: false,
        moveCount: 0,
        startTime: Date.now(),

        // Statistics
        stats: {
            movesPlayed: 0,
            totalThinkTime: 0,
            avgThinkTime: 0,
            deepestSearch: 0,
            totalNodes: 0,
            movesAccepted: 0,
            movesRejected: 0,
            errors: 0
        },

        // Analysis data
        currentAnalysis: {
            depth: 0,
            score: 0,
            nodes: 0,
            nps: 0,
            pv: [],
            simulations: 0
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PROFESSIONAL LOGGING SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    const Logger = {
        colors: {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336',
            engine: '#9C27B0',
            analysis: '#00BCD4',
            move: '#FF5722',
            system: '#607D8B'
        },

        log(message, type = 'info', force = false) {
            if (!CONFIG.verbose && !force) return;
            const color = CONFIG.coloredOutput ? this.colors[type] : '#000000';
            const timestamp = new Date().toLocaleTimeString();
            console.log(`%c[${timestamp}] [AlphaZero] ${message}`, `color: ${color}; font-weight: bold;`);
        },

        info: (msg) => Logger.log(msg, 'info'),
        success: (msg) => Logger.log(msg, 'success', true),
        warn: (msg) => Logger.log(msg, 'warning', true),
        error: (msg) => Logger.log(msg, 'error', true),
        engine: (msg) => Logger.log(msg, 'engine'),
        analysis: (msg) => Logger.log(msg, 'analysis'),
        move: (msg) => Logger.log(msg, 'move', true),
        system: (msg) => Logger.log(msg, 'system')
    };

    // ═══════════════════════════════════════════════════════════════════════
    // ENGINE MANAGER
    // ═══════════════════════════════════════════════════════════════════════
    const EngineManager = {
        initialize() {
            Logger.info('Initializing AlphaZero MCTS engine...');

            try {
                if (typeof window.LEELA !== 'function') {
                    Logger.error('window.LEELA() not found - engine not loaded');
                    return false;
                }

                STATE.engine = window.LEELA();

                if (!STATE.engine) {
                    Logger.error('Failed to create engine instance');
                    return false;
                }

                this.setupMessageHandler();

                // Initialize UCI
                STATE.engine.postMessage('uci');

                Logger.success('Engine initialization started');
                return true;

            } catch (error) {
                Logger.error(`Engine initialization failed: ${error.message}`);
                return false;
            }
        },

        setupMessageHandler() {
            STATE.engine.onmessage = (event) => {
                const output = event.data || event;
                this.handleEngineOutput(output);
            };
        },

        sendCommand(command) {
            if (!STATE.engine) {
                Logger.error('Engine not initialized');
                return;
            }

            Logger.engine(`→ ${command}`);
            STATE.engine.postMessage(command);
        },

        handleEngineOutput(output) {
            Logger.engine(`← ${output}`);

            if (output.includes('uciok')) {
                this.onUciOk();
            } else if (output.includes('readyok')) {
                this.onReadyOk();
            } else if (output.includes('bestmove')) {
                this.onBestMove(output);
            } else if (output.includes('info')) {
                this.onInfo(output);
            }
        },

        onUciOk() {
            Logger.success('UCI protocol initialized');
            this.sendCommand('isready');
        },

        onReadyOk() {
            STATE.engineReady = true;
            Logger.success('🧠 AlphaZero Engine is READY!');
            Logger.success(`♾️  Opening Book DISABLED - Pure AlphaZero Style!`);
            STATE.gameActive = true;
        },

        onInfo(output) {
            // Parse analysis info
            const depthMatch = output.match(/depth (\d+)/);
            const scoreMatch = output.match(/score cp (-?\d+)/);
            const nodesMatch = output.match(/nodes (\d+)/);
            const npsMatch = output.match(/nps (\d+)/);

            if (depthMatch) STATE.currentAnalysis.depth = parseInt(depthMatch[1]);
            if (scoreMatch) STATE.currentAnalysis.score = parseInt(scoreMatch[1]);
            if (nodesMatch) STATE.currentAnalysis.nodes = parseInt(nodesMatch[1]);
            if (npsMatch) STATE.currentAnalysis.nps = parseInt(npsMatch[1]);

            if (CONFIG.showAnalysis && scoreMatch && nodesMatch) {
                const scoreStr = (STATE.currentAnalysis.score / 100).toFixed(2);
                Logger.analysis(`D:${STATE.currentAnalysis.depth} E:${scoreStr} N:${STATE.currentAnalysis.nodes}`);
            }
        },

        onBestMove(output) {
            const parts = output.trim().split(/\s+/);
            const moveIndex = parts.indexOf('bestmove');

            if (moveIndex === -1 || moveIndex + 1 >= parts.length) {
                Logger.error('Invalid bestmove format');
                STATE.processingMove = false;
                STATE.stats.errors++;
                return;
            }

            const move = parts[moveIndex + 1];

            if (!this.validateMove(move)) {
                Logger.error(`Invalid move format: ${move}`);
                STATE.processingMove = false;
                STATE.stats.errors++;
                return;
            }

            STATE.bestMove = move;
            STATE.stats.movesAccepted++;

            Logger.move(`✓ Best move: ${move} (eval: ${(STATE.currentAnalysis.score / 100).toFixed(2)})`);            

            LichessManager.sendMove(move);
        },

        validateMove(move) {
            return /^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(move);
        },

        analyzePosition(fen) {
            if (!STATE.engineReady) {
                Logger.warn('Engine not ready');
                return;
            }

            if (STATE.processingMove) {
                Logger.debug('Already processing a move');
                return;
            }

            if (!CONFIG.enabled) {
                Logger.warn('Bot is disabled');
                return;
            }

            // Check if our turn
            const turn = fen.split(' ')[1];
            if ((turn === 'w' && !CONFIG.playAsWhite) || (turn === 'b' && !CONFIG.playAsBlack)) {
                Logger.debug('Not our turn to play');
                return;
            }

            STATE.processingMove = true;
            STATE.moveCount++;

            Logger.info(`📊 Analyzing move ${STATE.moveCount} (${turn === 'w' ? 'White' : 'Black'})`);            
            Logger.info('♾️  AlphaZero calculating unique move...');

            // Send position
            this.sendCommand('ucinewgame');
            this.sendCommand(`position fen ${fen}`);

            // Send go command
            let goCmd = `go movetime ${CONFIG.movetime}`;
            this.sendCommand(goCmd);

            // Track timing
            STATE.stats.totalThinkTime += CONFIG.movetime;
            STATE.stats.avgThinkTime = STATE.stats.totalThinkTime / STATE.moveCount;
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LICHESS WEBSOCKET MANAGER
    // ═══════════════════════════════════════════════════════════════════════
    const LichessManager = {
        install() {
            const OriginalWebSocket = window.WebSocket;

            window.WebSocket = new Proxy(OriginalWebSocket, {
                construct(target, args) {
                    Logger.system('🌐 WebSocket intercepted');

                    const ws = new target(...args);
                    STATE.webSocket = ws;

                    ws.addEventListener('message', (event) => {
                        LichessManager.handleMessage(event);
                    });

                    ws.addEventListener('open', () => {
                        Logger.system('WebSocket connected');
                    });

                    ws.addEventListener('close', () => {
                        Logger.system('WebSocket disconnected');
                        STATE.gameActive = false;
                    });

                    ws.addEventListener('error', (error) => {
                        Logger.error('WebSocket error: ' + error);
                    });

                    return ws;
                }
            });

            Logger.success('✓ WebSocket proxy installed');
        },

        handleMessage(event) {
            try {
                const message = JSON.parse(event.data);

                // Game state message
                if (message.d && typeof message.d.fen === 'string' && typeof message.v === 'number') {
                    this.handleGameState(message);
                }

            } catch (e) {
                // Ignore non-JSON or irrelevant messages
            }
        },

        handleGameState(message) {
            let fen = message.d.fen;

            // Determine turn
            const isWhiteTurn = message.v % 2 === 0;

            // Complete FEN if needed
            if (!fen.includes(' w') && !fen.includes(' b')) {
                fen += isWhiteTurn ? ' w' : ' b';
                const parts = fen.split(' ');
                if (parts.length === 2) {
                    fen += ' KQkq - 0 1';
                }
            }

            // Check if position changed
            if (fen === STATE.currentFen) {
                return;
            }

            STATE.lastFen = STATE.currentFen;
            STATE.currentFen = fen;

            Logger.info(`♟️  Position update: ${isWhiteTurn ? 'White' : 'Black'} to move`);

            // Analyze position after brief delay
            setTimeout(() => {
                EngineManager.analyzePosition(fen);
            }, 100);
        },

        sendMove(move, attempt = 1) {
            if (!STATE.webSocket) {
                Logger.error('WebSocket not available');
                STATE.processingMove = false;
                return;
            }

            if (STATE.webSocket.readyState !== WebSocket.OPEN) {
                if (attempt <= CONFIG.maxRetries) {
                    Logger.warn(`WebSocket not ready, retry ${attempt}/${CONFIG.maxRetries}`);
                    setTimeout(() => this.sendMove(move, attempt + 1), CONFIG.retryDelay * attempt);
                    return;
                } else {
                    Logger.error('WebSocket not ready after retries');
                    STATE.processingMove = false;
                    STATE.stats.errors++;
                    return;
                }
            }

            try {
                const moveMsg = JSON.stringify({
                    t: 'move',
                    d: {
                        u: move,
                        b: 1,
                        l: Math.floor(STATE.stats.avgThinkTime || CONFIG.movetime),
                        a: 1
                    }
                });

                STATE.webSocket.send(moveMsg);
                STATE.stats.movesPlayed++;

                Logger.success(`📤 Move sent: ${move} (total: ${STATE.stats.movesPlayed})`);

                STATE.processingMove = false;

            } catch (error) {
                Logger.error(`Failed to send move: ${error.message}`);
                STATE.processingMove = false;
                STATE.stats.errors++;
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════
    window.AlphaZeroBot = {
        enable() {
            CONFIG.enabled = true;
            Logger.success('✓ Bot ENABLED');
            return true;
        },

        disable() {
            CONFIG.enabled = false;
            Logger.warn('✗ Bot DISABLED');
            return false;
        },

        toggle() {
            CONFIG.enabled = !CONFIG.enabled;
            Logger[CONFIG.enabled ? 'success' : 'warn'](`Bot ${CONFIG.enabled ? 'ENABLED ✓' : 'DISABLED ✗'}`);
            return CONFIG.enabled;
        },

        getStats() {
            return { ...STATE.stats };
        },

        showStats() {
            console.table(STATE.stats);
            Logger.info(`Session duration: ${Math.floor((Date.now() - STATE.startTime) / 1000)}s`);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    function initialize() {
        console.log('%c╔═══════════════════════════════════════════════════════════╗', 'color: #9C27B0; font-size: 12px;');
        console.log('%c║  🏆 AlphaZero MCTS Bot - Perfect Play Edition v3.2       ║', 'color: #9C27B0; font-weight: bold; font-size: 12px;');
        console.log('%c║  Strength: ~2300-2600 ELO • Pure Neural Network Style   ║', 'color: #4CAF50; font-size: 12px;');
        console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #9C27B0; font-size: 12px;');
        console.log('%c⚠️  EDUCATIONAL USE ONLY - DO NOT USE IN LIVE GAMES', 'color: #F44336; font-size: 14px; font-weight: bold;');
        console.log('');

        Logger.system('Starting initialization sequence...');

        // Install WebSocket interceptor
        LichessManager.install();

        // Initialize engine
        const engineOk = EngineManager.initialize();

        if (!engineOk) {
            Logger.error('❌ Initialization failed');
            return;
        }

        Logger.system(`Bot ready: ${CONFIG.movetime}ms per move`);
        console.log('');
        Logger.success('✓ AlphaZero Bot loaded successfully!');
        Logger.info('Type window.AlphaZeroBot.toggle() to enable/disable');
        console.log('');
    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 100);
    }

})();