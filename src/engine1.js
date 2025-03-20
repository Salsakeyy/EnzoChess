/**
 * ChessEngine2 - Advanced Chess Engine Implementation
 */

const { Board, EMPTY, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE, BLACK, PIECE_MASK, COLOR_MASK } = require('./board');

// Material values (in centipawns)
const PIECE_VALUES = {
  [PAWN]: 100,
  [KNIGHT]: 320,
  [BISHOP]: 330,
  [ROOK]: 500,
  [QUEEN]: 900,
  [KING]: 20000
};

// Piece-Square tables for middlegame
const MG_TABLES = {
  [PAWN]: [
    0,   0,   0,   0,   0,   0,   0,   0,
    50,  50,  50,  50,  50,  50,  50,  50,
    10,  10,  20,  30,  30,  20,  10,  10,
    5,   5,   10,  25,  25,  10,  5,   5,
    0,   0,   0,   20,  20,  0,   0,   0,
    5,  -5,  -10,  0,   0,  -10, -5,   5,
    5,   10,  10, -20, -20,  10,  10,  5,
    0,   0,   0,   0,   0,   0,   0,   0
  ],
  [KNIGHT]: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,  0,   0,   0,   0,  -20, -40,
    -30,  0,   10,  15,  15,  10,  0,  -30,
    -30,  5,   15,  20,  20,  15,  5,  -30,
    -30,  0,   15,  20,  20,  15,  0,  -30,
    -30,  5,   10,  15,  15,  10,  5,  -30,
    -40, -20,  0,   5,   5,   0,  -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
  ],
  [BISHOP]: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,  0,   0,   0,   0,   0,   0,  -10,
    -10,  0,   10,  10,  10,  10,  0,  -10,
    -10,  5,   5,   10,  10,  5,   5,  -10,
    -10,  0,   5,   10,  10,  5,   0,  -10,
    -10,  5,   5,   5,   5,   5,   5,  -10,
    -10,  0,   5,   0,   0,   5,   0,  -10,
    -20, -10, -10, -10, -10, -10, -10, -20
  ],
  [ROOK]: [
    0,   0,   0,   0,   0,   0,   0,   0,
    5,   10,  10,  10,  10,  10,  10,  5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
    0,   0,   5,   5,   5,   5,   0,   0
  ],
  [QUEEN]: [
    -20, -10, -10, -5,  -5,  -10, -10, -20,
    -10,  0,   0,   0,   0,   0,   0,  -10,
    -10,  0,   5,   5,   5,   5,   0,  -10,
    -5,   0,   5,   5,   5,   5,   0,  -5,
     0,   0,   5,   5,   5,   5,   0,  -5,
    -10,  5,   5,   5,   5,   5,   0,  -10,
    -10,  0,   5,   0,   0,   0,   0,  -10,
    -20, -10, -10, -5,  -5,  -10, -10, -20
  ],
  [KING]: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
     20,  20,  0,   0,   0,   0,   20,  20,
     20,  30,  10,  0,   0,   10,  30,  20
  ]
};

