const generateMaze = require('generate-maze-by-clustering');
const icepick = require('icepick');
const {Component, Text, h, render} = require('ink');
// TODO: br, div


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


class App extends Component {
  constructor() {
    super();

    const squareMatrix = createSquareMatrixState();

    this.state = {
      squareMatrix,
      mainLoopId: 0,

      rowLength: squareMatrix.length,
      columnLength: squareMatrix[0].length,
    };
  }

  componentDidMount() {
    const mainLoopInterval = 500;

    const mainLoopTask = () => {
      let squareMatrix = this.state.squareMatrix;

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
      }, () => {
        setTimeout(mainLoopTask, mainLoopInterval);
      });
    };

    setTimeout(mainLoopTask, mainLoopInterval);
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
