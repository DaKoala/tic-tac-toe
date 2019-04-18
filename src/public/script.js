"use strict";
var PieceText;
(function (PieceText) {
    PieceText["Red"] = "\uD83D\uDD34";
    PieceText["Blue"] = "\uD83D\uDD35";
    PieceText["Empty"] = "";
})(PieceText || (PieceText = {}));
var PieceState;
(function (PieceState) {
    PieceState[PieceState["Red"] = 0] = "Red";
    PieceState[PieceState["Blue"] = 1] = "Blue";
    PieceState[PieceState["Empty"] = 2] = "Empty";
})(PieceState || (PieceState = {}));
/* A bridge to make DOM manipulation more user-friendly */
class MyElement {
    constructor(id) {
        const element = document.getElementById(id);
        if (element === null) {
            throw new Error('Element not found!');
        }
        this.element = element;
    }
    get text() {
        return this.element.textContent;
    }
    set text(content) {
        this.element.textContent = content;
    }
}
/* An abstract class of elements that users can interact with */
class GameUIElement {
    constructor(id, board) {
        this.element = new MyElement(id);
        this.board = board;
    }
}
class Piece extends GameUIElement {
    constructor(index, board) {
        const id = Piece.generateId(index);
        super(id, board);
        this.state = PieceState.Empty;
    }
    static generateId(index) {
        return `piece-${index}`;
    }
}
class Board {
    constructor(socket) {
        this.socket = socket;
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i, this));
        }
    }
}
class PlayerBoard extends Board {
    constructor(socket) {
        super(socket);
        alert('You are a player!');
    }
}
class ObserverBoard extends Board {
    constructor(socket) {
        super(socket);
        alert('Sorry, there can only be 2 players in a game, but you can still observe.');
    }
}
function createBoard(socket, type) {
    if (type === 'player') {
        return new PlayerBoard(socket);
    }
    if (type === 'observer') {
        return new ObserverBoard(socket);
    }
    throw new Error('Invalid board type!');
}
const socket = io();
let board;
socket.on('init', (type) => {
    board = createBoard(socket, type);
});