// Piece-Square tables for endgame
const EG_TABLES = {
  [PAWN]: [
    0,   0,   0,   0,   0,   0,   0,   0,
    80,  80,  80,  80,  80,  80,  80,  80,
    50,  50,  50,  50,  50,  50,  50,  50,
    30,  30,  30,  30,  30,  30,  30,  30,
    20,  20,  20,  20,  20,  20,  20,  20,
    10,  10,  10,  10,  10,  10,  10,  10,
    10,  10,  10,  10,  10,  10,  10,  10,
     0,   0,   0,   0,   0,   0,   0,   0
  ],
  [KNIGHT]: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,  0,   0,   0,   0,  -20, -40,
    -30,  0,   10,  15,  15,  10,  0,  -30,
    -30,  5,   15,  20,  20,  15,  5,  -30,
    -30,  0,   15,  20,  20,  15,  0,  -30,
    -30,  5,   10,  15,  15,  10,  5,  -30,
    -40, -20,  0,   0,   0,   0,  -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
  ],
  [BISHOP]: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,  0,   0,   0,   0,   0,   0,  -10,
    -10,  0,   10,  10,  10,  10,  0,  -10,
    -10,  5,   5,   10,  10,  5,   5,  -10,
    -10,  0,   5,   10,  10,  5,   0,  -10,
    -10,  5,   5,   5,   5,   5,   5,  -10,
    -10,  0,   5,   0,   0,   5,   0,  -10,
    -20, -10, -10, -10, -10, -10, -10, -20
  ],
  [ROOK]: [
    0,   0,   0,   5,   5,   0,   0,   0,
    5,   10,  10,  10,  10,  10,  10,  5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
   -5,   0,   0,   0,   0,   0,   0,  -5,
    0,   0,   0,   0,   0,   0,   0,   0
  ],
  [QUEEN]: [
    -20, -10, -10, -5,  -5,  -10, -10, -20,
    -10,  0,   0,   0,   0,   0,   0,  -10,
    -10,  0,   5,   5,   5,   5,   0,  -10,
    -5,   0,   5,   5,   5,   5,   0,  -5,
    -5,   0,   5,   5,   5,   5,   0,  -5,
    -10,  0,   5,   5,   5,   5,   0,  -10,
    -10,  0,   0,   0,   0,   0,   0,  -10,
    -20, -10, -10, -5,  -5,  -10, -10, -20
  ],
  [KING]: [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10,  0,   0,  -10, -20, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -20, -10,  0,   0,  -10, -20, -30,
    -50, -40, -30, -30, -30, -30, -40, -50
  ]
};

// Evaluation bonuses
const BISHOP_PAIR_BONUS = 50;
const MOBILITY_FACTOR = 3;
const ROOK_ON_OPEN_FILE_BONUS = 25;
const ROOK_ON_SEMI_OPEN_FILE_BONUS = 15;
const ROOK_ON_SEVENTH_BONUS = 30;
const PASSED_PAWN_BONUS = [0, 5, 10, 20, 40, 60, 100, 200]; // By rank
const DOUBLED_PAWN_PENALTY = -15;
const ISOLATED_PAWN_PENALTY = -15;

// Game phase weights for tapered evaluation
const PHASE_WEIGHTS = {
  [PAWN]: 0,
  [KNIGHT]: 1,
  [BISHOP]: 1,
  [ROOK]: 2,
  [QUEEN]: 4,
  [KING]: 0
};
const TOTAL_PHASE = 24; // 16 pieces except kings and pawns

// Opening book
const OPENING_BOOK = {
  // Starting position
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': [
    'e2e4', 'd2d4', 'c2c4', 'g1f3'
  ],
  // After e4
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': [
    'e7e5', 'c7c5', 'e7e6', 'c7c6', 'd7d5'
  ],
  // After d4
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': [
    'd7d5', 'g8f6', 'e7e6', 'c7c5'
  ],
  // After c4
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1': [
    'e7e5', 'g8f6', 'c7c5', 'g7g6'
  ],
  // After Nf3
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1': [
    'd7d5', 'g8f6', 'c7c5', 'g7g6'
  ]
};

// Search constants
const MAX_PLY = 64;
const INFINITY = 30000;
const MATE_VALUE = 20000;
const MATE_THRESHOLD = 19000;

// Transposition table flags
const TT_EXACT = 0;  // Exact score
const TT_ALPHA = 1;  // Upper bound (fail low)
const TT_BETA = 2;   // Lower bound (fail high)

/**
 * Transposition table for position caching
 */
class TranspositionTable {
  constructor(size = 1000000) {
    this.table = new Map();
    this.maxSize = size;
  }

  store(fen, depth, value, flag, bestMove) {
    if (this.table.size >= this.maxSize) {
      this.clear(0.5); // Clear half the table when full
    }
    
    const key = fen.split(' ').slice(0, 4).join(' ');
    this.table.set(key, {
      depth,
      value,
      flag,
      bestMove,
      age: 0
    });
  }

  lookup(fen) {
    const key = fen.split(' ').slice(0, 4).join(' ');
    return this.table.get(key);
  }

