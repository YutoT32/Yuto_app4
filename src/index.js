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
    webSocket.onWSOpen = () => {
        logMessage(`WebSocket connection established to room:${appState.roomInfo.game_room_id}`);
    };
    webSocket.onWSClose = () => {
        logMessage('WebSocket connection closed.');
    };
    webSocket.onWSError = (error) => {
        logMessage(`WebSocket error: ${error.message}`);
    };

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
        webSocket.sendGamePlayStatus(0, data)
    });

    webSocket.onReceiveItemLists(data => {
        logMessage(`Received item lists: ${JSON.stringify(data)}`);
        webSocket.sendGamePlayStatus(0, data)
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
        setupWebSocketHandlers();
        
        await webSocket.connect(appState.userInfo.user_id, appState.roomInfo.game_room_id);
        
        if (appState.isHost) {
            webSocket.sendAuthenticate(appState.userInfo.secret);
        }

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
        logMessage(`Initialization failed: ${error.message}`);
    }
};

const setupScreen = document.getElementById("setup-screen");
const gameScreen = document.getElementById("game-screen");
const startGameBtn = document.getElementById("start-game-btn");
const secretAnswerInput = document.getElementById("secret-answer");
const gameDurationInput = document.getElementById("game-duration");

const timerDisplay = document.getElementById("timer");
const questionInput = document.getElementById("question-input");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const qaLog = document.getElementById("qa-log");

const revealBtn = document.getElementById("reveal-btn");
const revealedAnswerDisplay = document.getElementById("revealed-answer");
const resetBtn = document.getElementById("reset-btn");

let secretAnswer = "";
let timerInterval;
let timeLeft = 0;


// --- アプリケーションの開始 ---
window.addEventListener('DOMContentLoaded', () => {
    initialize();

    // ゲーム開始ボタンの処理
    startGameBtn.addEventListener("click", () => {
    secretAnswer = secretAnswerInput.value;
    const duration = parseInt(gameDurationInput.value, 10);

    if (!secretAnswer || isNaN(duration) || duration <= 0) {
        alert("「答え」と「ゲーム時間」を正しく入力してください。");
        return;
    }

    // 答え入力欄を非表示にする
    secretAnswerInput.style.display = "none";
    document.querySelector(
        "#setup-screen > div:first-child > label"
    ).style.display = "none";

    timeLeft = duration * 60;
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";

    updateTimerDisplay();
    startTimer();
    });

    // タイマーを開始する関数
    function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerDisplay.textContent = "回答タイム！";
        // 時間切れになったら質問ボタンを無効化
        questionInput.disabled = true;
        yesBtn.disabled = true;
        noBtn.disabled = true;
        }
    }, 1000);
    }

    // タイマー表示を更新する関数
    function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(
        2,
        "0"
    )}:${String(seconds).padStart(2, "0")}`;
    }

    // Yes/Noボタンの処理
    yesBtn.addEventListener("click", () => addLogEntry("Yes"));
    noBtn.addEventListener("click", () => addLogEntry("No"));

    // 質問をログに追加する関数
    function addLogEntry(response) {
    const questionText = questionInput.value.trim();
    if (questionText === "") {
        alert("質問を入力してください。");
        return;
    }

    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";

    const questionSpan = document.createElement("span");
    questionSpan.textContent = `Q. ${questionText}`;

    const responseSpan = document.createElement("span");
    responseSpan.className = "response";
    if (response === "Yes") {
        responseSpan.textContent = "◯ YES";
        responseSpan.classList.add("response-yes");
    } else {
        responseSpan.textContent = "✕ NO";
        responseSpan.classList.add("response-no");
    }

    logEntry.appendChild(questionSpan);
    logEntry.appendChild(responseSpan);

    // 新しい質問をログの一番上に追加
    qaLog.prepend(logEntry);

    questionInput.value = ""; // 入力欄をクリア
    questionInput.focus(); // 入力欄にフォーカスを戻す

    // スクロールを一番下まで移動 (新しいログが見えるように)
    const logContainer = document.getElementById("qa-log-container");
    logContainer.scrollTop = 0;
    }

    // Enterキーで質問を追加できるようにする
    questionInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        // デフォルトではYesボタンが押されたことにする
        addLogEntry("Yes");
    }
    });

    // 答えを表示するボタンの処理
    revealBtn.addEventListener("click", () => {
    revealedAnswerDisplay.textContent = `答えは「${secretAnswer}」でした！`;
    });
/*
    // リセットボタンの処理
    resetBtn.addEventListener("click", () => {
    // ページをリロードするのが一番簡単で確実
    location.reload();
    });
*/
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
/*
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
    */
});

function logMessage(message) {
    /*
    const logArea = document.getElementById('log');
    if (logArea) {
        logArea.value += `${message}\n`;
    }
    logArea.scrollTop = logArea.scrollHeight; // スクロールを最新のログに合わせる
    */
}
