import path = require('path');
import express = require('express');
import socketIO = require('socket.io');
import http = require('http');

const app = express();
const server = http.createServer(app);
const ioServer = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

class Game {
    private io: SocketIO.Server;

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
            socket.emit('init', 'player');
        } else {
            this.observers.push(socket.id);
            socket.emit('init', 'observer');
        }
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
}

const game = new Game(ioServer);

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
