# 第一弾実装設計書：外形構築（謎なし）

**目的**: ページ遷移が完全に動作する外形のみを構築。謎の内容は**後から埋め込む**。

**対象**: フロントエンド（VanillaなHTML/CSS/JavaScript）+ 最小限のバックエンド

**期間**: 第一弾（謎ロジックなし）

---

## 1. 今回実装するもの / スキップするもの

### ✅ 実装する

- [x] localStorage: `session_auth`, `progress_stage` の状態管理・永続化
- [x] 手動ページ遷移: SPA的なページ切り替え（ハッシュルーティング）
- [x] 認証ガード: ログイン必須ページへのアクセス制御
- [x] グローバルナビゲーション: 全ページ共通のメニュー
- [x] 各ページの HTML テンプレート
- [x] `/logout` の状態遷移ロジック
- [x] `/admin` フォーム（見た目のみ、採点なし）
- [x] `/admin/terminal` リンク表示（Case解放ロジックなし）
- [x] `/case/:id` ページ（入力フォーム枠のみ）
- [x] ダミーログイン(常に成功)

### ❌ スキップする（後から埋め込み）

- [ ] `progress_stage` の段階的な表示差分
- [ ] 置換表・文字化けロジック
- [ ] Case解答の採点ロジック
- [ ] 入力正規化ルール
- [ ] ページ別の複雑な stage分岐
- [ ] エラーメッセージの侵食演出
- [ ] 復号材料の段階的露出

---

## 2. フロントエンド構成

### ディレクトリ構造

```
frontend-app/
├── index.html                   ← メインHTML（全ページテンプレート内蔵）
├── css/
│   └── style.css                ← グローバルスタイル
├── js/
│   ├── app.js                   ← メインアプリケーション
│   ├── router.js                ← ページ遷移・ルーティング
│   ├── storage.js               ← localStorage管理
│   └── templates.js             ← ページテンプレート定義
└── README.md
```

---

## 3. 状態管理（storage.js）

### GameState インターフェイス

```javascript
{
  session_auth: boolean,      // ログイン中か
  progress_stage: number,     // 0..5（ログアウト後も保持）
  loginAttempts: number       // /admin での不正解回数（表示用）
}
```

### API

```javascript
// ログイン
GameState.login(password) 
  - session_auth = true
  - progress_stage = 1 に昇格（0の場合のみ）

// ログアウト
GameState.logout()
  - session_auth = false
  - progress_stage は保持

// Stage進行
GameState.advanceStage(newStage)
  - progress_stage = newStage（進行上昇のみ）

// 不正解カウント
GameState.incrementLoginAttempts()
  - loginAttempts += 1

// localStorage への永続化
GameState.save()
GameState.load()
```

### localStorage 仕様

- **key**: `gameState`
- **値**: JSON文字列
- **対象**: `session_auth`, `progress_stage`, `loginAttempts`

---

## 4. ルーティング設計（router.js）

### ルート定義と認証要件

| パス | ページ | 認証必須 | 説明 |
|------|--------|---------|------|
| `#/` | Home | いいえ | ホーム |
| `#/bbs` | BBS | いいえ | 掲示板 |
| `#/bbs/logs` | BBSLogs | いいえ | 過去ログ |
| `#/bbs/rules` | BBSRules | いいえ | 注意書き |
| `#/diary` | Diary | いいえ | 日記 |
| `#/links` | Links | いいえ | リンク |
| `#/admin` | Admin | いいえ | 管理画面（第1暗号入力） |
| `#/admin/terminal` | AdminTerminal | **はい** | Case選択ハブ |
| `#/case/02` | CaseDetail | **はい** | Case02 |
| `#/case/03` | CaseDetail | **はい** | Case03 |
| `#/case/04` | CaseDetail | **はい** | Case04 |
| `#/case/05` | CaseDetail | **はい** | Case05 |
| `#/end` | CaseEnd | **はい** | 完了画面 |
| `#/logout` | Logout | いいえ | ログアウト処理 |