  clear(portion = 1.0) {
    if (portion >= 1.0) {
      this.table.clear();
      return;
    }
    
    const entries = [...this.table.entries()];
    const countToRemove = Math.floor(entries.length * portion);
    
    // Sort by depth and age (prefer to keep deeper, newer entries)
    entries.sort((a, b) => {
      const scoreA = a[1].depth - a[1].age * 2;
      const scoreB = b[1].depth - b[1].age * 2;
      return scoreA - scoreB;
    });
    
    // Remove oldest/shallowest entries
    for (let i = 0; i < countToRemove; i++) {
      this.table.delete(entries[i][0]);
    }
    
    // Age remaining entries
    for (const entry of this.table.values()) {
      entry.age++;
    }
  }
}

/**
 * History table for move ordering
 */
class HistoryTable {
  constructor() {
    this.clear();
  }
  
  clear() {
    this.table = new Array(64 * 64).fill(0);
  }
  
  get(from, to) {
    return this.table[from * 64 + to];
  }
  
  update(from, to, depth) {
    const idx = from * 64 + to;
    this.table[idx] += depth * depth;
    
    if (this.table[idx] > 1000000) {
      this.decay(0.75);
    }
  }
  
  decay(factor) {
    for (let i = 0; i < this.table.length; i++) {
      this.table[i] = Math.floor(this.table[i] * factor);
    }
  }
}

/**
 * Main Chess Engine Class
 */
class ChessEngine2 {
  constructor(options = {}) {
    this.board = new Board();
    this.timeLimit = options.timeLimit || 3000; // 3 seconds per move max
    this.maxDepth = options.maxDepth || 40;     // Very deep, time will be the limit
    
    // Search statistics
    this.evaluations = 0;
    this.nodesSearched = 0;
    this.startTime = 0;
    this.timeCheckInterval = 1000; // Check time every 1000 nodes
    
    // Cache and move ordering
    this.transpositionTable = new TranspositionTable();
    this.historyTable = new HistoryTable();
    this.killerMoves = new Array(MAX_PLY * 2).fill(null);
    
    // Principal Variation tracking
    this.pvTable = new Array(MAX_PLY).fill(null).map(() => new Array(MAX_PLY).fill(null));
    this.pvLength = new Array(MAX_PLY).fill(0);
    
    // Search control flags
    this.searchAborted = false;
  }
  
  /**
   * Reset to starting position
   */
  resetBoard() {
    this.board.setupInitialPosition();
  }
  
  /**
   * Load position from FEN
   */
  loadPosition(fen) {
    this.board.loadFromFen(fen);
  }
  
  /**
   * Get search statistics
   */
  getStats() {
    return {
      evaluations: this.evaluations,
      timeElapsed: Date.now() - this.startTime,
      nodesSearched: this.nodesSearched,
      tableSize: this.transpositionTable.table.size
    };
  }
  
  /**
   * Find the best move for the current position
   */
  getBestMove() {
    this.evaluations = 0;
    this.nodesSearched = 0;
    this.startTime = Date.now();
    this.searchAborted = false;
    
    // Check opening book first
    const fen = this.board.toFen();
    if (OPENING_BOOK[fen]) {
      const moves = OPENING_BOOK[fen];
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex];
    }
    
    // Reset move ordering data
    this.historyTable.clear();
    this.killerMoves.fill(null);
    
    // Iterative deepening
    let bestMove = null;
    
    // Start from shallow depths and increase
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      // Find best move at current depth
      const result = this.search(depth);
      
      // If search was aborted due to time, use the previous result
      if (this.searchAborted) {
        break;
      }
      
      bestMove = result.move;
      
      // Exit if we've found a forced mate
      const score = result.score;
      if (Math.abs(score) > MATE_THRESHOLD) {
        break;
      }
      
