import { WebSocketClient } from './modules/websocket.js';
import { NativeBridgeClient } from './modules/nativebridge.js';

const webSocket = new WebSocketClient();
const nativeBridge = new NativeBridgeClient(navigator.userAgent);

// UI要素への参照をまとめたオブジェクト
const UIElements = {
    console: document.getElementById('console'),
    notConnect: document.getElementById('not_connect'),
    connected: document.getElementById('connected'),
    userStatus: document.getElementById('user_status'),
    getValue: (id) => document.getElementById(id).value,
};

/**
 * ログエリアにメッセージを追記する
 * @param {string} message - ログに出力するメッセージ
 */
const log = (message) => {
    const consoleEl = UIElements.console;
    consoleEl.value += `[${new Date().toLocaleTimeString()}] ${message}\n`;
    consoleEl.scrollTop = consoleEl.scrollHeight; // 自動で一番下までスクロール
};

/**
 * 接続状態に応じてUIの表示を更新する
 * @param {boolean} isConnected - 接続しているかどうか
 */
const updateConnectionStatus = (isConnected) => {
    UIElements.notConnect.style.display = isConnected ? 'none' : 'block';
    UIElements.connected.style.display = isConnected ? 'block' : 'none';
    if (!isConnected) {
        UIElements.userStatus.innerHTML = '';
    }
};

/**
 * 初期化処理：NativeBridgeから情報を取得し、WebSocketに接続・認証する
 */
const initialize = async () => {
    if (webSocket.isConnected()) {
        log('[警告] すでに接続されています。');
        return;
    }

    log('NativeBridgeから情報を取得しています...');
    try {
        const userInfo = await nativeBridge.fetchUserInfo();
        log(`ユーザー情報: ${JSON.stringify(userInfo)}`);

        const roomInfo = await nativeBridge.fetchGameRoomInfo();
        log(`ルーム情報: ${JSON.stringify(roomInfo)}`);

        log(`WebSocketに接続します... ${roomInfo.game_room_id}, ${userInfo.user_id}`);
        setupWebSocketHandlers();

        await webSocket.connect(userInfo.user_id, roomInfo.game_room_id);
        log('✅ WebSocketの接続に成功しました！');
        updateConnectionStatus(true);

        if (userInfo.secret) {
            log('認証トークンを送信します...');
            webSocket.sendAuthenticate(userInfo.secret);
        }

    } catch (error) {
        log(`❌ [エラー] 初期化処理に失敗しました: ${error.message}`);
        updateConnectionStatus(false);
    }
};

/**
 * WebSocketの各種イベントハンドラを設定する
 */
const setupWebSocketHandlers = () => {
    webSocket.onReceiveRoomStatus((data) => {
        log(`[受信] Room Status: ${JSON.stringify(data)}`);
        UIElements.userStatus.innerHTML = `<pre>${JSON.stringify(data.seats, null, 2)}</pre>`;
    });
    webSocket.onReceiveGamePlayStatus((data) => log(`[受信] Game Play: ${JSON.stringify(data)}`));
    webSocket.onError((error) => log(`❌ [エラー] WebSocketエラー: ${JSON.stringify(error)}`));
    webSocket.onNoSeatsAvailableError((data) => log(`[警告] 着席できませんでした: ${JSON.stringify(data)}`));
    webSocket.onUserInfoRequest((data) => log(`[受信] User Info: ${JSON.stringify(data)}`));
    webSocket.onUserDisconnect((data) => log(`[情報] ユーザーが切断しました: ${JSON.stringify(data)}`));
    webSocket.onReceiveConsumedItems((data) => log(`[受信] Consumed Items: ${JSON.stringify(data)}`));
    webSocket.onGameRoomClose(() => {
        log('🔌 接続が切れました。');
        updateConnectionStatus(false);
        nativeBridge.closeGameRoomNotification();
        webSocket.disconnect();
    });
};

/**
 * HTMLのdata-action属性に応じてWebSocketのメソッドを実行する
 * @param {string} action - 実行するアクション名
 */
const handleWebSocketAction = (action) => {
    try {
        const args = {
            'sendGamePlayStatus': [parseInt(UIElements.getValue('to_user_id')), JSON.parse(UIElements.getValue('game_state'))],
            'joinGame': [parseInt(UIElements.getValue('join_user_id')), UIElements.getValue('seat_number') ? parseInt(UIElements.getValue('seat_number')) : null],
            'leaveGame': [parseInt(UIElements.getValue('leave_user_id'))],
            'betGameMedal': [parseInt(UIElements.getValue('bet_user_id')), parseInt(UIElements.getValue('bet_amount'))],
            'updateRate': [parseInt(UIElements.getValue('min_bet_amount'))],
            'fetchConsumedItems': [parseInt(UIElements.getValue('consume'))],
            'requestUserInfo': [],
            'payoutMedals': [],
        };

        if (args.hasOwnProperty(action)) {
            webSocket[action](...args[action]);
        }
    } catch (e) {
        log(`❌ [エラー] パラメータの処理中にエラーが発生しました: ${e.message}`);
    }
};

// 全てのクリックイベントを監視し、data-action属性によって処理を振り分ける
document.addEventListener('click', (event) => {
    const action = event.target.dataset.action;
    if (!action) return;

    switch (action) {
        case 'initialize':
            initialize();
            break;
        case 'disconnect':
            webSocket.disconnect();
            updateConnectionStatus(false);
            break;
        case 'requestCloseGame':
            nativeBridge.closeGameRoom();
            break;
        default:
            if (typeof webSocket[action] === 'function') {
                handleWebSocketAction(action);
            } else {
                log('[警告] 接続されていないか、無効なアクションです。');
            }
            break;
    }
});