### ハッシュルーティングの仕組み

```javascript
// URL: http://example.com/#/bbs → ページ遷移
window.location.hash = '#/bbs'

// イベントリスナー で hashchange をキャッチ
window.addEventListener('hashchange', () => {
  const path = window.location.hash.slice(1) // '#/' を削除
  Router.navigate(path)
})
```

### 認証ガード

```javascript
Router.navigate(path) {
  const routeConfig = Routes[path]
  
  if (routeConfig && routeConfig.requiresAuth) {
    if (!GameState.session_auth) {
      // ログイン必須 → /admin へリダイレクト
      window.location.hash = '#/admin'
      return
    }
  }
  
  // ページレンダリング
  renderPage(routeConfig)
}
```

---

## 5. ページテンプレート設計（templates.js）

### テンプレート構造

各ページは以下の構造で実装：

```javascript
{
  name: 'home',
  path: '#/',
  requiresAuth: false,
  render: () => `
    <div class="page home">
      <h1>ようこそ</h1>
      <p>ここは何かの痕跡です。</p>
      <hr />
      <p class="sub">
        <small>page: Home | auth: ${gameState.session_auth} | stage: ${gameState.progress_stage}</small>
      </p>
    </div>
  `
}
```

### 共通レイアウト

```javascript
// 全ページをこのレイアウトでラップ
function layoutWrapper(pageHtml) {
  return `
    <div class="global-container">
      <nav class="global-nav">
        <a href="#/">ホーム</a>
        <a href="#/bbs">掲示板</a>
        <a href="#/diary">日記</a>
        <a href="#/links">リンク</a>
        <a href="#/admin">管理者ページ</a>
      </nav>
      <main class="content">
        ${pageHtml}
      </main>
    </div>
  `
}
```

### ページ例：Admin（第1暗号）

```javascript
{
  name: 'admin',
  path: '#/admin',
  requiresAuth: false,
  render: () => `
    <div class="page admin">
      <h1>管理画面</h1>
      <form id="adminForm" class="admin-form">
        <label for="password">合言葉を入力してください：</label>
        <input id="password" type="text" placeholder="全角のみ" />
        <button type="submit">決定</button>
      </form>
      <p id="errorMessage" class="error"></p>
      <hr />
      <p class="sub">
        page: Admin | auth: ${gameState.session_auth} | attempts: ${gameState.loginAttempts}
      </p>
    </div>
  `,
  onMount: () => {
    document.getElementById('adminForm').addEventListener('submit', (e) => {
      e.preventDefault()
      // 第一弾：ダミー採点（常に正解）
      gameState.login()
      window.location.hash = '#/admin/terminal'
    })
  }
}
```

### ページ例：AdminTerminal（Case選択）

```javascript
{
  name: 'admin-terminal',
  path: '#/admin/terminal',
  requiresAuth: true,
  render: () => `
    <div class="page admin-terminal">
      <h1>端末ハブ</h1>
      <p>Stage: ${gameState.progress_stage}</p>
      <div class="case-list">
        ${gameState.progress_stage >= 1 ? '<div class="case-item"><a href="#/case/02">資料２</a></div>' : ''}
        ${gameState.progress_stage >= 2 ? '<div class="case-item"><a href="#/case/03">資料３</a></div>' : ''}
        ${gameState.progress_stage >= 3 ? '<div class="case-item"><a href="#/case/04">資料４</a></div>' : ''}
        ${gameState.progress_stage >= 4 ? '<div class="case-item"><a href="#/case/05">最後の試練</a></div>' : ''}
        ${gameState.progress_stage >= 5 ? '<div class="case-item"><a href="#/end">完了</a></div>' : ''}
      </div>
      <hr />
      <div class="logout-area">
        <a href="#/logout" class="logout-btn">[ ログアウト ]</a>
      </div>
      <hr />
      <p class="sub">page: AdminTerminal | auth: ${gameState.session_auth}</p>
    </div>
  `
}
```

