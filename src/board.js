/**
 * Chess board representation
 */

// Board constants
const EMPTY = 0;
const PAWN = 1;
const KNIGHT = 2;
const BISHOP = 3;
const ROOK = 4;
const QUEEN = 5;
const KING = 6;

const WHITE = 8;
const BLACK = 16;

const PIECE_MASK = 7;
const COLOR_MASK = 24;

// Castling constants
const CASTLE_WHITE_KINGSIDE = 1;
const CASTLE_WHITE_QUEENSIDE = 2;
const CASTLE_BLACK_KINGSIDE = 4;
const CASTLE_BLACK_QUEENSIDE = 8;

// File and rank utilities
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// Square indices (0-63)
// a1=0, b1=1, ..., h8=63
// For easier move generation and evaluation
const SQUARES = {
  a1: 0, b1: 1, c1: 2, d1: 3, e1: 4, f1: 5, g1: 6, h1: 7,
  a2: 8, b2: 9, c2: 10, d2: 11, e2: 12, f2: 13, g2: 14, h2: 15,
  a3: 16, b3: 17, c3: 18, d3: 19, e3: 20, f3: 21, g3: 22, h3: 23,
  a4: 24, b4: 25, c4: 26, d4: 27, e4: 28, f4: 29, g4: 30, h4: 31,
  a5: 32, b5: 33, c5: 34, d5: 35, e5: 36, f5: 37, g5: 38, h5: 39,
  a6: 40, b6: 41, c6: 42, d6: 43, e6: 44, f6: 45, g6: 46, h6: 47,
  a7: 48, b7: 49, c7: 50, d7: 51, e7: 52, f7: 53, g7: 54, h7: 55,
  a8: 56, b8: 57, c8: 58, d8: 59, e8: 60, f8: 61, g8: 62, h8: 63
};

// Directions for piece movement
const DIRECTIONS = {
  N: 8,
  S: -8,
  E: 1,
  W: -1,
  NE: 9,
  NW: 7,
  SE: -7,
  SW: -9
};

// Knight move offsets
const KNIGHT_MOVES = [15, 17, 10, 6, -6, -10, -15, -17];

// Bishop move directions
const BISHOP_DIRECTIONS = [DIRECTIONS.NE, DIRECTIONS.NW, DIRECTIONS.SE, DIRECTIONS.SW];

// Rook move directions
const ROOK_DIRECTIONS = [DIRECTIONS.N, DIRECTIONS.E, DIRECTIONS.S, DIRECTIONS.W];

// Queen move directions (combination of bishop and rook)
const QUEEN_DIRECTIONS = [...BISHOP_DIRECTIONS, ...ROOK_DIRECTIONS];

class Board {
  constructor() {
    // Board is represented as an array of 64 squares
    this.squares = new Array(64).fill(EMPTY);
    
    // Game state
    this.turn = WHITE;
    this.castlingRights = CASTLE_WHITE_KINGSIDE | CASTLE_WHITE_QUEENSIDE | CASTLE_BLACK_KINGSIDE | CASTLE_BLACK_QUEENSIDE;
    this.enPassantSquare = -1;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    
    // King positions for quick access (useful for check detection)
    this.whiteKingPos = SQUARES.e1;
    this.blackKingPos = SQUARES.e8;
    
    // Move history for undoing moves
    this.history = [];
  }
  
