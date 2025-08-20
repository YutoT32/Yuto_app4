# WebSocketClient 実装まとめ

## 定数定義
- **RECEIVE_MESSAGE_KIND**  
  サーバーから受信するメッセージ種別を定義。
  - `ROOM_STATUS (1)`
  - `GAME_PLAY_STATUS (8)`
  - `ERROR (9)`
  - `NO_SEATS_AVAILABLE_ERROR (10)`
  - `GAME_ROOM_CLOSE (12)`
  - `USER_INFO_REQUEST (14)`
  - `USER_DISCONNECT (17)`
  - `CONSUMED_ITEMS (19)`
  - `ITEM_LISTS (21)`

- **SEND_MESSAGE_KIND**  
  クライアントから送信するメッセージ種別を定義。
  - `JOIN_GAME (2)`
  - `LEAVE_GAME (3)`
  - `GAME_MEDAL_BET (4)`
  - `PAYOUT (5)`
  - `GAME_PLAY_STATUS (7)`
  - `AUTHENTICATE (11)`
  - `USER_INFO_REQUEST (13)`
  - `UPDATE_MINIMUM_BET (15)`
  - `CONSUMED_ITEMS (18)`
  - `ITEM_LISTS (20)`

---

## WebSocketClient クラス

### プロパティ

- `ws` : WebSocket インスタンス
- `handlers` : 各メッセージ種別ごとのハンドラを格納

### 接続・切断

- `connect(userID, roomID)` : サーバーに接続
- `disconnect()` : 切断
- `isConnected()` : 接続状態確認

---

## 送信系メソッド(client -> server)

### `joinGame(targetUserID, seatNumber)` : ゲーム参加

配信者または視聴者がゲーム参加のリクエスト

#### input

- kind: JOIN_GAME (2) (number)
- target_user_id: 100 (number)<br>
  ゲームに参加するユーザーID
- seat_number: 100 (number)<br>
  参加するユーザーの座席<br>
  DBで管理してる参加人数以上は参加できない

### `leaveGame(targetUserID)` : ゲーム退席

ゲーム参加者が退席(未参加になる)のリクエスト

#### input

- kind: LEAVE_GAME (3) (number)
- target_user_id (number)<br>
退席するユーザーのID
  
### `betGameMedal(targetUserID, gameMedalAmount)` : メダル賭け

ゲーム参加者がゲームでメダルを賭ける<br>
(消費メダル数の予約)

#### input

- kind: GAME_MEDAL_BET (4) (number)
- target_user_id (number)<br>
ゲームメダルをベットするユーザーID
- game_medal_amount (number)<br>
賭けるゲームメダル数

### `payoutMedals(distributions)` : メダル配布

消費予約されたメダルを対応する参加者に配布
配信の獲得ポイントに消費されたメダルの総数を加算

#### input

- kind: PAYOUT (5) (number)
- distributions (array)
  - (object)
    - user_id (number)<br>
    ユーザーID
    - game_medal_amount (number)<br>
    配分するゲームメダル数
    - host_point (number)<br>
    ホストユーザーの取り分<br>
    (ライブおよびイベントポイントに加算される)
    - delete_point (number)
    ホストの徴収分<br>
    (ポイント加算されず削除(消滅))

### `sendGamePlayStatus(toUserID, gameState)` : ゲーム状態送信

ゲームの情報を送信リクエスト<br>

任意のjsonを渡す事ができるので、websocketサーバーを経由して現在のゲーム内容や途中からライブゲームに接続した視聴者が配信者に対して現状復帰のリクエストなどを送る

#### input

- kind: GAME_PLAY_STATUS (7) (number)
- to_user_id (number)<br>
送信対象のユーザーID。<br>
全員に送るなら 0 を指定する。
- game_state (object)<br>
共有するゲーム情報。<br>
任意のJSONを渡せる。<br>
10KB以内にする。

### `sendAuthenticate(token)` : 認証トークン送信

配信者のみ送れる<br>
ライブゲームを起動した配信者が合っているか確認(不正接続防止のため)<br>
視聴者は認証済みのルームに接続するので不要

#### input

- kind: AUTHENTICATE (11) (number)
- token (string)<br>
認証トークン。<br>
アプリからゲームに渡される。

### `requestUserInfo()` : ユーザー情報要求

自分の情報リクエスト

#### input

- kind: USER_INFO_REQUEST (13) (number)

### `updateMinimumBet(smallRate)` : 最低ベット更新

ゲームに参加する時の参加費やゲーム中に賭けるメダルの枚数更新

#### input

- kind: UPDATE_MINIMUM_BET (15)
- small_rate: (number)<br>
最小賭けメダル数

### `fetchConsumedItems(time)` : 消費アイテム取得

ライブゲーム起動中に配信で消費されたアイテムの一覧をリクエスト
指定された日時以降に消費されたアイテムを全て取得

#### input

- kind: CONSUMED_ITEMS (18) (number)<br>
- consume: (number)<br>
最後に消費したアイテムの時間のunixtime


### `fetchItemLists(time)` : アイテムリスト取得

現在配信で消費(使用)できるアイテム一覧リクエスト
アイテムの使用期限が指定日時以降のアイテムを取得

#### input

- kind: ITEM_LISTS (20) (number)
- period: (number)<br>
取得時間のunixtime

---

## 受信ハンドラ設定(server -> client)