### ページ例：CaseDetail（謎ページ）

```javascript
{
  name: 'case-detail',
  path: '#/case/:id',
  requiresAuth: true,
  render: (params) => `
    <div class="page case-detail">
      <h1>資料${params.id}</h1>
      <p>謎の内容はここに埋め込まれます（第二弾以降）</p>
      <form id="caseForm" class="case-form">
        <label for="answer">答えを入力してください：</label>
        <input id="answer" type="text" placeholder="全角のみ" />
        <button type="submit">決定</button>
      </form>
      <p id="errorMessage" class="error"></p>
      <hr />
      <p class="sub">page: CaseDetail(${params.id}) | auth: ${gameState.session_auth} | stage: ${gameState.progress_stage}</p>
    </div>
  `,
  onMount: (params) => {
    document.getElementById('caseForm').addEventListener('submit', (e) => {
      e.preventDefault()
      // 第一弾：常に不正解
      document.getElementById('errorMessage').textContent = '答え（まだ判定ロジックなし）'
    })
  }
}
```

---

## 6. app.js（メインアプリケーション）

### 初期化

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // 1. localStorage から状態を読み込む
  gameState.load()
  
  // 2. 初期ルートを処理
  const initialPath = window.location.hash || '#/'
  router.navigate(initialPath.slice(1))
  
  // 3. hashchange イベントをリッスン
  window.addEventListener('hashchange', () => {
    const path = window.location.hash.slice(1)
    router.navigate(path)
  })
})
```

### ページレンダリングの流れ

```
1. URL が変わる（hashchange イベント）
   ↓
2. router.navigate(path) が呼び出される
   ↓
3. 認証チェック（requiresAuth === true && session_auth === false → #/admin へリダイレクト）
   ↓
4. ページの HTML を生成（templates.js の render() 関数）
   ↓
5. DOM を更新（#app コンテナに HTML を挿入）
   ↓
6. onMount() コールバック（フォームのイベントリスナー登録など）
```

---

## 7. HTML 構造

### index.html

```html
<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ミニARG - 謎解きゲーム</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="app"></div>
  
  <!-- スクリプト読み込み順序が重要 -->
  <script src="js/storage.js"></script>
  <script src="js/templates.js"></script>
  <script src="js/router.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

---

## 8. CSS 設計（style.css）

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'MS Pゴシック', 'Courier New', monospace;
  background-color: #000000;
  color: #ffffff;
  line-height: 1.6;
}

.global-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.global-nav {
  background-color: #1a1a1a;
  padding: 1rem;
  display: flex;
  gap: 2rem;
  border-bottom: 2px solid #666;
}

.global-nav a {
  color: #00ccff;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.global-nav a:hover {
  color: #fff;
}

.content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.page {
  background-color: #0a0a0a;
  color: #ffffff;
  padding: 2rem;
  border: 1px solid #666;
}

.page h1 {
  color: #00ccff;
  margin-bottom: 1rem;
}

/* フォームスタイル */
.admin-form label,
.case-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.admin-form input,
.case-form input {
  padding: 0.5rem;
  background-color: #1a1a1a;
  color: #ffffff;
  border: 1px solid #666;
  font-family: inherit;
  width: 100%;
  max-width: 300px;
  margin-bottom: 1rem;
}