  /**
   * Set up the initial chess position
   */
  setupInitialPosition() {
    // Clear the board
    this.squares.fill(EMPTY);
    
    // Set up white pieces
    this.squares[SQUARES.a1] = ROOK | WHITE;
    this.squares[SQUARES.b1] = KNIGHT | WHITE;
    this.squares[SQUARES.c1] = BISHOP | WHITE;
    this.squares[SQUARES.d1] = QUEEN | WHITE;
    this.squares[SQUARES.e1] = KING | WHITE;
    this.squares[SQUARES.f1] = BISHOP | WHITE;
    this.squares[SQUARES.g1] = KNIGHT | WHITE;
    this.squares[SQUARES.h1] = ROOK | WHITE;
    
    // Set up white pawns
    for (let file = 0; file < 8; file++) {
      this.squares[SQUARES[`${FILES[file]}2`]] = PAWN | WHITE;
    }
    
    // Set up black pieces
    this.squares[SQUARES.a8] = ROOK | BLACK;
    this.squares[SQUARES.b8] = KNIGHT | BLACK;
    this.squares[SQUARES.c8] = BISHOP | BLACK;
    this.squares[SQUARES.d8] = QUEEN | BLACK;
    this.squares[SQUARES.e8] = KING | BLACK;
    this.squares[SQUARES.f8] = BISHOP | BLACK;
    this.squares[SQUARES.g8] = KNIGHT | BLACK;
    this.squares[SQUARES.h8] = ROOK | BLACK;
    
    // Set up black pawns
    for (let file = 0; file < 8; file++) {
      this.squares[SQUARES[`${FILES[file]}7`]] = PAWN | BLACK;
    }
    
    // Reset game state
    this.turn = WHITE;
    this.castlingRights = CASTLE_WHITE_KINGSIDE | CASTLE_WHITE_QUEENSIDE | CASTLE_BLACK_KINGSIDE | CASTLE_BLACK_QUEENSIDE;
    this.enPassantSquare = -1;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    
    // Set king positions
    this.whiteKingPos = SQUARES.e1;
    this.blackKingPos = SQUARES.e8;
    
    // Clear history
    this.history = [];
  }
  
