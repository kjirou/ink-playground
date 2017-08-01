const generateMaze = require('generate-maze-by-clustering');
const icepick = require('icepick');
const {Component, Text, h, render} = require('ink');
// TODO: br, div
const keypress = require('keypress');


const THING_TYPES = {
  'GREEN_BATTLER': 'GREEN_BATTLER',
  'NONE': 'NONE',
  'YELLOW_BATTLER': 'YELLOW_BATTLER',
};
const FLOOR_COLOR_TYPES = {
  'GREEN': 'GREEN',
  'NONE': 'NONE',
  'YELLOW': 'YELLOW',
};
const POSES = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];
const STEP_RESULT_TYPES = {
  BACKWARD: 'BACKWARD',
  CAN_NOT_MOVE: 'CAN_NOT_MOVE',
  FORWARD: 'FORWARD',
};

const MAIN_LOOP_INTERVAL = 200;


const createSquareMatrixState = () => {
  const mazeText = generateMaze([20, 10]).toText();

  return mazeText
    .replace(/\n$/, '')
    .split('\n')
    .map((line, rowIndex) => {
      return line
        .split('')
        .map((symbol, columnIndex) => {
          return {
            rowIndex,
            columnIndex,
            isWall: symbol === '#',
            thingType: THING_TYPES.NONE,
            floorColorType: FLOOR_COLOR_TYPES.NONE,
          };
        })
      ;
    })
  ;
};

const findSquareByCoordinate = (squareMatrix, {rowIndex, columnIndex}) => {
  for (let ri = 0; ri < squareMatrix.length; ri += 1) {
    const lineSquares = squareMatrix[ri];
    for(let ci = 0; ci < lineSquares.length; ci += 1) {
      const square = lineSquares[ci];
      if (square.rowIndex === rowIndex && square.columnIndex === columnIndex) {
        return square;
      }
    }
  }
  return null;
};

const findSquareByThingType = (squareMatrix, thingType) => {
  for (let ri = 0; ri < squareMatrix.length; ri += 1) {
    const lineSquares = squareMatrix[ri];
    for(let ci = 0; ci < lineSquares.length; ci += 1) {
      const square = lineSquares[ci];
      if (square.thingType === thingType) {
        return square;
      }
    }
  }
  return null;
};

const getRandomInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const decideNextStep = (thingType, squareMatrix, movementHistory) => {
  const battlerSquare = findSquareByThingType(squareMatrix, thingType);
  if (!battlerSquare) {
    throw new Error('Where is the battler?');
  }

  const aroundOccupyableSquares = POSES
    .map(pose => {
      return findSquareByCoordinate(squareMatrix, {
        rowIndex: battlerSquare.rowIndex + pose[0],
        columnIndex: battlerSquare.columnIndex + pose[1],
      });
    })
    .filter(square => square !== null)
    .filter(square => {
      return !square.isWall &&
        square.thingType === THING_TYPES.NONE &&
        square.floorColorType === FLOOR_COLOR_TYPES.NONE;
    })
  ;

  if (aroundOccupyableSquares.length > 0) {
    return {
      nextSquare: aroundOccupyableSquares[getRandomInteger(0, aroundOccupyableSquares.length - 1)],
      stepResultType: STEP_RESULT_TYPES.FORWARD,
    };
  } else if (movementHistory.length > 0) {
    return {
      nextSquare: findSquareByCoordinate(squareMatrix, movementHistory[movementHistory.length - 1]),
      stepResultType: STEP_RESULT_TYPES.BACKWARD,
    };
  }

  return {
    nextSquare: null,
    stepResultType: STEP_RESULT_TYPES.CAN_NOT_MOVE,
  };
};


keypress(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (ch, key) => {
  if (key && key.ctrl && (key.name === 'c' || key.name === 'd')) {
    process.stdin.pause();
    process.exit();
  }
});


class App extends Component {
  constructor() {
    super();

    const squareMatrix = createSquareMatrixState();

    this.state = {
      squareMatrix,
      mainLoopId: 0,
      greenMovementHistory: [],
      yellowMovementHistory: [],

      rowLength: squareMatrix.length,
      columnLength: squareMatrix[0].length,
    };
  }