### `onReceiveRoomStatus(handler)` : ルーム状態

ライブゲームに参加した時のルーム状態

#### output

- kind: ROOM_STATUS (1) (number)
- users (array)<br>
参加ユーザーのリスト
  - (object)
    - seat_number (number)<br>
    席番号 (1〜)
    - user_id (number)<br>
    ユーザーID
    - name (string)<br>
    ユーザー名
    - profile_image_url (string)<br>
    ユーザーアイコン画像のURL
    - have_game_medal_amount (number)<br>
    所持ゲームメダル数
    - bet_game_medal_amount (number)<br>
    現在ベットしているゲームメダル数
- limit (number)<br>
参加人数上限
- host_user_id (number)<br>
ホストのユーザーID
- game_point (number)<br>
このゲームルームで蓄積されたゲームポイント

### `onReceiveGamePlayStatus(handler)` : ゲーム状態

`GAME_PLAY_STATUS (7)`のレスポンス

#### output

- kind: GAME_PLAY_STATUS (8) (number)
- from_user_id (number)<br>
送信元のユーザーID
- to_user_id (number)<br>
送信対象のユーザーID。<br>
全員に送信されている場合は 0 である。
- game_state (object)<br>
共有するゲーム情報。<br>
`kind:7`で渡したjson

### `onReceiveConsumedItems(handler)` : 消費アイテム

`CONSUMED_ITEMS (18)`のレスポンス

#### output

- kind: CONSUMED_ITEMS (19)
- consumed: (number)<br>
最後に消費されたアイテムの消費時間のunixtime
- items (array)
  - (object)
    - item_id: (number)<br>
    アイテムID
    - item_name: (string)<br>
    - count: (number)<br>
    消費されたアイテム数<br>
    複数個まとめて消費できるアイテムが存在するため
    - score: (number)<br>
    消費アイテムのポイント
    - bonus_score: (number)<br>
    倍率ボーナスが適用されたポイント<br>
    ミクチャではアプリ内で実施されているイベントを紐付けて配信することができる<br>
    このイベントに対して倍率ボーナスと呼ばれるものが存在し消費アイテムのスコアに1.1〜1.5倍のボーナスが適用される<br>
    - consumed: (number)<br>
    消費時間のunixtime
    - user: (object)<br>
    アイテムを消費したユーザー情報
      - id: (number)<br>
      ユーザーID
      - name: (string)<br>
      ユーザー名
      - profile_image_url: (string)<br>
      ユーザーのプロフィールアイコン

### `onReceiveItemLists(handler)` : アイテムリスト

`ITEM_LISTS (20)`のレスポンス

#### output

- kind: ITEM_LISTS (21)
- items: (array)
  - (object)
    - id: (number)<br>
    アイテムID
    - name: (string)<br>
    アイテム名
    - price: (number)<br>
    価格(消費コイン数)
    - level: (number)<br>
    アイテムのレベル(omit)
    - kind: (number)<br>
    アイテム種別
      - 1: スーパーコメント(コメント装飾)
      - 2: スタンプ(コメント欄に送れるスタンプ)
      - 3: ポイポイ(連打アイテム。複数個まとめて消費されるアイテム)
      - 4: 演出アイテム<br>
      配信画面上に演出が表示されるアイテム<br>
      演出に配信者と視聴者のアイコンが表示される
      - 5: 演出アイテム
      配信画面上に演出が表示されるがアイコンはない
      - 6: アドボーナス
      抽選アイテム<br>
      ボックスアイコンをタップして確率で無料コインがもらえるアイテム
    - score: (number)<br>
    獲得ポイント
    - resource_id: (number)<br>
    リソースID(アニメーション用のpngなどのリソース)
    - tab_id: (number)<br>
    アイテム選択のタブID
    - unlocked_level: (number)<br>
    アイテムが使用できるユーザーレベル
    - icon_image_url: (string)<br>
    アイテムアイコンURL

### `onGameRoomClose(handler)` : ゲーム終了

ゲームを終了したとき、ヘルスチェックによりゲームルームが閉じられたときに送信される。

#### output
- kind: GAME_ROOM_CLOSE (12) (number)

### `onError(handler)` : エラー

WebSocketサーバーでエラーを検知したときにクライアントにメッセージを送信する。
所持ゲームメダルを超えてベットしようとしたとき、席が空いていないのに着席しようとしたとき、などに送られる。

- kind: ERROR (9) (number)
- message (string)<br>
エラーメッセージ

### `onNoSeatsAvailableError(handler)` : 席不足エラー

`JOIN_GAME (2)`で座席が足りない時に返されるエラー

#### output

- kind: NO_SEATS_AVAILABLE_ERROR (10) (number)
- message: (string)<br>
エラーメッセージ
- user_id (number)<br>
参加しようとしたユーザーID
- seat_number: (number)<br>
座席番号

### `onUserInfoRequest(handler)` : ユーザー情報要求

`USER_INFO_REQUEST (13)`のレスポンス

- kind: USER_INFO_REQUEST (14) (number)
- user_name: (string)<br>
ユーザー名
- have_game_medal_amount (number)<br>
所持ゲームメダル数

### `onUserDisconnect(handler)` : ユーザー切断
ゲームに参加してるユーザーのwebsocketが切断

- kind: USER_INFO_REQUEST (14) (number)
- have_game_medal_amount (number)<br>
所持ゲームメダル数

---