  /**
   * Load position from FEN notation
   * @param {string} fen - The FEN string
   */
  loadFromFen(fen) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) {
      throw new Error('Invalid FEN string');
    }
    
    // Clear the board
    this.squares.fill(EMPTY);
    
    // Parse piece placement
    const rows = parts[0].split('/');
    if (rows.length !== 8) {
      throw new Error('Invalid FEN: piece placement must have 8 rows');
    }
    
    let square = 56; // Start at a8
    for (const row of rows) {
      let file = 0;
      for (const char of row) {
        if (/[1-8]/.test(char)) {
          // Skip empty squares
          file += parseInt(char, 10);
        } else {
          // Place piece
          const piece = this.fenCharToPiece(char);
          if (piece) {
            this.squares[square + file] = piece;
            
            // Track king positions
            if ((piece & PIECE_MASK) === KING) {
              if ((piece & COLOR_MASK) === WHITE) {
                this.whiteKingPos = square + file;
              } else {
                this.blackKingPos = square + file;
              }
            }
          }
          file++;
        }
      }
      square -= 8; // Move to next row
    }
    
    // Parse active color
    this.turn = parts[1] === 'w' ? WHITE : BLACK;
    
    // Parse castling rights
    this.castlingRights = 0;
    if (parts[2] !== '-') {
      if (parts[2].includes('K')) this.castlingRights |= CASTLE_WHITE_KINGSIDE;
      if (parts[2].includes('Q')) this.castlingRights |= CASTLE_WHITE_QUEENSIDE;
      if (parts[2].includes('k')) this.castlingRights |= CASTLE_BLACK_KINGSIDE;
      if (parts[2].includes('q')) this.castlingRights |= CASTLE_BLACK_QUEENSIDE;
    }
    
    // Parse en passant square
    if (parts[3] === '-') {
      this.enPassantSquare = -1;
    } else {
      this.enPassantSquare = SQUARES[parts[3]];
    }
    
    // Parse half move clock and full move number if provided
    this.halfMoveClock = parts.length > 4 ? parseInt(parts[4], 10) : 0;
    this.fullMoveNumber = parts.length > 5 ? parseInt(parts[5], 10) : 1;
    
    // Clear history
    this.history = [];
  }
  
  /**
   * Convert FEN character to piece code
   * @param {string} char - The FEN character
   * @returns {number} - The piece code
   */
  fenCharToPiece(char) {
    const isWhite = char === char.toUpperCase();
    const color = isWhite ? WHITE : BLACK;
    
    switch (char.toLowerCase()) {
      case 'p': return PAWN | color;
      case 'n': return KNIGHT | color;
      case 'b': return BISHOP | color;
      case 'r': return ROOK | color;
      case 'q': return QUEEN | color;
      case 'k': return KING | color;
      default: return EMPTY;
    }
  }
  
  /**
   * Convert piece code to FEN character
   * @param {number} piece - The piece code
   * @returns {string} - The FEN character
   */
  pieceToFenChar(piece) {
    if (piece === EMPTY) return '.';
    
    const pieceType = piece & PIECE_MASK;
    const isWhite = (piece & COLOR_MASK) === WHITE;
    
    let char;
    switch (pieceType) {
      case PAWN: char = 'p'; break;
      case KNIGHT: char = 'n'; break;
      case BISHOP: char = 'b'; break;
      case ROOK: char = 'r'; break;
      case QUEEN: char = 'q'; break;
      case KING: char = 'k'; break;
      default: return '.';
    }
    
    return isWhite ? char.toUpperCase() : char;
  }
  
  /**
   * Get FEN string for the current position
   * @returns {string} - The FEN string
   */
  toFen() {
    let fen = '';
    
    // Piece placement
    for (let rank = 7; rank >= 0; rank--) {
      let emptyCount = 0;
      for (let file = 0; file < 8; file++) {
        const square = rank * 8 + file;
        const piece = this.squares[square];
        
        if (piece === EMPTY) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += this.pieceToFenChar(piece);
        }
      }
      
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      
      if (rank > 0) {
        fen += '/';
      }
    }
    
    // Active color
    fen += ' ' + (this.turn === WHITE ? 'w' : 'b');
    
    // Castling rights
    let castling = '';
    if (this.castlingRights & CASTLE_WHITE_KINGSIDE) castling += 'K';
    if (this.castlingRights & CASTLE_WHITE_QUEENSIDE) castling += 'Q';
    if (this.castlingRights & CASTLE_BLACK_KINGSIDE) castling += 'k';
    if (this.castlingRights & CASTLE_BLACK_QUEENSIDE) castling += 'q';
    fen += ' ' + (castling || '-');
    
    // En passant square
    if (this.enPassantSquare !== -1) {
      const file = this.enPassantSquare % 8;
      const rank = Math.floor(this.enPassantSquare / 8);
      fen += ' ' + FILES[file] + RANKS[rank];
    } else {
      fen += ' -';
    }
    
    // Half move clock and full move number
    fen += ' ' + this.halfMoveClock;
    fen += ' ' + this.fullMoveNumber;
    
    return fen;
  }
  
  /**
   * Check if a square is on the board
   * @param {number} square - The square index
   * @returns {boolean} - True if the square is on the board
   */
  isSquareOnBoard(square) {
    return square >= 0 && square < 64;
  }
  
  /**
   * Check if a square is attacked by a specific color
   * @param {number} square - The square to check
   * @param {number} attackingColor - The color of the attacker
   * @returns {boolean} - True if the square is attacked
   */
  isSquareAttacked(square, attackingColor) {
    // Check pawn attacks
    const pawnDir = attackingColor === WHITE ? -8 : 8;
    const pawnAttacks = [pawnDir + 1, pawnDir - 1];
    for (const offset of pawnAttacks) {
      const s = square + offset;
      if (this.isSquareOnBoard(s)) {
        const file1 = square % 8;
        const file2 = s % 8;
        if (Math.abs(file1 - file2) === 1) { // Make sure we don't wrap around the board
          const piece = this.squares[s];
          if (piece !== EMPTY && (piece & PIECE_MASK) === PAWN && (piece & COLOR_MASK) === attackingColor) {
            return true;
          }
        }
      }
    }
    
    // Check knight attacks
    for (const offset of KNIGHT_MOVES) {
      const s = square + offset;
      if (this.isSquareOnBoard(s)) {
        const file1 = square % 8;
        const file2 = s % 8;
        const rank1 = Math.floor(square / 8);
        const rank2 = Math.floor(s / 8);
        if (Math.abs(file1 - file2) <= 2 && Math.abs(rank1 - rank2) <= 2) { // Knight move check
          const piece = this.squares[s];
          if (piece !== EMPTY && (piece & PIECE_MASK) === KNIGHT && (piece & COLOR_MASK) === attackingColor) {
            return true;
          }
        }
      }
    }
    
    // Check bishop, rook, and queen attacks
    for (const dir of QUEEN_DIRECTIONS) {
      let s = square + dir;
      let steps = 1;
      
      while (this.isSquareOnBoard(s)) {
        // Check if we've gone too far in one direction (wrapped around the board)
        const file1 = (square + (steps - 1) * dir) % 8;
        const file2 = s % 8;
        if (Math.abs(file1 - file2) > 2 && (dir === 1 || dir === -1 || dir === 9 || dir === -7 || dir === 7 || dir === -9)) {
          break;
        }
        
        const piece = this.squares[s];
        if (piece !== EMPTY) {
          const pieceType = piece & PIECE_MASK;
          const pieceColor = piece & COLOR_MASK;
          
          if (pieceColor === attackingColor) {
            if (pieceType === QUEEN || 
               (pieceType === BISHOP && BISHOP_DIRECTIONS.includes(dir)) || 
               (pieceType === ROOK && ROOK_DIRECTIONS.includes(dir))) {
              return true;
            }
          }
          break; // Stop checking this direction if we hit any piece
        }
        
        s += dir;
        steps++;
      }
    }
    
    // Check king attacks
    for (const dir of QUEEN_DIRECTIONS) {
      const s = square + dir;
      if (this.isSquareOnBoard(s)) {
        const file1 = square % 8;
        const file2 = s % 8;
        if (Math.abs(file1 - file2) <= 1 || dir === 8 || dir === -8) { // Make sure we don't wrap around the board
          const piece = this.squares[s];
          if (piece !== EMPTY && (piece & PIECE_MASK) === KING && (piece & COLOR_MASK) === attackingColor) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if the king of the given color is in check
   * @param {number} color - The king's color
   * @returns {boolean} - True if the king is in check
   */
  isInCheck(color) {
    const kingPos = color === WHITE ? this.whiteKingPos : this.blackKingPos;
    return this.isSquareAttacked(kingPos, color === WHITE ? BLACK : WHITE);
  }
  
  /**
   * Get all legal moves for the current position
   * @returns {Array} - Array of legal moves
   */
  getLegalMoves() {
    const moves = [];
    const us = this.turn;
    const them = us === WHITE ? BLACK : WHITE;
    
    for (let square = 0; square < 64; square++) {
      const piece = this.squares[square];
      
      // Skip empty squares and opponent pieces
      if (piece === EMPTY || (piece & COLOR_MASK) !== us) {
        continue;
      }
      
      const pieceType = piece & PIECE_MASK;
      
      switch (pieceType) {
        case PAWN:
          this.generatePawnMoves(square, moves);
          break;
        case KNIGHT:
          this.generateKnightMoves(square, moves);
          break;
        case BISHOP:
          this.generateSlidingMoves(square, BISHOP_DIRECTIONS, moves);
          break;
        case ROOK:
          this.generateSlidingMoves(square, ROOK_DIRECTIONS, moves);
          break;
        case QUEEN:
          this.generateSlidingMoves(square, QUEEN_DIRECTIONS, moves);
          break;
        case KING:
          this.generateKingMoves(square, moves);
          break;
      }
    }
    
    // Filter out moves that would leave the king in check
    return moves.filter(move => {
      this.makeMove(move);
      const inCheck = this.isInCheck(us);
      this.undoMove();
      return !inCheck;
    });
  }
  
  /**
   * Generate pawn moves
   * @param {number} square - The pawn's square
   * @param {Array} moves - Array to add moves to
   */
  generatePawnMoves(square, moves) {
    const us = this.turn;
    const them = us === WHITE ? BLACK : WHITE;
    
    const direction = us === WHITE ? 8 : -8;
    const startRank = us === WHITE ? 1 : 6;
    const promotionRank = us === WHITE ? 6 : 1;
    
    // Single pawn push
    let to = square + direction;
    if (this.isSquareOnBoard(to) && this.squares[to] === EMPTY) {
      if (Math.floor(square / 8) === promotionRank) {
        // Promotion
        moves.push(this.createMove(square, to, QUEEN));  // Default to queen promotion
        moves.push(this.createMove(square, to, ROOK));
        moves.push(this.createMove(square, to, BISHOP));
        moves.push(this.createMove(square, to, KNIGHT));
      } else {
        moves.push(this.createMove(square, to));
      }
      
      // Double pawn push from starting rank
      if (Math.floor(square / 8) === startRank) {
        to = square + 2 * direction;
        if (this.isSquareOnBoard(to) && this.squares[to] === EMPTY) {
          moves.push(this.createMove(square, to));
        }
      }
    }
    
    // Pawn captures
    const captureDirections = [direction + 1, direction - 1];
    for (const offset of captureDirections) {
      to = square + offset;
      if (this.isSquareOnBoard(to)) {
        const file1 = square % 8;
        const file2 = to % 8;
        if (Math.abs(file1 - file2) === 1) { // Make sure we don't wrap around the board
          const targetPiece = this.squares[to];
          
          // Regular capture
          if (targetPiece !== EMPTY && (targetPiece & COLOR_MASK) === them) {
            if (Math.floor(square / 8) === promotionRank) {
              // Capture with promotion
              moves.push(this.createMove(square, to, QUEEN));
              moves.push(this.createMove(square, to, ROOK));
              moves.push(this.createMove(square, to, BISHOP));
              moves.push(this.createMove(square, to, KNIGHT));
            } else {
              moves.push(this.createMove(square, to));
            }
          }
          
          // En passant capture
          if (to === this.enPassantSquare) {
            moves.push(this.createMove(square, to, EMPTY, true));
          }
        }
      }
    }
  }
  
  /**
   * Generate knight moves
   * @param {number} square - The knight's square
   * @param {Array} moves - Array to add moves to
   */
  generateKnightMoves(square, moves) {
    const us = this.turn;
    
    for (const offset of KNIGHT_MOVES) {
      const to = square + offset;
      if (this.isSquareOnBoard(to)) {
        const file1 = square % 8;
        const file2 = to % 8;
        const rank1 = Math.floor(square / 8);
        const rank2 = Math.floor(to / 8);
        
        // Knight can move max 2 squares in any direction
        if (Math.abs(file1 - file2) > 2 || Math.abs(rank1 - rank2) > 2) {
          continue;
        }
        
        const targetPiece = this.squares[to];
        if (targetPiece === EMPTY || (targetPiece & COLOR_MASK) !== us) {
          moves.push(this.createMove(square, to));
        }
      }
    }
  }
  
  /**
   * Generate sliding moves (bishop, rook, queen)
   * @param {number} square - The piece's square
   * @param {Array} directions - The directions to check
   * @param {Array} moves - Array to add moves to
   */
  generateSlidingMoves(square, directions, moves) {
    const us = this.turn;
    
    for (const dir of directions) {
      let to = square + dir;
      let steps = 1;
      
      while (this.isSquareOnBoard(to)) {
        // Check if we've gone too far in one direction (wrapped around the board)
        const file1 = (square + (steps - 1) * dir) % 8;
        const file2 = to % 8;
        if (Math.abs(file1 - file2) > 2 && (dir === 1 || dir === -1 || dir === 9 || dir === -7 || dir === 7 || dir === -9)) {
          break;
        }
        
        const targetPiece = this.squares[to];
        if (targetPiece === EMPTY) {
          // Quiet move to empty square
          moves.push(this.createMove(square, to));
        } else {
          // Capture
          if ((targetPiece & COLOR_MASK) !== us) {
            moves.push(this.createMove(square, to));
          }
          break; // Stop after capture
        }
        
        to += dir;
        steps++;
      }
    }
  }
  
  /**
   * Generate king moves
   * @param {number} square - The king's square
   * @param {Array} moves - Array to add moves to
   */
  generateKingMoves(square, moves) {
    const us = this.turn;
    
    // Regular king moves
    for (const dir of QUEEN_DIRECTIONS) {
      const to = square + dir;
      if (this.isSquareOnBoard(to)) {
        const file1 = square % 8;
        const file2 = to % 8;
        if (Math.abs(file1 - file2) <= 1 || dir === 8 || dir === -8) { // Make sure we don't wrap around the board
          const targetPiece = this.squares[to];
          if (targetPiece === EMPTY || (targetPiece & COLOR_MASK) !== us) {
            moves.push(this.createMove(square, to));
          }
        }
      }
    }
    
    // Castling
    if (!this.isInCheck(us)) {
      if (us === WHITE) {
        // White kingside castling
        if (this.castlingRights & CASTLE_WHITE_KINGSIDE) {
          if (this.squares[SQUARES.f1] === EMPTY && this.squares[SQUARES.g1] === EMPTY) {
            if (!this.isSquareAttacked(SQUARES.f1, BLACK) && !this.isSquareAttacked(SQUARES.g1, BLACK)) {
              moves.push(this.createMove(SQUARES.e1, SQUARES.g1, EMPTY, false, true));
            }
          }
        }
        
        // White queenside castling
        if (this.castlingRights & CASTLE_WHITE_QUEENSIDE) {
          if (this.squares[SQUARES.d1] === EMPTY && this.squares[SQUARES.c1] === EMPTY && this.squares[SQUARES.b1] === EMPTY) {
            if (!this.isSquareAttacked(SQUARES.d1, BLACK) && !this.isSquareAttacked(SQUARES.c1, BLACK)) {
              moves.push(this.createMove(SQUARES.e1, SQUARES.c1, EMPTY, false, true));
            }
          }
        }
      } else {
        // Black kingside castling
        if (this.castlingRights & CASTLE_BLACK_KINGSIDE) {
          if (this.squares[SQUARES.f8] === EMPTY && this.squares[SQUARES.g8] === EMPTY) {
            if (!this.isSquareAttacked(SQUARES.f8, WHITE) && !this.isSquareAttacked(SQUARES.g8, WHITE)) {
              moves.push(this.createMove(SQUARES.e8, SQUARES.g8, EMPTY, false, true));
            }
          }
        }
        
        // Black queenside castling
        if (this.castlingRights & CASTLE_BLACK_QUEENSIDE) {
          if (this.squares[SQUARES.d8] === EMPTY && this.squares[SQUARES.c8] === EMPTY && this.squares[SQUARES.b8] === EMPTY) {
            if (!this.isSquareAttacked(SQUARES.d8, WHITE) && !this.isSquareAttacked(SQUARES.c8, WHITE)) {
              moves.push(this.createMove(SQUARES.e8, SQUARES.c8, EMPTY, false, true));
            }
          }
        }
      }
    }
  }
  
  /**
   * Create a move object
   * @param {number} from - The source square
   * @param {number} to - The target square
   * @param {number} promotion - The promotion piece type (optional)
   * @param {boolean} isEnPassant - Whether the move is an en passant capture (optional)
   * @param {boolean} isCastle - Whether the move is a castling move (optional)
   * @returns {Object} - The move object
   */
  createMove(from, to, promotion = EMPTY, isEnPassant = false, isCastle = false) {
    return {
      from,
      to,
      piece: this.squares[from],
      captured: isEnPassant ? (PAWN | (this.turn === WHITE ? BLACK : WHITE)) : this.squares[to],
      promotion,
      isEnPassant,
      isCastle,
      castlingRights: this.castlingRights,
      enPassantSquare: this.enPassantSquare,
      halfMoveClock: this.halfMoveClock
    };
  }
  
  /**
   * Make a move on the board
   * @param {Object} move - The move to make
   */
  makeMove(move) {
    const { from, to, piece, captured, promotion, isEnPassant, isCastle } = move;
    const pieceType = piece & PIECE_MASK;
    const us = this.turn;
    const them = us === WHITE ? BLACK : WHITE;
    
    // Save the move to history for undoing
    this.history.push({ ...move });
    
    // Update half-move clock
    if (pieceType === PAWN || captured !== EMPTY) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }
    
    // Update full-move number
    if (us === BLACK) {
      this.fullMoveNumber++;
    }
    
    // Clear en passant square
    const oldEnPassantSquare = this.enPassantSquare;
    this.enPassantSquare = -1;
    
    // Move the piece
    this.squares[from] = EMPTY;
    
    // Handle promotion
    if (promotion !== EMPTY) {
      this.squares[to] = promotion | us;
    } else {
      this.squares[to] = piece;
    }
    
    // Handle en passant capture
    if (isEnPassant) {
      // Remove the captured pawn
      const capturedPawnSquare = to - (us === WHITE ? 8 : -8);
      this.squares[capturedPawnSquare] = EMPTY;
    }
    
    // Handle castling
    if (isCastle) {
      // Move the rook
      if (to === SQUARES.g1) {
        // White kingside
        this.squares[SQUARES.f1] = this.squares[SQUARES.h1];
        this.squares[SQUARES.h1] = EMPTY;
      } else if (to === SQUARES.c1) {
        // White queenside
        this.squares[SQUARES.d1] = this.squares[SQUARES.a1];
        this.squares[SQUARES.a1] = EMPTY;
      } else if (to === SQUARES.g8) {
        // Black kingside
        this.squares[SQUARES.f8] = this.squares[SQUARES.h8];
        this.squares[SQUARES.h8] = EMPTY;
      } else if (to === SQUARES.c8) {
        // Black queenside
        this.squares[SQUARES.d8] = this.squares[SQUARES.a8];
        this.squares[SQUARES.a8] = EMPTY;
      }
    }
    
    // Set en passant square if pawn makes a double push
    if (pieceType === PAWN && Math.abs(to - from) === 16) {
      this.enPassantSquare = from + (us === WHITE ? 8 : -8);
    }
    
    // Update castling rights
    this.updateCastlingRights(from, to);
    
    // Update king position if king moved
    if (pieceType === KING) {
      if (us === WHITE) {
        this.whiteKingPos = to;
      } else {
        this.blackKingPos = to;
      }
    }
    
    // Switch turn
    this.turn = them;
  }
  
  /**
   * Update castling rights
   * @param {number} from - The source square
   * @param {number} to - The target square
   */
  updateCastlingRights(from, to) {
    // If king moves, remove both castling rights for that color
    if (from === SQUARES.e1) {
      this.castlingRights &= ~(CASTLE_WHITE_KINGSIDE | CASTLE_WHITE_QUEENSIDE);
    } else if (from === SQUARES.e8) {
      this.castlingRights &= ~(CASTLE_BLACK_KINGSIDE | CASTLE_BLACK_QUEENSIDE);
    }
    
    // If rook moves or is captured, remove corresponding castling right
    if (from === SQUARES.a1 || to === SQUARES.a1) {
      this.castlingRights &= ~CASTLE_WHITE_QUEENSIDE;
    } else if (from === SQUARES.h1 || to === SQUARES.h1) {
      this.castlingRights &= ~CASTLE_WHITE_KINGSIDE;
    } else if (from === SQUARES.a8 || to === SQUARES.a8) {
      this.castlingRights &= ~CASTLE_BLACK_QUEENSIDE;
    } else if (from === SQUARES.h8 || to === SQUARES.h8) {
      this.castlingRights &= ~CASTLE_BLACK_KINGSIDE;
    }
  }
  
  /**
   * Undo the last move
   */
  undoMove() {
    if (this.history.length === 0) {
      return null;
    }
    
    const move = this.history.pop();
    const { from, to, piece, captured, promotion, isEnPassant, isCastle, castlingRights, enPassantSquare, halfMoveClock } = move;
    
    // Switch turn back
    this.turn = this.turn === WHITE ? BLACK : WHITE;
    
    // Restore castling rights
    this.castlingRights = castlingRights;
    
    // Restore en passant square
    this.enPassantSquare = enPassantSquare;
    
    // Restore half-move clock
    this.halfMoveClock = halfMoveClock;
    
    // If black moved, decrement full move number
    if (this.turn === BLACK) {
      this.fullMoveNumber--;
    }
    
    // Move piece back to original square
    this.squares[from] = piece;
    
    // Handle promotion (restore original pawn)
    if (promotion !== EMPTY) {
      this.squares[to] = captured;
    } else if (isEnPassant) {
      // For en passant, clear the target square and restore the captured pawn
      this.squares[to] = EMPTY;
      const capturedPawnSquare = to - (this.turn === WHITE ? 8 : -8);
      this.squares[capturedPawnSquare] = PAWN | (this.turn === WHITE ? BLACK : WHITE);
    } else {
      // Restore captured piece or clear target square
      this.squares[to] = captured;
    }
    
    // Handle castling (move rook back)
    if (isCastle) {
      if (to === SQUARES.g1) {
        // White kingside
        this.squares[SQUARES.h1] = this.squares[SQUARES.f1];
        this.squares[SQUARES.f1] = EMPTY;
      } else if (to === SQUARES.c1) {
        // White queenside
        this.squares[SQUARES.a1] = this.squares[SQUARES.d1];
        this.squares[SQUARES.d1] = EMPTY;
      } else if (to === SQUARES.g8) {
        // Black kingside
        this.squares[SQUARES.h8] = this.squares[SQUARES.f8];
        this.squares[SQUARES.f8] = EMPTY;
      } else if (to === SQUARES.c8) {
        // Black queenside
        this.squares[SQUARES.a8] = this.squares[SQUARES.d8];
        this.squares[SQUARES.d8] = EMPTY;
      }
    }
    
    // Update king position if king moved
    if ((piece & PIECE_MASK) === KING) {
      if (this.turn === WHITE) {
        this.whiteKingPos = from;
      } else {
        this.blackKingPos = from;
      }
    }
    
    return move;
  }
  
  /**
   * Format a move in UCI notation
   * @param {Object} move - The move object
   * @returns {string} - The UCI notation string
   */
  moveToUci(move) {
    const { from, to, promotion } = move;
    const fromFile = from % 8;
    const fromRank = Math.floor(from / 8);
    const toFile = to % 8;
    const toRank = Math.floor(to / 8);
    
    let uci = FILES[fromFile] + RANKS[fromRank] + FILES[toFile] + RANKS[toRank];
    
    // Add promotion piece if applicable
    if (promotion !== EMPTY) {
      let promotionChar = '';
      switch (promotion) {
        case QUEEN: promotionChar = 'q'; break;
        case ROOK: promotionChar = 'r'; break;
        case BISHOP: promotionChar = 'b'; break;
        case KNIGHT: promotionChar = 'n'; break;
      }
      uci += promotionChar;
    }
    
    return uci;
  }
  
  /**
   * Parse a move in UCI notation
   * @param {string} uci - The UCI notation string
   * @returns {Object|null} - The move object or null if not a valid move
   */
  uciToMove(uci) {
    if (uci.length < 4) {
      return null;
    }
    
    const fromFile = FILES.indexOf(uci[0]);
    const fromRank = RANKS.indexOf(uci[1]);
    const toFile = FILES.indexOf(uci[2]);
    const toRank = RANKS.indexOf(uci[3]);
    
    if (fromFile === -1 || fromRank === -1 || toFile === -1 || toRank === -1) {
      return null;
    }
    
    const from = fromRank * 8 + fromFile;
    const to = toRank * 8 + toFile;
    
    // Check for promotion
    let promotion = EMPTY;
    if (uci.length > 4) {
      switch (uci[4]) {
        case 'q': promotion = QUEEN; break;
        case 'r': promotion = ROOK; break;
        case 'b': promotion = BISHOP; break;
        case 'n': promotion = KNIGHT; break;
      }
    }
    
    // Check if the move is a castling move
    const piece = this.squares[from];
    const pieceType = piece & PIECE_MASK;
    const isCastle = pieceType === KING && Math.abs(fromFile - toFile) > 1;
    
    // Check if the move is an en passant capture
    const isEnPassant = pieceType === PAWN && toFile !== fromFile && this.squares[to] === EMPTY;
    
    // Create and return the move
    return this.createMove(from, to, promotion, isEnPassant, isCastle);
  }
  
  /**
   * Make a move from UCI notation
   * @param {string} uci - The UCI notation string
   * @returns {boolean} - True if the move was made successfully
   */
  makeUciMove(uci) {
    const move = this.uciToMove(uci);
    if (!move) {
      return false;
    }
    
    // Check if the move is legal
    const legalMoves = this.getLegalMoves();
    const isLegal = legalMoves.some(m => 
      m.from === move.from && 
      m.to === move.to && 
      m.promotion === move.promotion
    );
    
    if (!isLegal) {
      return false;
    }
    
    this.makeMove(move);
    return true;
  }
}

module.exports = {
  Board,
  EMPTY,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  WHITE,
  BLACK,
  PIECE_MASK,
  COLOR_MASK,
  SQUARES,
  FILES,
  RANKS
};
