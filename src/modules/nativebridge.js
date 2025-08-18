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
    if (jsonObject.status === "success") return jsonObject.data;
    else if (jsonObject.status === "fail") throw new Error(jsonObject.data.message);
    throw new Error(jsonObject.message);
  }

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