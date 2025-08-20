/**
 * @typedef {object} GameUserInfo
 * @property {string} secret
 * @property {number} user_id
 */

/**
 * @typedef {object} GameRoomInfo
 * @property {string} game_version
 * @property {number} game_room_id
 */

class NativeBridgeClient {
  platform = "other";

  constructor(userAgent) {
    const hostname = window.location.hostname;
    if (userAgent === "Mixch-Livegame-Android-User-Agent") {
      this.platform = "android";
    } else if (userAgent === "Mixch-Livegame-iOS-User-Agent") {
      this.platform = "ios";
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.platform = "development";
    }
  }

  _handleAndroidResponse(response) {
    const jsonObject = JSON.parse(response);
    if (jsonObject.status === "success") {
      return jsonObject.data;
    } else if (jsonObject.status === "fail") {
      throw new Error(jsonObject.data.message);
    }
    throw new Error(jsonObject.message);
  }

  /**
   * ユーザー情報を取得します。
   * @returns {Promise<GameUserInfo>}
   */
  async fetchUserInfo() {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.fetchUserInfo.postMessage("");
      case "android":
        return this._handleAndroidResponse(await Android.fetchUserInfo());
      default:
        throw new Error("Unsupported platform");
    }
  }

  /**
   * ゲームルーム情報を取得します。
   * @returns {Promise<GameRoomInfo>}
   */
  async fetchGameRoomInfo() {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.fetchGameRoomInfo.postMessage("");
      case "android":
        return this._handleAndroidResponse(await Android.fetchGameRoomInfo());
      default:
        throw new Error("Unsupported platform");
    }
  }

  /**
   * ゲームメダルを追加します。
   * @returns {Promise<void>}
   */
  async addGameMedal() {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.addGameMedal.postMessage("");
      case "android":
        return this._handleAndroidResponse(await Android.addGameMedal());
      default:
        throw new Error("Unsupported platform");
    }
  }

  /**
   * ゲームルール画面を表示します。
   * @param {string} url
   * @returns {Promise<void>}
   */
  async showGameRule(url) {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.showGameRule.postMessage(url);
      case "android":
        return this._handleAndroidResponse(await Android.showGameRule(url));
      default:
        throw new Error("Unsupported platform");
    }
  }

  /**
   * ゲームルームを開きます。
   * @param {number} gameId
   * @returns {Promise<void>}
   */
  async openGameRoom(gameId) {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.openGameRoom.postMessage(gameId);
      case "android":
        return this._handleAndroidResponse(await Android.openGameRoom(gameId));
      default:
        throw new Error("Unsupported platform");
    }
  }

  /**
   * ゲームルームを閉じます。
   * @returns {Promise<void>}
   */
  async closeGameRoom() {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.closeGameRoom.postMessage("");
      case "android":
        return this._handleAndroidResponse(await Android.closeGameRoom());
      default:
        throw new Error("Unsupported platform");
    }
  }

  /**
   * ゲームルームが閉じたことをネイティブアプリに通知します。
   * @returns {Promise<void>}
   */
  async closeGameRoomNotification() {
    switch (this.platform) {
      case "ios":
        return await window.webkit.messageHandlers.closedGameRoomNotification.postMessage("");
      case "android":
        return this._handleAndroidResponse(await Android.closedGameRoomNotification());
      default:
        throw new Error("Unsupported platform");
    }
  }
}

export { NativeBridgeClient };