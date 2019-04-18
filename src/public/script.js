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
class Piece {
    constructor(index) {
        const id = Piece.generateId(index);
        this.element = new MyElement(id);
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
            this.pieces.push(new Piece(i));
        }
    }
}
