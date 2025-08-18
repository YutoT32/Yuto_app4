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

    /**
     * @param {number} targetUserID
     * @param {number} seatNumber
     */
    joinGame(targetUserID, seatNumber) {
        const message = {
            kind : SEND_MESSAGE_KIND.JOIN_GAME,
            target_user_id: targetUserID,
            seat_number: seatNumber
        };
        this._sendMessage(message);
    }

    /**
     * @param {number} targetUserID
     */
    leaveGame(targetUserID) {
        const message = {
            kind : SEND_MESSAGE_KIND.LEAVE_GAME,
            target_user_id: targetUserID
        };
        this._sendMessage(message);
    }

    /**
     * @param {number} targetUserID
     * @param {number} gameMedalAmount
     */
    betGameMedal(targetUserID, gameMedalAmount) {
        const message = {
            kind : SEND_MESSAGE_KIND.GAME_MEDAL_BET,
            target_user_id: targetUserID,
            game_medal_amount: gameMedalAmount
        };
        this._sendMessage(message);
    }

    /**
     * @param {Array<{user_id: number, game_medal_amount: number, host_point: number, delete_point: number}>} distributions
     */
    payoutMedals(distributions) {
        const message = {
            kind : SEND_MESSAGE_KIND.PAYOUT,
            distributions: distributions
        };
        this._sendMessage(message);
    }

    /**
     * @param {number} toUserID
     * @param {object} gameState
     */
    sendGamePlayStatus(toUserID, gameState) {
        const message = {
            kind : SEND_MESSAGE_KIND.GAME_PLAY_STATUS,
            to_user_id : toUserID,
            game_state : gameState
        };
        this._sendMessage(message);
    }

    /**
     * @param {string} token
     */
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

    /**
     * @param {number} smallRate
     */
    updateMinimumBet(smallRate) {
        const message = {
            kind : SEND_MESSAGE_KIND.UPDATE_MINIMUM_BET,
            small_rate: smallRate
        };
        this._sendMessage(message);
    }

    /**
     * @param {number} time
     */
    fetchConsumedItems(time) {
        const message = {
            kind : SEND_MESSAGE_KIND.CONSUMED_ITEMS,
            consume: time,
        };
        this._sendMessage(message);
    }

    /**
     * @param {(data: {
     * users: Array<{
     * seat_number: number,
     * user_id: number,
     * name: string,
     * profile_image_url: string,
     * have_game_medal_amount: number,
     * bet_game_medal_amount: number
     * }>,
     * limit: number,
     * host_user_id: number,
     * game_point: number
     * }) => void} handler
     */
    onReceiveRoomStatus(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.ROOM_STATUS] = handler;
    }

    /**
     * @param {(data: {
     * from_user_id: number,
     * to_user_id: number,
     * game_state: object
     * }) => void} handler
     */
    onReceiveGamePlayStatus(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.GAME_PLAY_STATUS] = handler;
    }

    /**
     * @param {(data: {
     * message: string
     * }) => void} handler
     */
    onError(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.ERROR] = handler;
    }

    /**
     * @param {(data: {
     * message: string,
     * user_id: number,
     * seat_number: number
     * }) => void} handler
     */
    onNoSeatsAvailableError(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.NO_SEATS_AVAILABLE_ERROR] = handler;
    }

    /**
     * @param {(data: {
     * have_game_medal_amount: number,
     * user_name: string,
     * profile_image_url: string
     * }) => void} handler
     */
    onUserInfoRequest(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.USER_INFO_REQUEST] = handler;
    }

    /**
     * @param {(data: {
     * seat_number: number,
     * user_id: number
     * }) => void} handler
     */
    onUserDisconnect(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.USER_DISCONNECT] = handler;
    }

    /**
     * @param {(data: {
     * items: Array<{
     * item_id: number,
     * item_name: string,
     * count: number,
     * score: number,
     * bonus_score: number,
     * consumed: number,
     * user: {
     * id: number,
     * name: string,
     * profile_image_url: string
     * }
     * }>,
     * consumed: number
     * }) => void} handler
     */
    onReceiveConsumedItems(handler) {
        this.handlers[RECEIVE_MESSAGE_KIND.CONSUMED_ITEMS] = handler;
    }

    /**
     * @param {(data: {}) => void} handler
     */
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