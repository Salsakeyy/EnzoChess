#!/usr/bin/env node

/**
 * ChessByte Engine - Main Entry Point
 * 
 * This file serves as the main entry point for the chess engine.
 * It can be run in different modes depending on the command-line arguments.
 */

const ChessEngine = require('./src/engine1');
const ChessEngine2 = require('./src/engine2');
const UCIInterface = require('./src/uci');
const readline = require('readline');
const { Board } = require('./src/board');

// Parse command-line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'interactive';
const options = {};

// Parse additional options if provided
for (let i = 1; i < args.length; i++) {
  const [key, value] = args[i].split('=');
  if (key && value) {
    options[key] = value;
  }
}

// UCI mode - standard protocol for chess engines
if (mode === 'uci') {
  const uci = new UCIInterface();
  console.log('ChessByte 1.0 by Cline - UCI mode');
  console.log('Engine is ready to receive UCI commands');
} 
// Battle mode - engine vs engine competition
else if (mode === 'battle') {
  const engine1 = new ChessEngine({
    timeLimit: options.timeLimit ? parseInt(options.timeLimit) : 3000,
    maxDepth: options.depth ? parseInt(options.depth) : 40
  });
  
  const engine2 = new (require('./src/engine2'))({
    timeLimit: options.timeLimit ? parseInt(options.timeLimit) : 3000,
    maxDepth: options.depth ? parseInt(options.depth) : 40
  });
  
  // Set up game
  engine1.resetBoard();
  engine2.resetBoard();
  
  // Shared board state for display
  const displayBoard = new Board();
  displayBoard.setupInitialPosition();
  
  // Game parameters
  const maxMoves = options.maxMoves ? parseInt(options.maxMoves) : 100;
  const delay = options.delay ? parseInt(options.delay) : 2000; // Pause between moves
  
  console.log('ChessByte Engine Battle');
  console.log(`Engine 1: ChessByte 1.0 (depth: 100, time: ${engine1.timeLimit}ms)`);
  console.log(`Engine 2: ${options.engine2Name || 'Custom Engine'} (depth: 100, time: ${engine2.timeLimit}ms)`);
  console.log(`Max moves: ${maxMoves}, Delay between moves: ${delay}ms`);
  console.log();
  
  // Print initial board
  printBoard(displayBoard);
  console.log('\nGame starting...\n');
  
  let moveCount = 0;
  let gameActive = true;
  
  // Main game loop, using setTimeout for visualization
  function makeNextMove() {
    if (!gameActive || moveCount >= maxMoves) {
      console.log(`Game ended after ${moveCount} moves (max: ${maxMoves})`);
      console.log('Final position:');
      printBoard(displayBoard);
      
      // Check for game result
      if (displayBoard.isInCheck(displayBoard.turn)) {
        const winner = displayBoard.turn === 0x08 ? 'Engine 2' : 'Engine 1';
        console.log(`Checkmate! ${winner} wins!`);
      } else if (displayBoard.getLegalMoves().length === 0) {
        console.log('Stalemate! Game is a draw.');
      } else {
        console.log('Game terminated due to move limit. Position is ongoing.');
      }
      
      return;
    }
    
    moveCount++;
    const currentEngine = displayBoard.turn === 0x08 ? engine1 : engine2;
    const engineName = displayBoard.turn === 0x08 ? 'Engine 1' : 'Engine 2';
    
    console.log(`Move ${Math.ceil(moveCount/2)}${displayBoard.turn === 0x08 ? ' (White)' : ' (Black)'} - ${engineName} thinking...`);
    
    // Synchronize the current position to the engine
    currentEngine.loadPosition(displayBoard.toFen());
    
    // Get the engine's move
    const startTime = Date.now();
    const bestMove = currentEngine.getBestMove();
    const endTime = Date.now();
    const stats = currentEngine.getStats();
    
    if (!bestMove) {
      console.log(`${engineName} has no legal moves.`);
      gameActive = false;
      makeNextMove(); // Call again to display final result
      return;
    }
    
    // Evaluate the position after the move
    const evaluation = currentEngine.evaluatePosition();
    const evalFormatted = evaluation > 0 ? `+${(evaluation / 100).toFixed(2)}` : 
                          evaluation < 0 ? `${(evaluation / 100).toFixed(2)}` : 
                          '0.00';
    
    console.log(`${engineName} played: ${bestMove}`);
    console.log(`Depth: ${currentEngine.maxDepth}, Time: ${endTime - startTime}ms, Positions evaluated: ${stats.evaluations}`);
    console.log(`Evaluation: ${evalFormatted} (${engineName === 'Engine 1' ? 'White' : 'Black'}'s perspective)`);
    
    // Make the move on the display board
    const success = displayBoard.makeUciMove(bestMove);
    if (!success) {
      console.log(`Error: ${engineName} suggested invalid move: ${bestMove}`);
      gameActive = false;
      return;
    }
    
    printBoard(displayBoard);
    
    // Check for game end conditions
    const legalMoves = displayBoard.getLegalMoves();
    if (legalMoves.length === 0) {
      if (displayBoard.isInCheck(displayBoard.turn)) {
        const winner = displayBoard.turn === 0x08 ? 'Engine 2' : 'Engine 1';
        console.log(`Checkmate! ${winner} wins!`);
      } else {
        console.log('Stalemate! Game is a draw.');
      }
      gameActive = false;
      return;
    }
    
    // Schedule the next move
    setTimeout(makeNextMove, delay);
  }
  
  // Start the game
  setTimeout(makeNextMove, 1000);
}
// Interactive mode - simple command-line interface
else if (mode === 'interactive') {
  console.log('ChessByte 1.0 by Cline - Interactive mode');
  console.log('Commands:');
  console.log('  new - Start a new game');
  console.log('  fen [FEN] - Load position from FEN');
  console.log('  move [uci] - Make a move (e.g., "move e2e4")');
  console.log('  go - Let the engine make a move');
  console.log('  undo - Undo the last move');
  console.log('  board - Display the current board');
  console.log('  eval - Show position evaluation');
  console.log('  depth [n] - Set search depth (default: 40)');
  console.log('  time [ms] - Set time limit in milliseconds (default: 3000)');
  console.log('  help - Show commands');
  console.log('  quit - Exit the program');
  console.log('\nStarting a new game.');
  
  const engine = new ChessEngine();
  engine.resetBoard();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Print the initial board
  printBoard(engine.board);
  
  // Process interactive commands
  rl.setPrompt('chessbyte> ');
  rl.prompt();
  
  rl.on('line', (line) => {
    const parts = line.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    
    try {
      switch (cmd) {
        case 'new':
          engine.reset();
          console.log('Started a new game.');
          printBoard(engine.board);
          break;
          
        case 'fen':
          if (parts.length > 1) {
            const fen = parts.slice(1).join(' ');
            engine.loadPosition(fen);
            console.log(`Loaded position: ${fen}`);
            printBoard(engine.board);
          } else {
            console.log(`Current FEN: ${engine.board.toFen()}`);
          }
          break;
          
        case 'move':
          if (parts.length > 1) {
            const move = parts[1];
            const success = engine.board.makeUciMove(move);
            if (success) {
              console.log(`Move played: ${move}`);
              printBoard(engine.board);
            } else {
              console.log(`Invalid move: ${move}`);
            }
          } else {
            console.log('Please specify a move in UCI format (e.g., "move e2e4").');
          }
          break;
          
        case 'go':
          console.log('Engine is thinking...');
          const startTime = Date.now();
          const bestMove = engine.getBestMove();
          const endTime = Date.now();
          const stats = engine.getStats();
          
          console.log(`Engine played: ${bestMove}`);
          console.log(`Depth: ${engine.maxDepth}, Time: ${endTime - startTime}ms, Positions evaluated: ${stats.evaluations}`);
          
          if (bestMove) {
            engine.board.makeUciMove(bestMove);
            printBoard(engine.board);
          }
          break;
          
        case 'undo':
          const move = engine.board.undoMove();
          if (move) {
            console.log('Undid last move.');
            printBoard(engine.board);
          } else {
            console.log('No move to undo.');
          }
          break;
          
        case 'board':
          printBoard(engine.board);
          break;
          
        case 'eval':
          const eval = engine.evaluatePosition();
          const side = engine.board.turn === 0x08 ? 'White' : 'Black';
          console.log(`Evaluation from ${side}'s perspective: ${eval}`);
          break;
          
        case 'depth':
          if (parts.length > 1) {
            const depth = parseInt(parts[1]);
            if (!isNaN(depth) && depth > 0) {
              engine.maxDepth = depth;
              console.log(`Search depth set to ${depth}.`);
            } else {
              console.log('Please provide a valid depth (positive integer).');
            }
          } else {
            console.log(`Current search depth: ${engine.maxDepth}`);
          }
          break;
          
        case 'time':
          if (parts.length > 1) {
            const time = parseInt(parts[1]);
            if (!isNaN(time) && time > 0) {
              engine.timeLimit = time;
              console.log(`Time limit set to ${time}ms.`);
            } else {
              console.log('Please provide a valid time limit in milliseconds (positive integer).');
            }
          } else {
            console.log(`Current time limit: ${engine.timeLimit}ms`);
          }
          break;
          
        case 'help':
          console.log('Commands:');
          console.log('  new - Start a new game');
          console.log('  fen [FEN] - Load position from FEN');
          console.log('  move [uci] - Make a move (e.g., "move e2e4")');
          console.log('  go - Let the engine make a move');
          console.log('  undo - Undo the last move');
          console.log('  board - Display the current board');
          console.log('  eval - Show position evaluation');
          console.log('  depth [n] - Set search depth (default: 40)');
          console.log('  time [ms] - Set time limit in milliseconds (default: 3000)');
          console.log('  help - Show commands');
          console.log('  quit - Exit the program');
          break;
          
        case 'quit':
        case 'exit':
          console.log('Goodbye!');
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log(`Unknown command: ${cmd}. Type "help" for a list of commands.`);
          break;
      }
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
    
    rl.prompt();
  });
} else {
  console.error('Unknown mode:', mode);
  console.error('Usage: node index.js [mode]');
  console.error('  Modes:');
  console.error('    interactive - Interactive command-line mode (default)');
  console.error('    uci - Universal Chess Interface mode');
  process.exit(1);
}

/**
 * Print the current board state to the console
 * @param {Board} board - The chess board
 */
function printBoard(board) {
  const { EMPTY, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, WHITE, BLACK, PIECE_MASK, COLOR_MASK } = require('./src/board');
  
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
  
  console.log('  +----------------+');
  
  for (let rank = 7; rank >= 0; rank--) {
    process.stdout.write(`${rank + 1} |`);
    
    for (let file = 0; file < 8; file++) {
      const square = rank * 8 + file;
      const piece = board.squares[square];
      process.stdout.write(` ${pieceToChar(piece)}`);
    }
    
    console.log(' |');
  }
  
  console.log('  +----------------+');
  console.log('    a b c d e f g h');
  
  // Show additional information
  const turnStr = board.turn === WHITE ? 'White' : 'Black';
  console.log(`\nTurn: ${turnStr}`);
  
  // Show castling rights
  let castlingStr = '';
  if (board.castlingRights & 1) castlingStr += 'K';
  if (board.castlingRights & 2) castlingStr += 'Q';
  if (board.castlingRights & 4) castlingStr += 'k';
  if (board.castlingRights & 8) castlingStr += 'q';
  if (!castlingStr) castlingStr = '-';
  console.log(`Castling: ${castlingStr}`);
  
  // Show en passant square if any
  const epSquare = board.enPassantSquare;
  if (epSquare !== -1) {
    const file = 'abcdefgh'[epSquare % 8];
    const rank = Math.floor(epSquare / 8) + 1;
    console.log(`En passant: ${file}${rank}`);
  }
}
