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

/* A bridge to make DOM manipulation more user-friendly */
class MyElement {
    private element: HTMLElement;

    public constructor(id: string) {
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

/* An abstract class of elements that users can interact with */
abstract class GameUIElement {
    protected element: MyElement;

    protected board: Board;

    protected constructor(id: string, board: Board) {
        this.element = new MyElement(id);
        this.board = board;
    }
}

class Piece extends GameUIElement {
    public state: PieceState;

    public constructor(index: number, board: Board) {
        const id = Piece.generateId(index);
        super(id, board);
        this.state = PieceState.Empty;
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

    protected constructor(socket: Socket) {
        this.socket = socket;
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i, this));
        }
    }
}

class PlayerBoard extends Board {
    public constructor(socket: Socket) {
        super(socket);
        alert('You are a player!');
    }
}

class ObserverBoard extends Board {
    public constructor(socket: Socket) {
        super(socket);
        alert('Sorry, there can only be 2 players in a game, but you can still observe.');
    }
}

function createBoard(socket: Socket, type: string): Board {
    if (type === 'player') {
        return new PlayerBoard(socket);
    }
    if (type === 'observer') {
        return new ObserverBoard(socket);
    }
    throw new Error('Invalid board type!');
}

const socket: Socket = io();
let board: Board;
socket.on('init', (type: string) => {
    board = createBoard(socket, type);
});
