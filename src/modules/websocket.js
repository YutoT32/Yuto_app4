const RECEIVE_MESSAGE_KIND = {
    ROOM_STATUS: 1,
    GAME_PLAY_STATUS: 8,
    ERROR: 9,
    NO_SEATS_AVAILABLE_ERROR: 10,
    GAME_ROOM_CLOSE: 12,
    USER_INFO_REQUEST: 14,
    USER_DISCONNECT: 17,
    CONSUMED_ITEMS: 19,
};

const SEND_MESSAGE_KIND = {
    JOIN_GAME: 2,
    LEAVE_GAME: 3,
    GAME_MEDAL_BET: 4,
    PAYOUT: 5,
    GAME_PLAY_STATUS: 7,
    AUTHENTICATE: 11,
    USER_INFO_REQUEST: 13,
    UPDATE_MINIMUM_BET: 15,
    CONSUMED_ITEMS: 18,
}

class WebSocketClient {
    ws = null;
    handlers = {};

    async connect(userID, roomID) {
        return new Promise((resolve, reject) => {
            try {
                const url = `wss://livegame-andagi.mixch.tv/v1/game_room/${roomID}?user_id=${userID}`;
                this.ws = new WebSocket(url);

                this.ws.onopen = () => {
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this._handleMessage(data);
                };
                this.ws.onerror = (error) => {
                    reject(error);
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    // Client => Server
    joinGame(targetUserID, seatNumber) {
        const message = {
            kind : SEND_MESSAGE_KIND.JOIN_GAME,
            target_user_id: targetUserID,
            seat_number: seatNumber
        };
        this._sendMessage(message);
    }

    leaveGame(targetUserID) {
        const message = {
            kind : SEND_MESSAGE_KIND.LEAVE_GAME,
            target_user_id: targetUserID
        };
        this._sendMessage(message);
    }

    betGameMedal(targetUserID, gameMedalAmount) {
        const message = {
            kind : SEND_MESSAGE_KIND.GAME_MEDAL_BET,
            target_user_id: targetUserID,
            game_medal_amount: gameMedalAmount
        };
        this._sendMessage(message);
    }

    payoutMedals(distributions) {
        const message = {
            kind : SEND_MESSAGE_KIND.PAYOUT,
            distributions: distributions
        };
        this._sendMessage(message);
    }

    sendGamePlayStatus(toUserID, gameState) {
        const message = {
            kind : SEND_MESSAGE_KIND.GAME_PLAY_STATUS,
            to_user_id : toUserID,
            game_state : gameState
        };
        this._sendMessage(message);
    }

    sendAuthenticate(token) {
        const message = {
            kind : SEND_MESSAGE_KIND.AUTHENTICATE,
            token: token
        };
        this._sendMessage(message);
    }

    requestUserInfo() {
        const message = {
            kind : SEND_MESSAGE_KIND.USER_INFO_REQUEST
        };
        this._sendMessage(message);
    }

    updateMinimumBet(smallRate) {
        const message = {
            kind : SEND_MESSAGE_KIND.UPDATE_MINIMUM_BET,
            small_rate: smallRate
        };
        this._sendMessage(message);
    }

    fetchConsumedItems(time) {
        const message = {
            kind : SEND_MESSAGE_KIND.CONSUMED_ITEMS,
            consume: time,
        };
        this._sendMessage(message);
    }

    // Server => Client
    onReceiveRoomStatus(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.ROOM_STATUS] = handler;
    }

    onReceiveGamePlayStatus(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.GAME_PLAY_STATUS] = handler;
    }

    onError(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.ERROR] = handler;
    }

    onNoSeatsAvailableError(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.NO_SEATS_AVAILABLE_ERROR] = handler;
    }

    onUserInfoRequest(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.USER_INFO_REQUEST] = handler;
    }

    onUserDisconnect(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.USER_DISCONNECT] = handler;
    }

    onReceiveConsumedItems(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.CONSUMED_ITEMS] = handler;
    }

    onGameRoomClose(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.GAME_ROOM_CLOSE] = handler;
    }

    _sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    _handleMessage(data) {
        const handler = this.handlers[data.kind];
        if (handler) {
            handler(data);
        } else {
            console.warn(`Unknown message kind: ${data.kind}`);
        }
    }
};

export { WebSocketClient };