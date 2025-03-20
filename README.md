# ChessByte Chess Engine

ChessByte is a pure JavaScript chess engine with approximately 1500 ELO strength. The engine implements standard chess algorithms including alpha-beta pruning with quiescence search, a transposition table, and various evaluation heuristics.

## Features

- Complete chess logic implementation with all rules (castling, en passant, etc.)
- UCI (Universal Chess Interface) protocol support for use with chess GUIs
- Interactive command-line mode for casual play
- Configurable search depth and time limits
- Opening book for common positions
- Bitboard-free design for ease of understanding

## Requirements

- Node.js 12.0 or higher

## Installation

Clone this repository:

```bash
git clone https://github.com/yourusername/chessbyte.git
cd chessbyte
```

Make the program executable:

```bash
chmod +x index.js
```

## Usage

### Interactive Mode

Run the engine in interactive mode (default):

```bash
npm start
# OR
node index.js
# OR
./index.js
```

This will start an interactive CLI where you can:
- Make moves in UCI format (e.g., "e2e4")
- Let the engine calculate the best move
- Set search parameters
- View the board

### UCI Mode

Run the engine in UCI mode to use with chess GUIs like Arena, Cutechess, etc:

```bash
npm run uci
# OR
node index.js uci
```

In UCI mode, the engine follows the Universal Chess Interface protocol, allowing it to communicate with chess GUIs.

### Engine Battle Mode

Run the engine against another chess engine implementation:

```bash
npm run battle
# OR
node index.js battle
```

You can specify additional options:
```bash
node index.js battle timeLimit=1000 depth=4 maxMoves=50 delay=1000 engine2Name="My Custom Engine"
```

Parameters:
- `timeLimit`: Time limit per move in milliseconds (default: 3000)
- `depth`: Search depth for both engines (default: 5)
- `maxMoves`: Maximum number of moves before terminating (default: 100)
- `delay`: Delay between moves in milliseconds (default: 2000)
- `engine2Name`: Name of the second engine (default: "Custom Engine")

#### Creating Your Own Engine

The file `src/engine2.js` contains a placeholder implementation that makes random moves. You can modify this file to implement your own chess engine and have it battle against the main ChessByte engine.

The minimum requirements for a compatible engine:
1. A constructor that accepts an options object with `timeLimit` and `maxDepth`
2. A `resetBoard()` method to initialize the board
3. A `loadPosition(fen)` method to load a position from FEN
4. A `getBestMove()` method that returns a move in UCI format
5. A `getStats()` method that returns an object with at least `evaluations` and `timeElapsed` properties

## Interactive Mode Commands

| Command | Description |
|---------|-------------|
| `new` | Start a new game |
| `fen [FEN]` | Load position from FEN string or display current FEN |
| `move [uci]` | Make a move (e.g., "move e2e4") |
| `go` | Let the engine make a move |
| `undo` | Undo the last move |
| `board` | Display the current board |
| `eval` | Show position evaluation |
| `depth [n]` | Set search depth (default: 5) |
| `time [ms]` | Set time limit in milliseconds (default: 3000) |
| `help` | Show commands |
| `quit` | Exit the program |

## Engine Design

ChessByte uses several techniques common in chess engines:

1. **Board Representation**: Simple array-based representation with piece-centric logic
2. **Search Algorithm**: Negamax with alpha-beta pruning
3. **Quiescence Search**: To handle tactical sequences and avoid horizon effect
4. **Evaluation Function**: Material counting, piece-square tables, and simple positional features
5. **Transposition Table**: Cache previously evaluated positions
6. **Move Ordering**: MVV-LVA (Most Valuable Victim - Least Valuable Attacker) for captures

## Engine Strength

The engine has an estimated strength of around 1500 ELO. This makes it strong enough to:
- Defeat casual players
- Understand basic tactics
- Avoid simple blunders
- Play a reasonable chess game

However, it won't stand up against more advanced engines or strong human players.

## License

MIT

## Acknowledgments

- This engine was created as a learning project and draws inspiration from several open-source chess engines.
- The piece-square tables and evaluation concepts are adapted from common chess programming literature.