  componentDidMount() {
    const mainLoopTask = () => {
      let squareMatrix = this.state.squareMatrix;
      let greenMovementHistory = this.state.greenMovementHistory;
      let yellowMovementHistory = this.state.yellowMovementHistory;

      const greenBattlerSquare = findSquareByThingType(this.state.squareMatrix, THING_TYPES.GREEN_BATTLER);
      const yellowBattlerSquare = findSquareByThingType(this.state.squareMatrix, THING_TYPES.YELLOW_BATTLER);

      if (!greenBattlerSquare) {
        const destination = findSquareByCoordinate(squareMatrix, {rowIndex: 1, columnIndex: 1});
        squareMatrix = icepick.assocIn(
          squareMatrix,
          [destination.rowIndex, destination.columnIndex, 'thingType'],
          THING_TYPES.GREEN_BATTLER
        );
      } else {
        squareMatrix = icepick.assocIn(
          squareMatrix,
          [greenBattlerSquare.rowIndex, greenBattlerSquare.columnIndex, 'floorColorType'],
          FLOOR_COLOR_TYPES.GREEN
        );

        const stepResult = decideNextStep(THING_TYPES.GREEN_BATTLER, squareMatrix, greenMovementHistory);

        if (
          stepResult.stepResultType === STEP_RESULT_TYPES.FORWARD ||
          stepResult.stepResultType === STEP_RESULT_TYPES.BACKWARD
        ) {
          squareMatrix = icepick.assocIn(
            squareMatrix,
            [greenBattlerSquare.rowIndex, greenBattlerSquare.columnIndex, 'thingType'],
            THING_TYPES.NONE
          );
          squareMatrix = icepick.assocIn(
            squareMatrix,
            [stepResult.nextSquare.rowIndex, stepResult.nextSquare.columnIndex, 'thingType'],
            THING_TYPES.GREEN_BATTLER
          );
          if (stepResult.stepResultType === STEP_RESULT_TYPES.FORWARD) {
            greenMovementHistory = greenMovementHistory.concat({
              rowIndex: greenBattlerSquare.rowIndex,
              columnIndex: greenBattlerSquare.columnIndex,
            });
          } else if (stepResult.stepResultType === STEP_RESULT_TYPES.BACKWARD) {
            greenMovementHistory = greenMovementHistory.slice(0, greenMovementHistory.length - 1);
          }
        } else {
          // TODO: Finish game
        }
      }

      if (!yellowBattlerSquare) {
        const destination = findSquareByCoordinate(
          squareMatrix, {rowIndex: this.state.rowLength - 2, columnIndex: this.state.columnLength - 2});
        squareMatrix = icepick.assocIn(
          squareMatrix,
          [destination.rowIndex, destination.columnIndex, 'thingType'],
          THING_TYPES.YELLOW_BATTLER
        );
      } else {
      }

      this.setState({
        mainLoopId: this.state.mainLoopId + 1,
        squareMatrix,
        greenMovementHistory,
        yellowMovementHistory,
      }, () => {
        setTimeout(mainLoopTask, MAIN_LOOP_INTERVAL);
      });
    };

    setTimeout(mainLoopTask, MAIN_LOOP_INTERVAL);
  }

  render(props, state) {
    const lineComponents = state.squareMatrix.map(lineSquares => {
      const lineSquareComponents = lineSquares.map(square => {
        let label = ' ';
        const props = {};

        if (square.isWall) {
          label = '#';
        } else if (square.thingType === THING_TYPES.GREEN_BATTLER) {
          label = '@';
          props.green = true;
        } else if (square.thingType === THING_TYPES.YELLOW_BATTLER) {
          label = '@';
          props.yellow = true;
        } else if (square.floorColorType === FLOOR_COLOR_TYPES.GREEN) {
          label = '*';
          props.green = true;
        } else if (square.floorColorType === FLOOR_COLOR_TYPES.YELLOW) {
          label = '*';
          props.yellow = true;
        }

        return h(Text, props, label);
      });

      return h(Text, {}, ...lineSquareComponents, '\n');
    });

    const statusBar = h(Text, {}, `[mainLoopId: ${this.state.mainLoopId}]`);
    const help = h(Text, {gray: true}, `[Ctrl+C: Quit]`);

    return h(Text, {}, ...lineComponents, statusBar, '\n', help);
  }
}

render(h(App));
