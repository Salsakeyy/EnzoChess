/**
 * UCI (Universal Chess Interface) protocol implementation
 * This allows the engine to be used with standard chess GUIs
 */

const readline = require('readline');
const ChessEngine = require('./engine1');

class UCIInterface {
  constructor() {
    this.engine = new ChessEngine();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.rl.on('line', (line) => this.processCommand(line));
    
    // Default options
    this.options = {
      timeLimit: 3000,  // 3 seconds
      maxDepth: 40      // Set high depth limit - time will be the main constraint
    };
  }

  /**
   * Process a UCI command
   * @param {string} command - The UCI command
   */
  processCommand(command) {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case 'uci':
        this.uciCommand();
        break;
      case 'isready':
        this.isReadyCommand();
        break;
      case 'setoption':
        this.setOptionCommand(parts.slice(1));
        break;
      case 'ucinewgame':
        this.uciNewGameCommand();
        break;
      case 'position':
        this.positionCommand(parts.slice(1));
        break;
      case 'go':
        this.goCommand(parts.slice(1));
        break;
      case 'stop':
        this.stopCommand();
        break;
      case 'quit':
        this.quitCommand();
        break;
      case 'd':
        this.debugCommand();
        break;
      default:
        // Ignore unknown commands
        break;
    }
  }

  /**
   * UCI command - identify the engine
   */
  uciCommand() {
    console.log('id name ChessByte 1.0');
    console.log('id author Cline');

    // Available options
    console.log('option name Hash type spin default 128 min 1 max 1024');
    console.log('option name Threads type spin default 1 min 1 max 8');
    console.log('option name MoveTime type spin default 3000 min 100 max 60000');
    console.log('option name Depth type spin default 40 min 1 max 40');

    console.log('uciok');
  }

  /**
   * Confirm that the engine is ready
   */
  isReadyCommand() {
    console.log('readyok');
  }

  /**
   * Set an engine option
   * @param {Array} args - Option arguments
   */
  setOptionCommand(args) {
    // Parse option name and value
    let name = '';
    let value = '';
    let readingName = false;
    let readingValue = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === 'name') {
        readingName = true;
        readingValue = false;
      } else if (args[i] === 'value') {
        readingName = false;
        readingValue = true;
      } else if (readingName) {
        name += (name ? ' ' : '') + args[i];
      } else if (readingValue) {
        value += (value ? ' ' : '') + args[i];
      }
    }

    // Set the option
    switch (name.toLowerCase()) {
      case 'hash':
        // Hash table size in MB (ignored for now)
        break;
      case 'threads':
        // Number of threads (ignored for now)
        break;
      case 'movetime':
        this.options.timeLimit = parseInt(value) || 3000;
        this.engine.timeLimit = this.options.timeLimit;
        break;
      case 'depth':
        this.options.maxDepth = parseInt(value) || 40;
        this.engine.maxDepth = this.options.maxDepth;
        break;
    }
  }

  /**
   * Start a new game
   */
  uciNewGameCommand() {
    this.engine.reset();
  }

  /**
   * Set up a position on the board
   * @param {Array} args - Position arguments
   */
  positionCommand(args) {
    if (args.length === 0) return;

    let index = 0;
    let fen = '';

    // Parse position type
    if (args[0] === 'startpos') {
      this.engine.reset();
      index = 1;
    } else if (args[0] === 'fen') {
      // Parse FEN string
      index = 1;
      while (index < args.length && args[index] !== 'moves') {
        fen += args[index] + ' ';
        index++;
      }
      
      if (fen.trim()) {
        try {
          this.engine.loadPosition(fen);
        } catch (e) {
          console.error('Error loading FEN:', e.message);
          return;
        }
      }
    }

    // Apply moves if present
    if (index < args.length && args[index] === 'moves') {
      for (let i = index + 1; i < args.length; i++) {
        const uciMove = args[i];
        const success = this.engine.board.makeUciMove(uciMove);
        if (!success) {
          console.error('Invalid move:', uciMove);
          break;
        }
      }
    }
  }

  /**
   * Start calculating the best move
   * @param {Array} args - Go command arguments
   */
  goCommand(args) {
    let timeLimit = this.options.timeLimit;
    let depth = this.options.maxDepth;
    
    // Parse time control parameters
    for (let i = 0; i < args.length; i += 2) {
      if (i + 1 >= args.length) break;
      
      const param = args[i];
      const value = parseInt(args[i + 1]);
      
      if (isNaN(value)) continue;
      
      switch (param) {
        case 'depth':
          depth = value;
          break;
        case 'movetime':
          timeLimit = value;
          break;
        case 'wtime':
          if (this.engine.board.turn === 0x08) { // WHITE
            timeLimit = Math.min(value / 30, 5000); // Allocate 1/30 of remaining time
          }
          break;
        case 'btime':
          if (this.engine.board.turn === 0x10) { // BLACK
            timeLimit = Math.min(value / 30, 5000); // Allocate 1/30 of remaining time
          }
          break;
        // Other time control parameters (winc, binc, movestogo) could be handled here
      }
    }
    
    // Update engine parameters
    this.engine.timeLimit = timeLimit;
    this.engine.maxDepth = depth;
    
    // Start search in a separate process to keep the UCI interface responsive
    setTimeout(() => {
      const bestMove = this.engine.getBestMove();
      const stats = this.engine.getStats();
      
      console.log(`info depth ${depth} time ${stats.timeElapsed} nodes ${stats.evaluations} nps ${Math.floor(stats.evaluations / (stats.timeElapsed / 1000))}`);
      console.log(`bestmove ${bestMove || '(none)'}`);
    }, 0);
  }

  /**
   * Stop the current calculation
   */
  stopCommand() {
    // Since our engine doesn't support stopping yet, we just acknowledge
    // In a more advanced implementation, we would signal the engine to stop
    console.log('bestmove a1a1'); // Send a dummy move
  }

  /**
   * Quit the UCI interface
   */
  quitCommand() {
    this.rl.close();
    process.exit(0);
  }

  /**
   * Debug command - print the current board
   */
  debugCommand() {
    const fen = this.engine.board.toFen();
    console.log('Current position (FEN):', fen);
    
    // Print ASCII board representation
    const asciiBoard = this.getBoardString();
    console.log(asciiBoard);
    
    // Print legal moves
    const legalMoves = this.engine.board.getLegalMoves();
    console.log('Legal moves:', legalMoves.map(m => this.engine.board.moveToUci(m)).join(' '));
  }

  /**
   * Get ASCII representation of the current board
   * @returns {string} - Board string
   */
  getBoardString() {
    const { EMPTY, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE, BLACK, PIECE_MASK, COLOR_MASK } = require('./board');
    
    const pieceToChar = (piece) => {
      if (piece === EMPTY) return '.';
      
      const pieceType = piece & PIECE_MASK;
      const color = piece & COLOR_MASK;
      
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
      
      return color === WHITE ? char.toUpperCase() : char;
    };
    
    let result = '  +----------------+\n';
    
    for (let rank = 7; rank >= 0; rank--) {
      result += `${rank + 1} |`;
      
      for (let file = 0; file < 8; file++) {
        const square = rank * 8 + file;
        const piece = this.engine.board.squares[square];
        result += ` ${pieceToChar(piece)}`;
      }
      
      result += ' |\n';
    }
    
    result += '  +----------------+\n';
    result += '    a b c d e f g h\n';
    
    return result;
  }
}

// Start the UCI interface when run directly
if (require.main === module) {
  const uci = new UCIInterface();
  console.log('ChessByte 1.0 by Cline');
  console.log('Enter UCI commands (type "uci" to start)');
}

module.exports = UCIInterface;
