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

class Piece {
    private element: MyElement;

    public state: PieceState;

    public constructor(index: number) {
        const id = Piece.generateId(index);
        this.element = new MyElement(id);
        this.state = PieceState.Empty;
    }

    private static generateId(index: number): string {
        return `piece-${index}`;
    }
}

interface Socket {
    emit(event: string, data: any): void;
}

class Board {
    private pieces: Piece[];

    private socket: Socket;

    public constructor(socket: Socket) {
        this.socket = socket;
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i));
        }
    }
}
