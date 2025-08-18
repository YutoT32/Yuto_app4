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
};

const initialize = async () => {
    try {
        const [userInfo, roomInfo] = await Promise.all([
            nativeBridge.fetchUserInfo(),
            nativeBridge.fetchGameRoomInfo()
        ]);
        appState.userInfo = userInfo;
        appState.roomInfo = roomInfo;
        
        await webSocket.connect(appState.userInfo.user_id, appState.roomInfo.game_room_id);
        
        webSocket.sendAuthenticate(appState.userInfo.secret);
        setupWebSocketHandlers();

        webSocket.requestUserInfo();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

// --- アプリケーションの開始 ---
window.addEventListener('DOMContentLoaded', initialize);