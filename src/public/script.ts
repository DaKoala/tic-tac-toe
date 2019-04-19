enum PieceText {
    Red = '🔴',
    Blue = '🔵',
    Empty = '',
}

enum PieceState {
    Red,
    Blue,
    Empty,
}

enum PlayerType {
    Red,
    Blue,
}

/* A bridge to make DOM manipulation more user-friendly */
abstract class MyElement {
    protected element: HTMLElement;

    protected constructor(id: string) {
        const element = document.getElementById(id);
        if (element === null) {
            throw new Error('Element not found!');
        }
        this.element = element;
    }

    public get text(): string {
        return this.element.textContent as string;
    }

    public set text(content: string) {
        this.element.textContent = content;
    }

    public changeBackground(color: string) {
        this.element.style.backgroundColor = color;
    }
}

class ClickableElement extends MyElement {
    private userElement: GameUIElement;

    public constructor(id: string, userElement: GameUIElement) {
        super(id);
        this.userElement = userElement;
        this.addClickListener();
    }

    private addClickListener() {
        this.element.addEventListener('click', () => {
            this.userElement.click();
        });
    }
}

/* An abstract class of elements that users can interact with */
abstract class GameUIElement {
    protected element: MyElement;

    protected board: Board;

    protected constructor(id: string, board: Board) {
        this.element = new ClickableElement(id, this);
        this.board = board;
    }

    abstract click(): void;
}

class Piece extends GameUIElement {
    public state: PieceState;

    public index: number;

    public constructor(index: number, board: Board, state: PieceState) {
        const id = Piece.generateId(index);
        super(id, board);
        this.index = index;
        this.state = state;
        this.place(state);
    }

    public click(): void {
        if (this.board instanceof PlayerBoard) {
            this.board.place(this.index);
        }
    }

    public place(state: PieceState): void {
        let pieceText;
        if (state === PieceState.Red) {
            pieceText = PieceText.Red;
        } else if (state === PieceState.Blue) {
            pieceText = PieceText.Blue;
        } else {
            pieceText = PieceText.Empty;
        }
        this.element.text = pieceText;
    }

    public highlight() {
        this.element.changeBackground('green');
    }

    private static generateId(index: number): string {
        return `piece-${index}`;
    }
}

interface Socket {
    emit(event: string, data: any): void;
    on(event: string, callback: (payload: any) => void): void;
}

abstract class Board {
    protected pieces: Piece[];

    protected socket: Socket;

    public turn: number;

    protected constructor(socket: Socket, turnNumber: number, pieceStates: PieceState[]) {
        this.socket = socket;
        this.turn = turnNumber;
        this.onPieceChange();
        this.onTurnChange();
        this.onWinnerBroadcast();
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i, this, pieceStates[i]));
        }
    }

    protected onTurnChange() {
        this.socket.on('turn', (turnNumber: number) => {
            this.turn = turnNumber;
        });
    }

    protected onPieceChange() {
        interface PieceInfo {
            pieceIndex: number;
            pieceState: PieceState;
        }
        this.socket.on('piece', (pieceInfo: PieceInfo) => {
            this.pieces[pieceInfo.pieceIndex].place(pieceInfo.pieceState);
        });
    }

    protected onWinnerBroadcast() {
        interface WinnerObj {
            winnerType: PlayerType;
            grids: [number, number, number];
        }
        this.socket.on('winner', (winnerObj: WinnerObj) => {
            const { grids } = winnerObj;
            if (grids[0] !== -1) {
                grids.forEach((pieceIndex) => {
                    this.pieces[pieceIndex].highlight();
                });
            }
        });
    }
}

class PlayerBoard extends Board {
    public playerType: PlayerType;

    public constructor(socket: Socket,
        turnNumber: number,
        playerType: PlayerType,
        pieceStates: PieceState[]) {
        super(socket, turnNumber, pieceStates);
        this.playerType = playerType;
        const color = playerType === PlayerType.Red ? 'red' : 'blue';
        alert(`Your are player ${color}!`);
    }

    public place(pieceIndex: number): void {
        const whoseTurn = this.turn % 2;
        if (whoseTurn === this.playerType) {
            this.socket.emit('place', pieceIndex);
        }
    }
}

class ObserverBoard extends Board {
    public constructor(socket: Socket,
        turnNumber: number,
        pieceStates: PieceState[]) {
        super(socket, turnNumber, pieceStates);
        alert('Sorry, there can only be 2 players in a game, but you can still observe.');
    }
}

interface InitObj {
    turnNumber: number;
    type: 'player' | 'observer';
    index: PlayerType;
    pieceStates: PieceState[];
}

function createBoard(socket: Socket, initObj: InitObj): Board {
    if (initObj.type === 'player') {
        return new PlayerBoard(socket, initObj.turnNumber, initObj.index, initObj.pieceStates);
    }
    if (initObj.type === 'observer') {
        return new ObserverBoard(socket, initObj.turnNumber, initObj.pieceStates);
    }
    throw new Error('Invalid board type!');
}

const socket: Socket = io();
let board: Board;
socket.on('init', (initObj: InitObj) => {
    board = createBoard(socket, initObj);
});
socket.on('close', (msg: string) => {
    alert(msg);
});
