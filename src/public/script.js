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
    changeBackground(color) {
        this.element.style.backgroundColor = color;
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
    constructor(index, board, state) {
        const id = Piece.generateId(index);
        super(id, board);
        this.index = index;
        this.state = state;
        this.place(state);
    }
    click() {
        if (this.board instanceof PlayerBoard) {
            this.board.place(this.index);
        }
    }
    place(state) {
        let pieceText;
        if (state === PieceState.Red) {
            pieceText = PieceText.Red;
        }
        else if (state === PieceState.Blue) {
            pieceText = PieceText.Blue;
        }
        else {
            pieceText = PieceText.Empty;
        }
        this.element.text = pieceText;
    }
    highlight() {
        this.element.changeBackground('green');
    }
    static generateId(index) {
        return `piece-${index}`;
    }
}
class Board {
    constructor(socket, turnNumber, pieceStates) {
        this.message = new MyElement('message');
        this.socket = socket;
        this.turn = turnNumber;
        this.updateTurn();
        this.onPieceChange();
        this.onTurnChange();
        this.onWinnerBroadcast();
        this.pieces = [];
        for (let i = 0; i < 9; i += 1) {
            this.pieces.push(new Piece(i, this, pieceStates[i]));
        }
        const identity = document.getElementById('identity');
        identity.style.display = 'block';
    }
    onTurnChange() {
        this.socket.on('turn', (turnNumber) => {
            this.turn = turnNumber;
            this.updateTurn();
        });
    }
    updateTurn() {
        const color = this.turn % 2 === 0 ? 'red' : 'blue';
        this.message.text = `It's ${color}'s turn`;
    }
    onPieceChange() {
        this.socket.on('piece', (pieceInfo) => {
            this.pieces[pieceInfo.pieceIndex].place(pieceInfo.pieceState);
        });
    }
    onWinnerBroadcast() {
        this.socket.on('winner', (winnerObj) => {
            const { grids } = winnerObj;
            if (grids[0] !== -1) {
                grids.forEach((pieceIndex) => {
                    this.pieces[pieceIndex].highlight();
                });
                const winner = winnerObj.winnerType === PlayerType.Red ? 'Red' : 'Blue';
                this.message.text = `${winner} wins!`;
            }
            else {
                this.message.text = 'It\' a tie!';
            }
        });
    }
}
class PlayerBoard extends Board {
    constructor(socket, turnNumber, playerType, pieceStates) {
        super(socket, turnNumber, pieceStates);
        this.playerType = playerType;
        const color = playerType === PlayerType.Red ? 'red' : 'blue';
        alert(`You are player ${color}!`);
        const identity = document.getElementById('identity');
        identity.textContent = `You are player ${color}`;
    }
    place(pieceIndex) {
        const whoseTurn = this.turn % 2;
        if (whoseTurn === this.playerType) {
            this.socket.emit('place', pieceIndex);
        }
    }
}
class ObserverBoard extends Board {
    constructor(socket, turnNumber, pieceStates) {
        super(socket, turnNumber, pieceStates);
        alert('Sorry, there can only be 2 players in a game, but you can still observe.');
    }
}
function createBoard(socket, initObj) {
    if (initObj.type === 'player') {
        return new PlayerBoard(socket, initObj.turnNumber, initObj.index, initObj.pieceStates);
    }
    if (initObj.type === 'observer') {
        return new ObserverBoard(socket, initObj.turnNumber, initObj.pieceStates);
    }
    throw new Error('Invalid board type!');
}
const socket = io();
let board;
socket.on('init', (initObj) => {
    board = createBoard(socket, initObj);
});
socket.on('close', (msg) => {
    alert(msg);
});
