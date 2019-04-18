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

    public constructor(index: number, board: Board) {
        const id = Piece.generateId(index);
        super(id, board);
        this.index = index;
        this.state = PieceState.Empty;
    }

    public click(): void {
        if (this.board instanceof PlayerBoard) {
            this.board.place(this.index);
        }
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

    public turn = 0;

    protected constructor(socket: Socket) {
        this.socket = socket;
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i, this));
        }
    }

    protected onTurnChange(socket: Socket) {
        socket.on('turn', (turnNumber: number) => {
            this.turn = turnNumber;
        });
    }
}

class PlayerBoard extends Board {
    public playerType: PlayerType;

    public constructor(socket: Socket, playerType: PlayerType) {
        super(socket);
        this.playerType = playerType;
        alert('You are a player!');
    }

    public place(pieceIndex: number): void {
        const whoseTurn = this.turn % 2;
        if (whoseTurn === this.playerType) {
            this.socket.emit('place', pieceIndex);
        }
    }
}

class ObserverBoard extends Board {
    public constructor(socket: Socket) {
        super(socket);
        alert('Sorry, there can only be 2 players in a game, but you can still observe.');
    }
}

interface InitObj {
    type: 'player' | 'observer';
    index: PlayerType;
}

function createBoard(socket: Socket, initObj: InitObj): Board {
    if (initObj.type === 'player') {
        return new PlayerBoard(socket, initObj.index);
    }
    if (initObj.type === 'observer') {
        return new ObserverBoard(socket);
    }
    throw new Error('Invalid board type!');
}

const socket: Socket = io();
let board: Board;
socket.on('init', (initObj: InitObj) => {
    board = createBoard(socket, initObj);
});
