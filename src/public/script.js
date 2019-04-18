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
var PlayerType;
(function (PlayerType) {
    PlayerType[PlayerType["Red"] = 0] = "Red";
    PlayerType[PlayerType["Blue"] = 1] = "Blue";
})(PlayerType || (PlayerType = {}));
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
class ClickableElement extends MyElement {
    constructor(id, userElement) {
        super(id);
        this.userElement = userElement;
        this.addClickListener();
    }
    addClickListener() {
        this.element.addEventListener('click', () => {
            this.userElement.click();
        });
    }
}
/* An abstract class of elements that users can interact with */
class GameUIElement {
    constructor(id, board) {
        this.element = new ClickableElement(id, this);
        this.board = board;
    }
}
class Piece extends GameUIElement {
    constructor(index, board) {
        const id = Piece.generateId(index);
        super(id, board);
        this.index = index;
        this.state = PieceState.Empty;
    }
    click() {
        if (this.board instanceof PlayerBoard) {
            this.board.place(this.index);
        }
    }
    static generateId(index) {
        return `piece-${index}`;
    }
}
class Board {
    constructor(socket) {
        this.turn = 0;
        this.socket = socket;
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i, this));
        }
    }
    onTurnChange(socket) {
        socket.on('turn', (turnNumber) => {
            this.turn = turnNumber;
        });
    }
}
class PlayerBoard extends Board {
    constructor(socket, playerType) {
        super(socket);
        this.playerType = playerType;
        alert('You are a player!');
    }
    place(pieceIndex) {
        const whoseTurn = this.turn % 2;
        if (whoseTurn === this.playerType) {
            this.socket.emit('place', pieceIndex);
        }
    }
}
class ObserverBoard extends Board {
    constructor(socket) {
        super(socket);
        alert('Sorry, there can only be 2 players in a game, but you can still observe.');
    }
}
function createBoard(socket, initObj) {
    if (initObj.type === 'player') {
        return new PlayerBoard(socket, initObj.index);
    }
    if (initObj.type === 'observer') {
        return new ObserverBoard(socket);
    }
    throw new Error('Invalid board type!');
}
const socket = io();
let board;
socket.on('init', (initObj) => {
    board = createBoard(socket, initObj);
});
