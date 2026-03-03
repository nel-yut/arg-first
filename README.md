# arg-first

ミニAROゲーム UI実装（2000年代初頭の個人ページデザイン）

## 技術スタック

- **フロントエンド**: Vanilla HTML/CSS/JavaScript
- **開発サーバ**: Python HTTP サーバ
- **ルーティング**: Hash ベース（`#/path`）
- **状態管理**: localStorage + GameState オブジェクト
- **データ管理**: JavaScript モジュール（threads.js, diary.js, etc）

## ローカル起動方法

### 前提条件

- Python 3.8 以上

### 起動手順

1. **frontend-app ディレクトリへ移動**

```bash
cd frontend-app
```

2. **Python HTTP サーバを起動**

```bash
python3 -m http.server 8000
```

3. **ブラウザで開く**

```
http://localhost:8000/
```

### 初期状態

- **ホームページ**: `http://localhost:8000/`
- **デフォルトパスワード**: `あいことば`（全角のみ）
- **アクセスカウンター**: 固定値 33333

### ページ構成

| ページ | パス | 認証 |
|--------|------|------|
| ホーム | `/` | 不要 |
| 掲示板 | `#/bbs` | 不要 |
| 掲示板スレッド | `#/bbs/thread/:id` | 不要 |
| 日記一覧 | `#/diary` | 不要 |
| 日記詳細 | `#/diary/:date` | 不要 |
| 倉庫（アイテム） | `#/warehouse` | 必須 |
| 管理画面（ログイン） | `#/admin` | 不要 |
| 管理人ターミナル | `#/admin/terminal` | 必須 |
| Caseページ | `#/case/03`, `#/case/04`, `#/case/05` | 必須 |
| ログアウト | `#/logout` | 必須 |

### 主要機能

#### 認証システム

- パスワード「あいことば」でログイン
- 全角文字のみ入力可能
- localStorage でセッション永続化

#### BBS（掲示板）

- スレッド一覧・個別表示
- 新規スレッド作成（認証ユーザのみ）
- レス投稿（ID 998「雑談スレ」のみ、認証ユーザのみ）
- 投稿者名は「名無し」で固定

#### 日記

- 一覧・個別表示
- 公開/プライベート設定
  - 未認証: 公開日記のみ表示
  - 認証済: 全日記表示（プライベートにはバッジが表示）

#### 倉庫

- 6個のアイテム
- 認証状態でロック/アンロック表示
- 🔐 アイコン（ロック）/ 画像（アンロック）

#### 管理人ターミナル

- progress_stage に応じて Case を解放
- 段階的攻略ゲーム要素

## ファイル構成

```
frontend-app/
├── index.html              # メインHTML（スクリプト読み込み）
├── js/
│   ├── app.js              # アプリケーション初期化
│   ├── router.js           # Hash ベースルーター
│   ├── storage.js          # 状態管理（GameState）
│   ├── counter.js          # アクセスカウンター
│   ├── threads.js          # BBS データ管理
│   ├── diary.js            # 日記データ管理
│   ├── banners.js          # リンク管理
│   └── templates.js        # ページテンプレート
└── css/
    └── style.css           # グローバルスタイル
```

## 開発時のポイント

### フォーム送信時の挙動

- フォーム送信後、同じページへの遷移を検出するために `Router.navigate()` を使用（`window.location.hash` は使用しない）

### 認証状態の確認

```javascript
// storage.js で管理
GameState.session_auth  // boolean
GameState.login(password)  // ログイン
GameState.logout()         // ログアウト（auth=false、progress_stage は保持）
```

### ページ非表示制限

- `requiresAuth: true` を設定したページは未認証時にアクセス禁止

## トラブルシューティング

### ページが表示されない

- ブラウザの開発者ツール（F12）を開き、コンソールでエラーを確認
- キャッシュをクリア（Ctrl+Shift+Delete）

### ログイン状態が保持されない

- localStorage が有効になっているか確認
- プライベートブラウジング モードを使用していないか確認

### カウンターが更新されない

- アクセスカウンターは固定値 33333 です。これは仕様です。