.admin-form button,
.case-form button {
  padding: 0.5rem 1rem;
  background-color: #00ccff;
  color: #000;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.admin-form button:hover,
.case-form button:hover {
  background-color: #00ffff;
}

.error {
  color: #ff4444;
  margin-top: 1rem;
}

.sub {
  color: #888;
  margin-top: 2rem;
  font-size: 0.9rem;
}
```

---

## 9. サーバー実行方法

### 静的ファイルサーバーで起動

```bash
# Python 3
python -m http.server 8000

# または Node.js (http-server)
npx http-server

# ブラウザで開く
http://localhost:8000
```

---

## 10. 依存関係がゼロ

- 外部ライブラリ不要
- ビルドステップ不要
- Node.js/npm 不要（実行時）
- ブラウザだけで完全動作

---

## 11. 今後の拡張への対応

### 第二弾以降での追加予定

1. Case採点ロジック（`storage.js` に判定関数追加）
2. 表示差分（`templates.js` の render 関数内で `progress_stage` に応じた HTML 生成）
3. バックエンド連携（必要があれば fetch で API呼び出し）

- auth 状態に関わらず同じナビを表示
- `session_auth` には依存しない

### Home.vue

```vue
<template>
  <div class="home">
    <h1>ようこそ</h1>
    <p>ここは何かの痕跡です。</p>
  </div>
</template>
```

### Admin.vue

```vue
<template>
  <div class="admin">
    <h1>管理画面</h1>
    <form @submit.prevent="handleSubmit">
      <label>合言葉を入力してください：</label>
      <input v-model="password" type="text" />
      <button type="submit">決定</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
const gameStore = useGameStore()
const password = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  try {
    // 第一弾：ダミー採点（常に正解）
    await gameStore.login(password.value)
    router.push('/admin/terminal')
  } catch (e) {
    gameStore.incrementLoginAttempts()
    errorMessage.value = '違います。'
  }
}
</script>
```

### AdminTerminal.vue

```vue
<template>
  <div class="admin-terminal">
    <h1>端末ハブ</h1>
    <p>stage: {{ gameStore.progress_stage }}</p>
    
    <div class="case-links">
      <div v-if="gameStore.progress_stage >= 1" class="case-item">
        <router-link to="/case/02">資料２</router-link>
      </div>
      <div v-if="gameStore.progress_stage >= 2" class="case-item">
        <router-link to="/case/03">資料３</router-link>
      </div>
      <div v-if="gameStore.progress_stage >= 3" class="case-item">
        <router-link to="/case/04">資料４</router-link>
      </div>
      <div v-if="gameStore.progress_stage >= 4" class="case-item">
        <router-link to="/case/05">最後の試練</router-link>
      </div>
    </div>
    
    <hr />
    <div class="logout-area">
      <router-link to="/logout" class="logout-btn">[ ログアウト ]</router-link>
    </div>
  </div>
</template>

<script setup>
const gameStore = useGameStore()
</script>
```

### CaseDetail.vue

```vue
<template>
  <div class="case-detail">
    <h1>資料{{ caseId }}</h1>
    <p>謎の内容はここに埋め込まれます（第二弾以降）</p>
    
    <form @submit.prevent="handleSubmit">
      <label>答えを入力してください：</label>
      <input v-model="answer" type="text" />
      <button type="submit">決定</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()

const caseId = computed(() => route.params.id)
const answer = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
  // 第一弾：採点ロジックなし（常に不正解）
  errorMessage.value = '答え（まだ判定なし）'
}
</script>
```

### Logout.vue

```vue
<template>
  <div class="logout">
    <p>ログアウト処理中...</p>
  </div>
</template>

<script setup>
const gameStore = useGameStore()
const router = useRouter()

onMounted(async () => {
  await gameStore.logout()
  router.push('/admin/terminal')  // または '/'
})
</script>
```

### その他ページ（BBS, Diary, Links 等）

```vue
<template>
  <div class="bbs">
    <h1>掲示板</h1>
    <p>このページはまだ構築中です（謎埋め込み予定）</p>
  </div>
</template>
```

---

## 6. API 設計（バックエンド）

### エンドポイント（ダミー実装）

```
POST /api/auth/login
  Request: { password: string }
  Response: { success: boolean, message: string }
  ※ 第一弾：常に 200 OK

POST /api/auth/logout
  Response: { success: boolean }

POST /api/cases/:id/answer
  Request: { answer: string }
  Response: { success: boolean, message: string }
  ※ 第一弾：常に不正解レスポンス
