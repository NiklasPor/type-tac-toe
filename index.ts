
// Hover ⬇️ this type to see the result.
type Result = Play<[
    ["O", 1, 1],
    ["X", 2, 2],
    ["O", 3, 3],
    ["X", 1, 3],
    ["O", 2, 3],
    ["X", 3, 1],
]>;


// Implementation 🤫

type StateInput =  "X" | "O";
type StateInitial = " "
type State = StateInitial | StateInput;

// Easy solution to increment numbers IncrementPosition[1] => 2
type IncrementPosition = [1,2,3];
type DecrementPosition = [never, never, 1,2,3];
type Position = IncrementPosition[number];

type BaseRow = { [x in Position]: State }
type BaseGrid = { [y in Position]: BaseRow };

type UpdateRow<Input extends StateInput, X extends Position, Row extends BaseRow> = Omit<Row, X> & { [position in X]: Input}

type SetValue<Input extends StateInput, X extends Position, Y extends Position, Grid extends BaseGrid> = Omit<Grid, Y> & BaseGrid & {
    [position in Y]: UpdateRow<Input, X, Grid[Y]>
} 

type InitialGrid = Record<Position, Record<Position, StateInitial>>

type FormatState<S extends State> = S extends "X" ? "❎" : S extends "O" ? "🅾️" : "🔲";

type FormatRow<Row, P extends Position = 1,  Prefix extends string = ''> = Row extends {[p in P]: infer Current extends State}
    ? (IncrementPosition[P] extends Position
        ? FormatRow<Row, IncrementPosition[P], `${Prefix}${FormatState<Current>}`>
        : `${Prefix}${FormatState<Current>}`)
    : never;

// Workaround for unstable union sorting (https://github.com/microsoft/TypeScript/issues/17944)
type FormatGrid<Grid extends BaseGrid> = {
    1: FormatRow<Grid[1]>
    2: FormatRow<Grid[2]>
    3: FormatRow<Grid[3]>
    winner: FormatState<Winner<Grid>>
}

type RowWinner<Row extends BaseRow, S extends StateInput> = Row extends Record<Position, S> ? S : never;
type ColumnWinner<Grid extends BaseGrid, S extends StateInput, X extends Position, Y = 1> = Y extends Position
    ? Grid[Y][X] extends S
        ? ColumnWinner<Grid, S, X, IncrementPosition[Y]>
        : never
    : S;

// We use ManipulateY here to either increment or decrement it, to catch both diagonal cases ⬇️
type DiagonalWinner<Grid extends BaseGrid, S extends StateInput,ManipulateY extends (IncrementPosition | DecrementPosition), X, Y> = [X,Y] extends [infer x extends Position, infer y extends Position]
    ? Grid[y][x] extends S
        ? DiagonalWinner<Grid, S, ManipulateY, IncrementPosition[x], ManipulateY[y]>
        : never
    : S;

type Winner<Grid extends BaseGrid> = IsWinner<Grid, "X"> | IsWinner<Grid, "O">
type IsWinner<Grid extends BaseGrid, S extends StateInput> =
    | RowWinner<Grid[Position], S>
    // Normally I should make this distributive over Position instead, but I wanna get this done 👀
    | (ColumnWinner<Grid, S, 1> | ColumnWinner<Grid, S, 2> | ColumnWinner<Grid, S, 3>)
    // Left top to bottom right:
    | DiagonalWinner<Grid, S, IncrementPosition, 1, 1>
    // Left bottom to top right:
    | DiagonalWinner<Grid, S, DecrementPosition, 1, 3>;

type Turn = [StateInput, Position, Position];

type Play<Turns extends [...Turn[]], Grid extends BaseGrid = InitialGrid> = Turns extends [infer CurrentTurn extends Turn, ...infer OtherTurns extends [...Turn[]]]
    ?  Play<OtherTurns, SetValue<CurrentTurn[0], CurrentTurn[1], CurrentTurn[2], Grid>>
    : FormatGrid<Grid>

