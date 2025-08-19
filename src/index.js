import './styles/app.css';
import { WebSocketClient } from './modules/websocket.js';
import { NativeBridgeClient } from './modules/nativebridge.js';

const appState = {
    userInfo: null,
    roomInfo: null,
    isHost: false,
};

const webSocket = new WebSocketClient();
const nativeBridge = new NativeBridgeClient(navigator.userAgent);

let currentGameState = {};

const setupWebSocketHandlers = () => {
    webSocket.onReceiveRoomStatus(data => {
        appState.isHost = (data.host_user_id === appState.userInfo.user_id);
    });
   
    webSocket.onUserInfoRequest(data => {
        appState.userInfo = { ...appState.userInfo, ...data };
    });

    webSocket.onError(console.error);

    webSocket.onGameRoomClose(() => {
        nativeBridge.closeGameRoomNotification().catch(console.error);
    });

    webSocket.onReceiveGamePlayStatus(data => {
        logMessage(`Received game play status: ${JSON.stringify(data)}`);
        // 状態を更新
        if (appState.isHost) {
            // ホスト側で受け取る
        } else {
            // ゲスト側で受け取る
        }
    });

    webSocket.onReceiveConsumedItems(data => {
        logMessage(`Received consumed items: ${JSON.stringify(data)}`);
        document.getElementById('consumedItems-time').value = data.consumed || 0;
    });

    webSocket.onReceiveItemLists(data => {
        logMessage(`Received item lists: ${JSON.stringify(data)}`);
    });
};

const initialize = async () => {
    try {
        const [userInfo, roomInfo] = await Promise.all([
            nativeBridge.fetchUserInfo(),
            nativeBridge.fetchGameRoomInfo()
        ]);
        appState.userInfo = userInfo;
        appState.roomInfo = roomInfo;
        appState.isHost = (userInfo.user_id === roomInfo.game_room_id);
        
        await webSocket.connect(appState.userInfo.user_id, appState.roomInfo.game_room_id);
        
        webSocket.sendAuthenticate(appState.userInfo.secret);
        setupWebSocketHandlers();

        webSocket.requestUserInfo();

        // consumedItems-timeに現在のUNIXタイムスタンプを設定
        const currentTime = Math.floor(Date.now() / 1000);
        document.getElementById('consumedItems-time').value = currentTime;

        const userId = document.getElementById('userId');
        if (userId) {
            userId.textContent = `${appState.userInfo.user_id}`;
        }
        const hostUserId = document.getElementById('hostUserId');
        if (hostUserId) {
            hostUserId.textContent = `${appState.roomInfo.game_room_id}`;
        }

    } catch (error) {
        // console.error('Initialization failed:', error);
        logMessage(`Initialization failed: ${error.message}`);
    }
};

// --- アプリケーションの開始 ---
window.addEventListener('DOMContentLoaded', () => {
    initialize();

    // ゲーム終了
    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
        closeButton.addEventListener('click', async () => {
            console.log('Close button clicked');
            // ホストのみがゲームを終了できる
            if (!appState.isHost) {
                logMessage('Only the host can close the game room.');
                return;
            }
            try {
                await nativeBridge.closeGameRoom();
            } catch (error) {
                logMessage(`Failed to close game room: ${error.message}`);
            }
        });
    }

    // 消費アイテム取得
    const consumedItems = document.getElementById('consumedItems');
    if (consumedItems) {
        consumedItems.addEventListener('click', async () => {
            let time = document.getElementById('consumedItems-time').value;
            // valueが0なら現在時刻のunixtimeを使用
            if (time === '0') {
                time = Math.floor(Date.now() / 1000); // 現在のUNIXタイムスタンプを取得
            }
            logMessage(`Consumed items button clicked at time: ${time}`);
            try {
                // webSocketを通じて消費アイテムを取得
                await webSocket.fetchConsumedItems(time);
            } catch (error) {
                logMessage(`Failed to fetch consumed items: ${error.message}`);
            }
        });
    }

    // アイテムリスト取得
    const itemListButton = document.getElementById('itemLists');
    if (itemListButton) {
        itemListButton.addEventListener('click', async () => {
            logMessage(`Item list button clicked`);
            // 現在時刻のUNIXタイムスタンプを取得
            let time = Math.floor(Date.now() / 1000);
            try {
                // webSocketを通じてアイテムリストを取得
                await webSocket.fetchItemLists(time);
            } catch (error) {
                logMessage(`Failed to fetch item lists: ${error.message}`);
            }
        });
    }
});

function logMessage(message) {
    const logArea = document.getElementById('log');
    if (logArea) {
        logArea.value += `${message}\n`;
    }
}
// ログ初期化
function clearLog() {
    const logArea = document.getElementById('log');
    if (logArea) {
        logArea.value = '';
    }
}