      // Exit if we're close to time limit
      const elapsed = Date.now() - this.startTime;
      if (elapsed > this.timeLimit * 0.75) {
        break;
      }
    }
    
    return bestMove ? this.board.moveToUci(bestMove) : null;
  }
  
  /**
   * Alpha-beta search at a specific depth
   */
  search(depth) {
    const alpha = -INFINITY;
    const beta = INFINITY;
    
    return this.rootAlphaBeta(depth, alpha, beta);
  }
  
  /**
   * Root alpha-beta search
   */
  rootAlphaBeta(depth, alpha, beta) {
    const moves = this.board.getLegalMoves();
    
    // Handle special cases (no legal moves)
    if (moves.length === 0) {
      if (this.board.isInCheck(this.board.turn)) {
        return { score: -MATE_VALUE, move: null }; // Checkmate
      }
      return { score: 0, move: null }; // Stalemate
    }
    
    this.orderMoves(moves);
    
    let bestScore = -INFINITY;
    let bestMove = null;
    
    // Try each move
    for (const move of moves) {
      this.board.makeMove(move);
      
      // Get score (negated because we're alternating sides)
      const score = -this.alphaBeta(depth - 1, -beta, -alpha, 1);
      
      this.board.undoMove();
      
      // Check for timeout
      if (this.searchAborted) {
        break;
      }
      
      // Update best move if score is better
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        
        // Update alpha (for pruning)
        if (score > alpha) {
          alpha = score;
        }
      }
    }
    
    return { score: bestScore, move: bestMove };
  }
  
  /**
   * Alpha-beta search with pruning
   */
  alphaBeta(depth, alpha, beta, ply) {
    // Periodically check for time
    this.checkTime();
    
    // Base case - evaluate position
    if (depth <= 0) {
      return this.quiescenceSearch(alpha, beta);
    }
    
    // Check for draws
    if (this.isDraw()) {
      return 0;
    }
    
    // Check transposition table
    const ttEntry = this.transpositionTable.lookup(this.board.toFen());
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === TT_EXACT) {
        return ttEntry.value;
      } else if (ttEntry.flag === TT_ALPHA && ttEntry.value <= alpha) {
        return alpha;
      } else if (ttEntry.flag === TT_BETA && ttEntry.value >= beta) {
        return beta;
      }
    }
    
    const moves = this.board.getLegalMoves();
    
    // No legal moves
    if (moves.length === 0) {
      if (this.board.isInCheck(this.board.turn)) {
        return -MATE_VALUE + ply; // Checkmate
      }
      return 0; // Stalemate
    }
    
    // Try null move pruning (skip a turn if not in check)
    if (depth >= 3 && !this.board.isInCheck(this.board.turn) && this.hasNonPawnMaterial()) {
      this.makeNullMove();
      const nullScore = -this.alphaBeta(depth - 3, -beta, -beta + 1, ply + 1);
      this.undoNullMove();
      
      if (nullScore >= beta) {
        return beta;
      }
    }
    
    // Order moves for better pruning
    this.orderMoves(moves, ttEntry ? ttEntry.bestMove : null, ply);
    
    let bestScore = -INFINITY;
    let bestMove = null;
    let movesSearched = 0;
    
    // Try each move
    for (const move of moves) {
      this.board.makeMove(move);
      
      // Apply Late Move Reduction for quiet moves after we've searched 4+ moves
      let score;
      if (movesSearched >= 4 && depth >= 3 && !this.board.isInCheck(this.board.turn) && 
          move.captured === EMPTY && move.promotion === EMPTY) {
        // Search with reduced depth first
        score = -this.alphaBeta(depth - 2, -alpha - 1, -alpha, ply + 1);
        
        // If the score is promising, re-search at full depth
        if (score > alpha) {
          score = -this.alphaBeta(depth - 1, -beta, -alpha, ply + 1);
        }
      } else {
        // Normal search
        score = -this.alphaBeta(depth - 1, -beta, -alpha, ply + 1);
      }
      
      this.board.undoMove();
      
      // Check for timeout
      if (this.searchAborted) {
        return 0;
      }
      
      movesSearched++;
      
      // Update best score
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        
        // Update alpha (for pruning)
        if (score > alpha) {
          alpha = score;
          
          // Beta cutoff
          if (alpha >= beta) {
            // Record killer moves and update history for quiet moves
            if (move.captured === EMPTY) {
              this.recordKillerMove(move, ply);
              this.historyTable.update(move.from, move.to, depth);
            }
            break;
          }
        }
      }
    }
    
    // Store the position in the transposition table
    const flag = bestScore <= alpha ? TT_ALPHA : 
                bestScore >= beta ? TT_BETA : TT_EXACT;
    
    this.transpositionTable.store(
      this.board.toFen(), 
      depth, 
      bestScore, 
      flag, 
      bestMove
    );
    
    return bestScore;
  }
  
  /**
   * Quiescence search to resolve tactical positions
   */
  quiescenceSearch(alpha, beta) {
    this.evaluations++;
    this.checkTime();
    
    // Get static evaluation
    const standPat = this.evaluatePosition();
    
    // Return immediately if score exceeds beta
    if (standPat >= beta) {
      return beta;
    }
    
    // Update alpha if score is better
    if (standPat > alpha) {
      alpha = standPat;
    }
    
    // Get all captures
    const moves = this.board.getLegalMoves().filter(move => move.captured !== EMPTY);
    this.orderMoves(moves);
    
    // Try each capture
    for (const move of moves) {
      this.board.makeMove(move);
      
      // Evaluate after capture (negated)
      const score = -this.quiescenceSearch(-beta, -alpha);
      
      this.board.undoMove();
      
      // Check for timeout
      if (this.searchAborted) {
        return 0;
      }
      
      // Update alpha if score is better
      if (score > alpha) {
        alpha = score;
        
        // Beta cutoff
        if (alpha >= beta) {
          break;
        }
      }
    }
    
    return alpha;
  }
  
  /**
   * Order moves for better pruning
   */
  orderMoves(moves, ttMove = null, ply = 0) {
    moves.forEach(move => {
      let score = 0;
      
      // TT move gets highest priority
      if (ttMove && move.from === ttMove.from && move.to === ttMove.to) {
        score = 2000000;
      }
      // Captures using MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
      else if (move.captured !== EMPTY) {
        const capturedType = move.captured & PIECE_MASK;
        const attackerType = move.piece & PIECE_MASK;
        score = 1000000 + 10 * PIECE_VALUES[capturedType] - PIECE_VALUES[attackerType];
      }
      // Promotions
      else if (move.promotion !== EMPTY) {
        score = 900000 + PIECE_VALUES[move.promotion];
      }
      // Killer moves (moves that caused beta cutoffs)
      else if (this.isKillerMove(move, ply)) {
        score = 800000;
      }
      // History heuristic (moves that were good in similar positions)
      else {
        score = this.historyTable.get(move.from, move.to);
      }
      
      move.score = score;
    });
    
    // Sort by score (highest first)
    moves.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Record a killer move (quiet move that causes beta cutoff)
   */
  recordKillerMove(move, ply) {
    // Don't record captures as killer moves
    if (move.captured !== EMPTY) {
      return;
    }
    
    // Only record if it's different from the first killer
    if (this.killerMoves[ply * 2] && 
        this.killerMoves[ply * 2].from === move.from && 
        this.killerMoves[ply * 2].to === move.to) {
      return;
    }
    
    // Move the current first killer to second position
    this.killerMoves[ply * 2 + 1] = this.killerMoves[ply * 2];
    
    // Set the new first killer
    this.killerMoves[ply * 2] = move;
  }
  
  /**
   * Check if a move is a killer move
   */
  isKillerMove(move, ply) {
    // Check the two killer moves at this ply
    const killer1 = this.killerMoves[ply * 2];
    const killer2 = this.killerMoves[ply * 2 + 1];
    
    return (killer1 && killer1.from === move.from && killer1.to === move.to) ||
           (killer2 && killer2.from === move.from && killer2.to === move.to);
  }
  
  /**
   * Make a null move (pass the turn)
   */
  makeNullMove() {
    // Switch sides
    this.board.turn = this.board.turn === WHITE ? BLACK : WHITE;
    
    // Clear en passant square
    this.board.enPassantSquare = -1;
  }
  
  /**
   * Undo a null move
   */
  undoNullMove() {
    // Switch back
    this.board.turn = this.board.turn === WHITE ? BLACK : WHITE;
  }
  
  /**
   * Check if position has material beyond pawns
   */
  hasNonPawnMaterial() {
    const side = this.board.turn;
    
    for (let square = 0; square < 64; square++) {
      const piece = this.board.squares[square];
      if (piece !== EMPTY && (piece & COLOR_MASK) === side) {
        const pieceType = piece & PIECE_MASK;
        if (pieceType !== PAWN && pieceType !== KING) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check for draw conditions (3-fold repetition, 50-move rule, insufficient material)
   */
  isDraw() {
    // 50-move rule
    if (this.board.halfMoveClock >= 100) {
      return true;
    }
    
    // Insufficient material
    // Count pieces
    let whitePieces = { [PAWN]: 0, [KNIGHT]: 0, [BISHOP]: 0, [ROOK]: 0, [QUEEN]: 0 };
    let blackPieces = { [PAWN]: 0, [KNIGHT]: 0, [BISHOP]: 0, [ROOK]: 0, [QUEEN]: 0 };
    let whiteBishopSquareColor = -1;
    let blackBishopSquareColor = -1;
    
    for (let square = 0; square < 64; square++) {
      const piece = this.board.squares[square];
      if (piece === EMPTY) continue;
      
      const pieceType = piece & PIECE_MASK;
      const pieceColor = piece & COLOR_MASK;
      
      if (pieceType === KING) continue; // Kings are always present
      
      if (pieceColor === WHITE) {
        whitePieces[pieceType]++;
        
        // Track color of bishop (light/dark square)
        if (pieceType === BISHOP) {
          const squareColor = (Math.floor(square / 8) + square % 8) % 2;
          whiteBishopSquareColor = squareColor;
        }
      } else {
        blackPieces[pieceType]++;
        
        // Track color of bishop (light/dark square)
        if (pieceType === BISHOP) {
          const squareColor = (Math.floor(square / 8) + square % 8) % 2;
          blackBishopSquareColor = squareColor;
        }
      }
    }
    
    // King vs King
    if (Object.values(whitePieces).every(count => count === 0) && 
        Object.values(blackPieces).every(count => count === 0)) {
      return true;
    }
    
    // King + Bishop vs King
    if (Object.values(whitePieces).reduce((sum, count) => sum + count, 0) === 1 && 
        whitePieces[BISHOP] === 1 && 
        Object.values(blackPieces).every(count => count === 0)) {
      return true;
    }
    
    if (Object.values(blackPieces).reduce((sum, count) => sum + count, 0) === 1 && 
        blackPieces[BISHOP] === 1 && 
        Object.values(whitePieces).every(count => count === 0)) {
      return true;
    }
    
    // King + Knight vs King
    if (Object.values(whitePieces).reduce((sum, count) => sum + count, 0) === 1 && 
        whitePieces[KNIGHT] === 1 && 
        Object.values(blackPieces).every(count => count === 0)) {
      return true;
    }
    
    if (Object.values(blackPieces).reduce((sum, count) => sum + count, 0) === 1 && 
        blackPieces[KNIGHT] === 1 && 
        Object.values(whitePieces).every(count => count === 0)) {
      return true;
    }
    
    // King + Bishop vs King + Bishop (same colored bishops)
    if (whitePieces[BISHOP] === 1 && blackPieces[BISHOP] === 1 &&
        whiteBishopSquareColor === blackBishopSquareColor &&
        whitePieces[PAWN] === 0 && whitePieces[KNIGHT] === 0 && 
        whitePieces[ROOK] === 0 && whitePieces[QUEEN] === 0 &&
        blackPieces[PAWN] === 0 && blackPieces[KNIGHT] === 0 && 
        blackPieces[ROOK] === 0 && blackPieces[QUEEN] === 0) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if we've exceeded our time limit
   */
  checkTime() {
    this.nodesSearched++;
    
    // Only check time periodically to avoid frequent Date.now() calls
    if (this.nodesSearched % this.timeCheckInterval === 0) {
      if (Date.now() - this.startTime > this.timeLimit) {
        this.searchAborted = true;
      }
    }
  }
  
  /**
   * Evaluate the current position
   */
  evaluatePosition() {
    const us = this.board.turn;
    const them = us === WHITE ? BLACK : WHITE;
    
    // Initialize score
    let score = 0;
    
    // Material count and piece positions
    let whiteMaterial = 0;
    let blackMaterial = 0;
    let whitePieceCount = { [PAWN]: 0, [KNIGHT]: 0, [BISHOP]: 0, [ROOK]: 0, [QUEEN]: 0 };
    let blackPieceCount = { [PAWN]: 0, [KNIGHT]: 0, [BISHOP]: 0, [ROOK]: 0, [QUEEN]: 0 };
    
    // For tapered eval (phase calculation)
    let phase = TOTAL_PHASE;
    
    // Collect pawn positions for structure analysis
    const whitePawns = [];
    const blackPawns = [];
    
    // File counts for doubled/isolated pawns
    const whitePawnsPerFile = new Array(8).fill(0);
    const blackPawnsPerFile = new Array(8).fill(0);
    
    // Passed pawns
    const whitePassedPawns = [];
    const blackPassedPawns = [];
    
    // Rook files
    const whiteRookFiles = [];
    const blackRookFiles = [];
    
    // Evaluate each piece
    for (let square = 0; square < 64; square++) {
      const piece = this.board.squares[square];
      if (piece === EMPTY) continue;
      
      const pieceType = piece & PIECE_MASK;
      const pieceColor = piece & COLOR_MASK;
      const file = square % 8;
      const rank = Math.floor(square / 8);
      
      // Count material
      if (pieceColor === WHITE) {
        whiteMaterial += PIECE_VALUES[pieceType];
        whitePieceCount[pieceType]++;
        
        // Update phase
        phase -= PHASE_WEIGHTS[pieceType];
        
        // Track pawns for structure analysis
        if (pieceType === PAWN) {
          whitePawns.push(square);
          whitePawnsPerFile[file]++;
        }
        
        // Track rooks for open file detection
        if (pieceType === ROOK) {
          whiteRookFiles.push(file);
        }
      } else {
        blackMaterial += PIECE_VALUES[pieceType];
        blackPieceCount[pieceType]++;
        
        // Update phase
        phase -= PHASE_WEIGHTS[pieceType];
        
        // Track pawns for structure analysis
        if (pieceType === PAWN) {
          blackPawns.push(square);
          blackPawnsPerFile[file]++;
        }
        
        // Track rooks for open file detection
        if (pieceType === ROOK) {
          blackRookFiles.push(file);
        }
      }
      
      // Apply piece-square tables
      // Get square index from white's perspective
      const whiteOrientedSquare = pieceColor === WHITE ? square : (63 - square);
      
      // Get midgame and endgame values
      const mgValue = MG_TABLES[pieceType][whiteOrientedSquare];
      const egValue = EG_TABLES[pieceType][whiteOrientedSquare];
      
      if (pieceColor === WHITE) {
        score += mgValue;
      } else {
        score -= mgValue;
      }
    }
    
    // Bishop pair bonus
    if (whitePieceCount[BISHOP] >= 2) score += BISHOP_PAIR_BONUS;
    if (blackPieceCount[BISHOP] >= 2) score -= BISHOP_PAIR_BONUS;
    
    // Material score
    score += whiteMaterial - blackMaterial;
    
    // Pawn structure evaluation
    for (let file = 0; file < 8; file++) {
      // Doubled pawns
      if (whitePawnsPerFile[file] > 1) score += DOUBLED_PAWN_PENALTY * whitePawnsPerFile[file];
      if (blackPawnsPerFile[file] > 1) score -= DOUBLED_PAWN_PENALTY * blackPawnsPerFile[file];
      
      // Isolated pawns
      const whiteIsolated = whitePawnsPerFile[file] > 0 && 
                           (file === 0 || whitePawnsPerFile[file - 1] === 0) && 
                           (file === 7 || whitePawnsPerFile[file + 1] === 0);
      
      const blackIsolated = blackPawnsPerFile[file] > 0 && 
                           (file === 0 || blackPawnsPerFile[file - 1] === 0) && 
                           (file === 7 || blackPawnsPerFile[file + 1] === 0);
      
      if (whiteIsolated) score += ISOLATED_PAWN_PENALTY;
      if (blackIsolated) score -= ISOLATED_PAWN_PENALTY;
    }
    
    // Detect passed pawns
    for (const square of whitePawns) {
      const file = square % 8;
      const rank = Math.floor(square / 8);
      let isPassed = true;
      
      // Check if any black pawns can block this pawn
      for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
        for (let r = rank + 1; r < 8; r++) {
          const checkSquare = r * 8 + f;
          if (this.board.squares[checkSquare] === (PAWN | BLACK)) {
            isPassed = false;
            break;
          }
        }
        if (!isPassed) break;
      }
      
      if (isPassed) {
        score += PASSED_PAWN_BONUS[rank];
      }
    }
    
    for (const square of blackPawns) {
      const file = square % 8;
      const rank = Math.floor(square / 8);
      let isPassed = true;
      
      // Check if any white pawns can block this pawn
      for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
        for (let r = 0; r < rank; r++) {
          const checkSquare = r * 8 + f;
          if (this.board.squares[checkSquare] === (PAWN | WHITE)) {
            isPassed = false;
            break;
          }
        }
        if (!isPassed) break;
      }
      
      if (isPassed) {
        score -= PASSED_PAWN_BONUS[7 - rank];
      }
    }
    
    // Rook on open file
    for (const file of whiteRookFiles) {
      let isOpen = true;
      let isSemiOpen = true;
      
      for (let rank = 0; rank < 8; rank++) {
        const square = rank * 8 + file;
        const piece = this.board.squares[square];
        
        if (piece !== EMPTY) {
          if ((piece & PIECE_MASK) === PAWN) {
            if ((piece & COLOR_MASK) === WHITE) {
              isSemiOpen = false;
              isOpen = false;
              break;
            } else {
              isOpen = false;
            }
          }
        }
      }
      
      if (isOpen) {
        score += ROOK_ON_OPEN_FILE_BONUS;
      } else if (isSemiOpen) {
        score += ROOK_ON_SEMI_OPEN_FILE_BONUS;
      }
    }
    
    for (const file of blackRookFiles) {
      let isOpen = true;
      let isSemiOpen = true;
      
      for (let rank = 0; rank < 8; rank++) {
        const square = rank * 8 + file;
        const piece = this.board.squares[square];
        
        if (piece !== EMPTY) {
          if ((piece & PIECE_MASK) === PAWN) {
            if ((piece & COLOR_MASK) === BLACK) {
              isSemiOpen = false;
              isOpen = false;
              break;
            } else {
              isOpen = false;
            }
          }
        }
      }
      
      if (isOpen) {
        score -= ROOK_ON_OPEN_FILE_BONUS;
      } else if (isSemiOpen) {
        score -= ROOK_ON_SEMI_OPEN_FILE_BONUS;
      }
    }
    
    // Rook on 7th rank
    for (const square of whiteRookFiles.map(file => 6 * 8 + file)) {
      if (this.board.squares[square] === (ROOK | WHITE)) {
        score += ROOK_ON_SEVENTH_BONUS;
      }
    }
    
    for (const square of blackRookFiles.map(file => 1 * 8 + file)) {
      if (this.board.squares[square] === (ROOK | BLACK)) {
        score -= ROOK_ON_SEVENTH_BONUS;
      }
    }
    
    // Mobility evaluation
    this.board.turn = WHITE;
    const whiteMoves = this.board.getLegalMoves();
    
    this.board.turn = BLACK;
    const blackMoves = this.board.getLegalMoves();
    
    // Restore the original turn
    this.board.turn = us;
    
    score += MOBILITY_FACTOR * (whiteMoves.length - blackMoves.length);
    
    // Convert the score to the current player's perspective
    return us === WHITE ? score : -score;
  }
}

module.exports = ChessEngine2;
