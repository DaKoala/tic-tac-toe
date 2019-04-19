import path = require('path');
import express = require('express');
import socketIO = require('socket.io');
import http = require('http');

const app = express();
const server = http.createServer(app);
const ioServer = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

enum PieceState {
    Red,
    Blue,
    Empty,
}

enum PlayerType {
    Red,
    Blue,
}

class Piece {
    public state = PieceState.Empty;

    private setState(state: PieceState) {
        this.state = state;
    }

    public place(state: PieceState) {
        if (this.state !== PieceState.Empty) {
            throw new Error('Grid is not empty!');
        }
        this.state = state;
    }
}

type GamePieces = [Piece, Piece, Piece, Piece, Piece, Piece, Piece, Piece, Piece];

class Game {
    private io: SocketIO.Server;

    private connectedSockets: SocketIO.Socket[] = [];

    private pieces: GamePieces = [
        new Piece(),
        new Piece(),
        new Piece(),
        new Piece(),
        new Piece(),
        new Piece(),
        new Piece(),
        new Piece(),
        new Piece(),
    ];

    private turn = 0;

    private players: string[] = ['', ''];

    private observers: string[] = [];

    public constructor(io: SocketIO.Server) {
        this.io = io;
        io.on('connection', (socket) => {
            this.connectedSockets.push(socket);
            this.init(socket);
            this.onQuit(socket);
            this.onPlace(socket);
        });
    }

    private init(socket: SocketIO.Socket): void {
        const pieceStates = this.pieces.map(piece => piece.state);
        if (this.hasPlayerSeat()) {
            this.addPlayer(socket);
            socket.emit('init', {
                type: 'player',
                turnNumber: this.turn,
                index: this.players.indexOf(socket.id),
                pieceStates,
            });
        } else {
            this.addObserver(socket);
            socket.emit('init', {
                type: 'observer',
                turnNumber: this.turn,
                index: -1,
                pieceStates,
            });
        }
    }

    private broadCastWinner(grids: [number, number, number]): void {
        const winnerType = this.turn % 2;
        this.io.emit('winner', {
            winnerType,
            grids,
        });
    }

    private nextTurn(): void {
        this.turn += 1;
        this.io.emit('turn', this.turn);
    }

    private placePiece(pieceIndex: number, type: PieceState) {
        this.pieces[pieceIndex].place(type);
        this.io.emit('piece', {
            pieceIndex,
            pieceState: type,
        });
    }

    private checkPlayerType(id: string): PlayerType | void {
        const playerIndex = this.players.indexOf(id);
        if (playerIndex === -1) {
            return undefined;
        }
        return playerIndex;
    }

    private hasPlayerSeat(): boolean {
        return this.players.includes('');
    }

    private checkWinner(): [number, number, number] | void {
        const COMBINATIONS: [number, number, number][] = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for (let i = 0; i < COMBINATIONS.length; i += 1) {
            const curr = COMBINATIONS[i];
            if (this.checkThreePieces(...curr) !== undefined) {
                return curr;
            }
        }
        return undefined;
    }

    private checkThreePieces(i1: number, i2: number, i3: number): PlayerType | void {
        if (this.pieces[i1].state === this.pieces[i2].state
        && this.pieces[i1].state === this.pieces[i3].state
        && this.pieces[i1].state !== PieceState.Empty) {
            return this.pieces[i1].state === PieceState.Red ? PlayerType.Red : PlayerType.Blue;
        }
        return undefined;
    }

    private addPlayer(socket: SocketIO.Socket): void {
        if (!this.hasPlayerSeat()) {
            throw new Error('No seat for player!');
        }
        const seatIndex = this.players.indexOf('');
        this.players.splice(seatIndex, 1, socket.id);
    }

    private addObserver(socket: SocketIO.Socket): void {
        this.observers.push(socket.id);
    }

    private onQuit(socket: SocketIO.Socket): void {
        socket.on('disconnect', () => {
            const { id } = socket;
            for (let i = 0; i < this.players.length; i += 1) {
                if (this.players[i] === id) {
                    this.players.splice(i, 1, '');
                    this.restart('A player has quited the game, so the game is over. Please refresh the page for the next round.')
                    return;
                }
            }
            for (let i = 0; i < this.observers.length; i += 1) {
                if (this.observers[i] === id) {
                    this.observers.splice(i, 1);
                    return;
                }
            }
        });
    }

    private onPlace(socket: SocketIO.Socket) {
        socket.on('place', (pieceIndex: number) => {
            if (this.hasPlayerSeat()) { return; }
            const playerType: PlayerType | void = this.checkPlayerType(socket.id);
            if (playerType !== undefined && playerType === this.turn % 2) {
                this.placePiece(pieceIndex, Game.playerToPiece(playerType));
                const winnerGrids = this.checkWinner();
                if (winnerGrids) {
                    this.broadCastWinner(winnerGrids);
                    this.restart();
                } else {
                    this.nextTurn();
                }
            }
        });
    }

    private restart(msg = 'Game is over. Please refresh the page for the next round.') {
        while (this.connectedSockets.length > 0) {
            const socket = this.connectedSockets.pop() as SocketIO.Socket;
            socket.emit('close', msg);
            socket.disconnect(true);
        }
        this.pieces = [
            new Piece(),
            new Piece(),
            new Piece(),
            new Piece(),
            new Piece(),
            new Piece(),
            new Piece(),
            new Piece(),
            new Piece(),
        ];
        this.players = ['', ''];
        this.observers = [];
        this.turn = 0;
    }

    private static playerToPiece(player: PlayerType): PieceState {
        return player === PlayerType.Red ? PieceState.Red : PieceState.Blue;
    }
}

let game = new Game(ioServer);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
