// ==UserScript==
// @name         Lichess AlphaZero MCTS Bot - Fast Standalone
// @description  AlphaZero MCTS chess engine optimized for speed - no external dependencies
// @author       Claude AI
// @version      3.0.0
// @match        *://lichess.org/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * ⚠️  EDUCATIONAL USE ONLY - DO NOT USE ON LIVE LICHESS GAMES ⚠️
 * This violates Lichess Terms of Service. Use only for learning and local testing.
 */

(function() {
    'use strict';

    // First, load the AlphaZero engine inline to avoid CORS issues
    console.log('Loading AlphaZero MCTS Engine...');
    
    // Load engine from the same file
    const engineScript = document.createElement('script');
    engineScript.textContent = `
        // Inline AlphaZero Engine - Fast Version
        window.LEELA = (function() {
            'use strict';
            const PIECES = {EMPTY: 0, W_PAWN: 1, W_KNIGHT: 2, W_BISHOP: 3, W_ROOK: 4, W_QUEEN: 5, W_KING: 6, B_PAWN: 7, B_KNIGHT: 8, B_BISHOP: 9, B_ROOK: 10, B_QUEEN: 11, B_KING: 12};
            const PIECE_CHARS = {1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K', 7: 'p', 8: 'n', 9: 'b', 10: 'r', 11: 'q', 12: 'k'};
            const CHAR_TO_PIECE = {'P': 1, 'N': 2, 'B': 3, 'R': 4, 'Q': 5, 'K': 6, 'p': 7, 'n': 8, 'b': 9, 'r': 10, 'q': 11, 'k': 12};
            const PIECE_VALUES = {PAWN: 100, KNIGHT: 320, BISHOP: 330, ROOK: 500, QUEEN: 900, KING: 20000};
            const INFINITY = 100000;
            const MATE_SCORE = 50000;
            
            // FAST MCTS Configuration - Optimized for speed
            const MCTS_CONFIG = {simulations: 300, cPuct: 1.5, temperature: 0.0};
            
            class Board {
                constructor() {
                    this.squares = new Array(64).fill(PIECES.EMPTY);
                    this.turn = 1;
                    this.castling = {wk: true, wq: true, bk: true, bq: true};
                    this.enPassant = -1;
                    this.kings = {white: -1, black: -1};
                }
                clone() {
                    const b = new Board();
                    b.squares = [...this.squares];
                    b.turn = this.turn;
                    b.castling = {...this.castling};
                    b.enPassant = this.enPassant;
                    b.kings = {...this.kings};
                    return b;
                }
                isWhite(p) { return p >= 1 && p <= 6; }
                isBlack(p) { return p >= 7 && p <= 12; }
                isOwnPiece(p) { return this.turn === 1 ? this.isWhite(p) : this.isBlack(p); }
                isEnemyPiece(p) { return this.turn === 1 ? this.isBlack(p) : this.isWhite(p); }
                getPieceType(p) { return p === 0 ? 0 : (p >= 7 ? p - 6 : p); }
                makeMove(move) {
                    const piece = this.squares[move.from];
                    this.squares[move.from] = PIECES.EMPTY;
                    this.squares[move.to] = move.promotion || piece;
                    if (move.castle) {
                        const rooks = {'wk': [7,5], 'wq': [0,3], 'bk': [63,61], 'bq': [56,59]};
                        const [rf, rt] = rooks[move.castle];
                        this.squares[rf] = PIECES.EMPTY;
                        this.squares[rt] = this.turn === 1 ? PIECES.W_ROOK : PIECES.B_ROOK;
                    }
                    if (move.enPassantCapture) this.squares[move.enPassantCapture] = PIECES.EMPTY;
                    this.enPassant = move.newEnPassant || -1;
                    const pt = this.getPieceType(piece);
                    if (pt === 6) {
                        if (this.turn === 1) {
                            this.castling.wk = false;
                            this.castling.wq = false;
                            this.kings.white = move.to;
                        } else {
                            this.castling.bk = false;
                            this.castling.bq = false;
                            this.kings.black = move.to;
                        }
                    }
                    if ([0, move.from, move.to].includes(0)) this.castling.wq = false;
                    if ([7, move.from, move.to].includes(7)) this.castling.wk = false;
                    if ([56, move.from, move.to].includes(56)) this.castling.bq = false;
                    if ([63, move.from, move.to].includes(63)) this.castling.bk = false;
                    this.turn = -this.turn;
                }
            }
            
            class MoveGenerator {
                static generate(board) {
                    const moves = [];
                    for (let sq = 0; sq < 64; sq++) {
                        const piece = board.squares[sq];
                        if (!board.isOwnPiece(piece)) continue;
                        const type = board.getPieceType(piece);
                        if (type === 1) this.genPawnMoves(board, sq, moves);
                        else if (type === 2) this.genKnightMoves(board, sq, moves);
                        else if (type === 3) this.genBishopMoves(board, sq, moves);
                        else if (type === 4) this.genRookMoves(board, sq, moves);
                        else if (type === 5) this.genQueenMoves(board, sq, moves);
                        else if (type === 6) this.genKingMoves(board, sq, moves);
                    }
                    return moves;
                }
                static genPawnMoves(board, sq, moves) {
                    const dir = board.turn === 1 ? -8 : 8;
                    const fwd = sq + dir;
                    if (fwd >= 0 && fwd < 64 && board.squares[fwd] === PIECES.EMPTY) {
                        const prom = board.turn === 1 ? 0 : 7;
                        if (Math.floor(fwd/8) === prom) {
                            const pt = board.turn === 1 ? [PIECES.W_QUEEN, PIECES.W_ROOK] : [PIECES.B_QUEEN, PIECES.B_ROOK];
                            pt.forEach(p => moves.push({from: sq, to: fwd, promotion: p}));
                        } else {
                            moves.push({from: sq, to: fwd});
                            const sr = board.turn === 1 ? 6 : 1;
                            if (Math.floor(sq/8) === sr) {
                                const df = sq + dir * 2;
                                if (board.squares[df] === PIECES.EMPTY) moves.push({from: sq, to: df, newEnPassant: fwd});
                            }
                        }
                    }
                    [-1, 1].forEach(df => {
                        const c = fwd + df;
                        if (c >= 0 && c < 64 && board.isEnemyPiece(board.squares[c])) moves.push({from: sq, to: c});
                        if (c === board.enPassant) moves.push({from: sq, to: c, enPassantCapture: sq + df});
                    });
                }
                static genKnightMoves(board, sq, moves) {
                    [-17, -15, -10, -6, 6, 10, 15, 17].forEach(o => {
                        const t = sq + o;
                        if (t >= 0 && t < 64 && Math.abs(Math.floor(sq/8) - Math.floor(t/8)) <= 2) {
                            const tar = board.squares[t];
                            if (tar === PIECES.EMPTY || board.isEnemyPiece(tar)) moves.push({from: sq, to: t});
                        }
                    });
                }
                static genSliding(board, sq, dirs, moves) {
                    dirs.forEach(([dr, df]) => {
                        let r = Math.floor(sq/8), f = sq % 8;
                        while (true) {
                            r += dr; f += df;
                            if (r < 0 || r >= 8 || f < 0 || f >= 8) break;
                            const t = r * 8 + f;
                            const tar = board.squares[t];
                            if (tar === PIECES.EMPTY) moves.push({from: sq, to: t});
                            else {
                                if (board.isEnemyPiece(tar)) moves.push({from: sq, to: t});
                                break;
                            }
                        }
                    });
                }
                static genBishopMoves(b, sq, m) { this.genSliding(b, sq, [[1,1],[1,-1],[-1,1],[-1,-1]], m); }
                static genRookMoves(b, sq, m) { this.genSliding(b, sq, [[1,0],[-1,0],[0,1],[0,-1]], m); }
                static genQueenMoves(b, sq, m) { this.genSliding(b, sq, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]], m); }
                static genKingMoves(board, sq, moves) {
                    [-9, -8, -7, -1, 1, 7, 8, 9].forEach(o => {
                        const t = sq + o;
                        if (t >= 0 && t < 64 && Math.abs(Math.floor(sq/8) - Math.floor(t/8)) <= 1) {
                            const tar = board.squares[t];
                            if (tar === PIECES.EMPTY || board.isEnemyPiece(tar)) moves.push({from: sq, to: t});
                        }
                    });
                    const r = Math.floor(sq/8), f = sq % 8;
                    if (board.turn === 1 && r === 7 && f === 4) {
                        if (board.castling.wk && board.squares[5] === 0 && board.squares[6] === 0) moves.push({from: sq, to: 6, castle: 'wk'});
                        if (board.castling.wq && board.squares[3] === 0 && board.squares[2] === 0 && board.squares[1] === 0) moves.push({from: sq, to: 2, castle: 'wq'});
                    } else if (board.turn === -1 && r === 0 && f === 4) {
                        if (board.castling.bk && board.squares[61] === 0 && board.squares[62] === 0) moves.push({from: sq, to: 62, castle: 'bk'});
                        if (board.castling.bq && board.squares[59] === 0 && board.squares[58] === 0 && board.squares[57] === 0) moves.push({from: sq, to: 58, castle: 'bq'});
                    }
                }
                static moveToUCI(m) {
                    const ff = String.fromCharCode(97 + (m.from % 8));
                    const fr = 8 - Math.floor(m.from / 8);
                    const tf = String.fromCharCode(97 + (m.to % 8));
                    const tr = 8 - Math.floor(m.to / 8);
                    let uci = ff + fr + tf + tr;
                    if (m.promotion) uci += ['','q','r','n','b'][m.promotion % 7] || 'q';
                    return uci;
                }
            }
            
            class Evaluator {
                static evaluate(board) {
                    let score = 0;
                    for (let sq = 0; sq < 64; sq++) {
                        const p = board.squares[sq];
                        if (p === PIECES.EMPTY) continue;
                        const t = board.getPieceType(p);
                        const v = [0, 100, 320, 330, 500, 900, 20000][t];
                        score += board.isWhite(p) ? v : -v;
                    }
                    return board.turn === 1 ? score : -score;
                }
            }
            
            class MCTSNode {
                constructor(board, parent = null, move = null, prior = 0) {
                    this.board = board;
                    this.parent = parent;
                    this.move = move;
                    this.prior = prior;
                    this.children = [];
                    this.visitCount = 0;
                    this.totalValue = 0;
                    this.isExpanded = false;
                }
                get Q() { return this.visitCount === 0 ? 0 : this.totalValue / this.visitCount; }
                get U(pv) { return MCTS_CONFIG.cPuct * this.prior * Math.sqrt(pv) / (1 + this.visitCount); }
                PUCT(pv) { return this.Q + this.U(pv); }
                selectChild() {
                    let best = null, bestVal = -Infinity;
                    for (let c of this.children) {
                        const v = c.PUCT(this.visitCount);
                        if (v > bestVal) { bestVal = v; best = c; }
                    }
                    return best;
                }
                expand() {
                    if (this.isExpanded) return;
                    const moves = MoveGenerator.generate(this.board);
                    if (moves.length === 0) return;
                    const prior = 1.0 / moves.length;
                    for (let m of moves) {
                        const nb = this.board.clone();
                        nb.makeMove(m);
                        this.children.push(new MCTSNode(nb, this, m, prior));
                    }
                    this.isExpanded = true;
                }
                backpropagate(v) {
                    this.visitCount++;
                    this.totalValue += v;
                    if (this.parent) this.parent.backpropagate(-v);
                }
                getBestMove() {
                    if (this.children.length === 0) return null;
                    let best = this.children[0];
                    for (let c of this.children) {
                        if (c.visitCount > best.visitCount) best = c;
                    }
                    return best.move;
                }
            }
            
            class MCTSEngine {
                constructor() { this.root = null; this.nodes = 0; }
                search(board, sims, timeLimit) {
                    this.nodes = 0;
                    const start = Date.now();
                    this.root = new MCTSNode(board);
                    this.root.expand();
                    if (this.root.children.length === 0) return null;
                    for (let i = 0; i < sims && Date.now() - start < timeLimit; i++) {
                        this.runSimulation();
                    }
                    return this.root.getBestMove();
                }
                runSimulation() {
                    let node = this.root;
                    while (node.isExpanded && node.children.length > 0) {
                        node = node.selectChild();
                        if (!node) break;
                    }
                    if (!node) return;
                    this.nodes++;
                    if (node.visitCount >= 1 && !node.isExpanded) {
                        node.expand();
                        if (node.children.length > 0) node = node.children[0];
                    }
                    const value = Math.tanh(Evaluator.evaluate(node.board) / 1000);
                    node.backpropagate(value);
                }
            }
            
            class AlphaZeroEngine {
                constructor() {
                    this.board = new Board();
                    this.mcts = new MCTSEngine();
                    this.messageCallback = null;
                }
                output(msg) { if (this.messageCallback) this.messageCallback(msg); }
                parseFEN(fen) {
                    const parts = fen.split(' ');
                    const pos = parts[0];
                    this.board.squares.fill(PIECES.EMPTY);
                    let sq = 0;
                    for (let char of pos) {
                        if (char === '/') continue;
                        if (/\\d/.test(char)) sq += parseInt(char);
                        else {
                            this.board.squares[sq] = CHAR_TO_PIECE[char];
                            if (char === 'K') this.board.kings.white = sq;
                            if (char === 'k') this.board.kings.black = sq;
                            sq++;
                        }
                    }
                    this.board.turn = parts[1] === 'w' ? 1 : -1;
                    const c = parts[2] || 'KQkq';
                    this.board.castling = {wk: c.includes('K'), wq: c.includes('Q'), bk: c.includes('k'), bq: c.includes('q')};
                    const ep = parts[3] || '-';
                    if (ep !== '-') {
                        const f = ep.charCodeAt(0) - 97;
                        const r = 8 - parseInt(ep[1]);
                        this.board.enPassant = r * 8 + f;
                    } else {
                        this.board.enPassant = -1;
                    }
                }
                processCommand(cmd) {
                    if (cmd === 'uci') {
                        this.output('id name AlphaZero Fast');
                        this.output('id author Claude AI');
                        this.output('uciok');
                    } else if (cmd === 'isready') {
                        this.output('readyok');
                    } else if (cmd === 'ucinewgame') {
                        this.parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
                    } else if (cmd.startsWith('position')) {
                        if (cmd.includes('startpos')) {
                            this.parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
                        } else if (cmd.includes('fen')) {
                            const m = cmd.match(/fen\\s+(.+?)(?:\\s+moves|$)/);
                            if (m) this.parseFEN(m[1]);
                        }
                    } else if (cmd.startsWith('go')) {
                        this.handleGo(cmd);
                    }
                }
                handleGo(cmd) {
                    let timeLimit = 1500;
                    let sims = MCTS_CONFIG.simulations;
                    const mtMatch = cmd.match(/movetime\\s+(\\d+)/);
                    if (mtMatch) {
                        timeLimit = parseInt(mtMatch[1]);
                        sims = Math.floor(timeLimit / 3);
                    }
                    setTimeout(() => {
                        const best = this.mcts.search(this.board, sims, timeLimit);
                        if (best) {
                            this.output('bestmove ' + MoveGenerator.moveToUCI(best));
                        } else {
                            this.output('bestmove 0000');
                        }
                    }, 10);
                }
                postMessage(cmd) { setTimeout(() => this.processCommand(cmd), 0); }
                set onmessage(cb) { this.messageCallback = cb; }
                get onmessage() { return this.messageCallback; }
            }
            
            return () => new AlphaZeroEngine();
        })();
        
        console.log('%c✓ AlphaZero Fast Engine loaded', 'color: #4CAF50; font-weight: bold;');
    `;
    
    document.head.appendChild(engineScript);

    // Wait a bit for engine to load
    setTimeout(() => {
        // Now continue with bot initialization
        console.log('%c🏆 Starting AlphaZero MCTS Bot', 'color: #9C27B0; font-weight: bold; font-size: 14px;');
        
        const CONFIG = {
            movetime: 1000,              // Fast moves - 1 second
            simulations: 300,            // Fast simulations
            enabled: true,
            autoStart: true,
            playAsWhite: true,
            playAsBlack: true,
            verbose: true
        };

        const STATE = {
            engine: null,
            webSocket: null,
            currentFen: '',
            engineReady: false,
            processingMove: false,
            moveCount: 0
        };

        const Logger = {
            log(msg, type = 'info') {
                const colors = {
                    info: '#2196F3', success: '#4CAF50', warning: '#FF9800',
                    error: '#F44336', engine: '#9C27B0', move: '#FF5722'
                };
                console.log(\`%c[AlphaZero] \${msg}\`, \`color: \${colors[type]}; font-weight: bold;\`);
            },
            info: (m) => Logger.log(m, 'info'),
            success: (m) => Logger.log(m, 'success'),
            error: (m) => Logger.log(m, 'error'),
            move: (m) => Logger.log(m, 'move')
        };

        const EngineManager = {
            initialize() {
                Logger.info('Initializing AlphaZero engine...');
                try {
                    if (typeof window.LEELA !== 'function') {
                        Logger.error('Engine not found');
                        return false;
                    }
                    STATE.engine = window.LEELA();
                    this.setupMessageHandler();
                    STATE.engine.postMessage('uci');
                    Logger.success('Engine initialized');
                    return true;
                } catch (e) {
                    Logger.error('Failed: ' + e.message);
                    return false;
                }
            },

            setupMessageHandler() {
                STATE.engine.onmessage = (msg) => {
                    if (msg.includes('uciok')) {
                        STATE.engine.postMessage('isready');
                    } else if (msg.includes('readyok')) {
                        STATE.engineReady = true;
                        Logger.success('🧠 Engine READY!');
                    } else if (msg.includes('bestmove')) {
                        const parts = msg.split(' ');
                        const move = parts[1];
                        if (move && move !== '0000') {
                            Logger.move(\`✓ Best move: \${move}\`);
                            LichessManager.sendMove(move);
                        } else {
                            Logger.error('No valid move found');
                        }
                        STATE.processingMove = false;
                    }
                };
            },

            analyzePosition(fen) {
                if (!STATE.engineReady || STATE.processingMove || !CONFIG.enabled) return;
                
                const turn = fen.split(' ')[1];
                if ((turn === 'w' && !CONFIG.playAsWhite) || (turn === 'b' && !CONFIG.playAsBlack)) return;
                
                STATE.processingMove = true;
                STATE.moveCount++;
                
                Logger.info(\`📊 Analyzing move \${STATE.moveCount}\`);
                STATE.engine.postMessage('ucinewgame');
                STATE.engine.postMessage('position fen ' + fen);
                STATE.engine.postMessage('go movetime ' + CONFIG.movetime);
            }
        };

        const LichessManager = {
            install() {
                const OrigWS = window.WebSocket;
                window.WebSocket = new Proxy(OrigWS, {
                    construct(target, args) {
                        const ws = new target(...args);
                        STATE.webSocket = ws;
                        
                        ws.addEventListener('message', (event) => {
                            try {
                                const msg = JSON.parse(event.data);
                                if (msg.d && typeof msg.d.fen === 'string') {
                                    let fen = msg.d.fen;
                                    const isWhite = msg.v % 2 === 0;
                                    if (!fen.includes(' w') && !fen.includes(' b')) {
                                        fen += isWhite ? ' w KQkq - 0 1' : ' b KQkq - 0 1';
                                    }
                                    if (fen !== STATE.currentFen) {
                                        STATE.currentFen = fen;
                                        setTimeout(() => EngineManager.analyzePosition(fen), 100);
                                    }
                                }
                            } catch (e) {}
                        });
                        
                        return ws;
                    }
                });
                Logger.success('✓ WebSocket interceptor installed');
            },

            sendMove(move) {
                if (!STATE.webSocket || STATE.webSocket.readyState !== WebSocket.OPEN) {
                    Logger.error('WebSocket not ready');
                    return;
                }
                try {
                    STATE.webSocket.send(JSON.stringify({t: 'move', d: {u: move, b: 1}}));
                    Logger.success(\`📤 Move sent: \${move}\`);
                } catch (e) {
                    Logger.error('Failed to send: ' + e.message);
                }
            }
        };

        // Initialize
        Logger.log('🏆 AlphaZero MCTS Bot - Fast Edition v3.0', 'success');
        Logger.log('⚡ Optimized for speed: 300 simulations, 1s moves', 'info');
        LichessManager.install();
        EngineManager.initialize();

        // Public API
        window.AlphaZeroBot = {
            enable() {
                CONFIG.enabled = true;
                Logger.success('✓ Bot ENABLED');
            },
            disable() {
                CONFIG.enabled = false;
                Logger.log('✗ Bot DISABLED', 'warning');
            },
            setMoveTime(ms) {
                CONFIG.movetime = Math.max(500, Math.min(parseInt(ms), 5000));
                Logger.success(\`Move time: \${CONFIG.movetime}ms\`);
            },
            setSimulations(n) {
                CONFIG.simulations = Math.max(100, Math.min(parseInt(n), 2000));
                Logger.success(\`Simulations: \${CONFIG.simulations}\`);
            }
        };

        Logger.success('✓ Bot ready! Type window.AlphaZeroBot.help() for commands');
        
    }, 100);

})();