```

### フロント側の API Service

```typescript
// src/services/api.ts

export async function postLogin(password: string) {
  // ダミー：常に成功
  return Promise.resolve({ success: true })
}

export async function postLogout() {
  return Promise.resolve({ success: true })
}

export async function postCaseAnswer(caseId: string, answer: string) {
  // ダミー：常に失敗
  return Promise.resolve({ success: false, message: '不正解' })
}
```

---

## 7. CSS / スタイル基本方針

### デザイン基調

- **時代**: 2000年代の古いウェブページ感
- **フォント**: Monospace（MS Pゴシック/Courier New）
- **カラー**: グレートーン + 黒 + ダークブルー
- **レイアウト**: Flex + Grid（シンプル）

### グローバルスタイル例

```css
body {
  font-family: 'MS Pゴシック', 'Courier New', monospace;
  background-color: #2a2a2a;
  color: #cccccc;
  margin: 0;
}

.global-nav {
  background-color: #1a1a1a;
  padding: 1rem;
  display: flex;
  gap: 2rem;
  border-bottom: 2px solid #666;
}

.global-nav a {
  color: #6699ff;
  text-decoration: none;
}

.global-nav a:hover {
  color: #fff;
}

.content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

input, button {
  background-color: #333;
  color: #ccc;
  border: 1px solid #666;
  padding: 0.5rem;
  font-family: monospace;
}

button:hover {
  background-color: #444;
}

.error {
  color: #ff6666;
}
```

---

## 8. 実装の進め方

### Phase 1-1: 基本セットアップ

1. Pinia store を実装
2. localStorage 永続化設定
3. Vue Router を実装（全ルート + ガード）
4. GlobalLayout + GlobalNav を作成

### Phase 1-2: ページコンポーネント

5. 各ページを最小限の枠で実装
6. /admin フォーム（ダミー採点）
7. /admin/terminal リンク表示（stage分岐ロジックなし）
8. /case/:id フォーム枠

### Phase 1-3: API + 動作確認

9. API Service（ダミー）実装
10. ログイン → ターミナル遷移確認
11. ページ遷移確認
12. ログアウト → 状態リセット確認

### Phase 1-4: スタイル

13. グローバルナビスタイル
14. 各ページの基本スタイル（2000年代風）

---

## 9. チェックリスト

- [ ] Pinia store（gameStore）実装
- [ ] localStorage 永続化確認
- [ ] Vue Router 設定完了
- [ ] GlobalLayout + GlobalNav 表示
- [ ] Home, BBS, Diary, Links, Admin, AdminTerminal, CaseDetail, CaseEnd 表示可能
- [ ] ナビゲーション全リンク動作確認
- [ ] /admin フォーム送信 → /admin/terminal 遷移
- [ ] /admin/terminal で stage 分岐表示（stage=0時はCase非表示、stage=1以上で順次表示）
- [ ] /logout で session_auth=false, progress_stage保持確認
- [ ] localStorage 再読み込み後の状態復元確認

---

## 10. 次フェーズへのインターフェース（後から埋め込み）

### 第二弾で追加する項目

| 項目 | 埋め込む場所 | 優先度 |
|------|----------|-------|
| 謎1(Case02) | CaseDetail.vue × caseId=02 | HIGH |
| 謎2(Case03) | CaseDetail.vue × caseId=03 | HIGH |
| 謎3(Case04) | CaseDetail.vue × caseId=04 | HIGH |
| 謎4(Case05統合) | CaseDetail.vue × caseId=05 | HIGH |
| 採点ロジック | api.ts + gameStore.advanceStage() | HIGH |
| 入力正規化 | CaseDetail.vue フォームの onSubmit | HIGH |
| 置換表・文字化け | 各ページの computed/methods | MEDIUM |
| stage別表示差分 | 各ページ v-if 分岐追加 | MEDIUM |
| エラーメッセージ侵食 | Admin.vue errorMessage の段階化 | LOW |

---

**設計完了。実装開始。**
