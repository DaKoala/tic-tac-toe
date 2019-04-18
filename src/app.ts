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

    private players: string[] = [];

    private observers: string[] = [];

    public constructor(io: SocketIO.Server) {
        this.io = io;
        io.on('connection', (socket) => {
            console.log('A user connected');
            this.init(socket);
            this.onQuit(socket);
        });
    }

    private init(socket: SocketIO.Socket): void {
        if (this.players.length <= 1) {
            this.players.push(socket.id);
            socket.emit('init', {
                type: 'player',
                index: this.players.length - 1,
            });
        } else {
            this.observers.push(socket.id);
            socket.emit('init', {
                type: 'observer',
                index: -1,
            });
        }
    }

    private changeTurn(socket: SocketIO.Socket): void {
        socket.emit('turn', this.turn);
    }

    private onQuit(socket: SocketIO.Socket): void {
        socket.on('disconnect', () => {
            const { id } = socket;
            for (let i = 0; i < this.players.length; i += 1) {
                if (this.players[i] === id) {
                    this.players.splice(i, 1);
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
            const playerType = this.players.indexOf(socket.id) as PlayerType;
            if (this.turn % 2 === playerType) {
                const pieceState = playerType === PlayerType.Red ? PieceState.Red : PieceState.Blue;
                this.pieces[pieceIndex].place(pieceState);
                this.turn += 1;
                this.changeTurn(socket);
            }
        });
    }
}

const game = new Game(ioServer);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
