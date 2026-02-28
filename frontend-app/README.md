# ミニARG フロントエンド（第一弾：外形構築）

## 概要

Vue3 + Vite + Pinia + Vue Router を使用した謎解きゲームのフロントエンド実装。

**第一弾**: ページ遷移とページの枠組みのみ構築（謎の内容は後から埋め込む）

## ディレクトリ構造

```
frontend-app/
├── src/
│   ├── stores/
│   │   └── gameStore.ts         # Pinia store（状態管理）
│   ├── router/
│   │   └── index.ts             # Vue Router 設定
│   ├── components/
│   │   ├── GlobalLayout.vue     # グローバルレイアウト
│   │   └── GlobalNav.vue        # グローバルナビゲーション
│   ├── pages/
│   │   ├── Home.vue
│   │   ├── BBS.vue
│   │   ├── BBSLogs.vue
│   │   ├── BBSRules.vue
│   │   ├── Diary.vue
│   │   ├── Links.vue
│   │   ├── Admin.vue            # 第1暗号入力ページ
│   │   ├── AdminTerminal.vue    # Case選択ハブ
│   │   ├── CaseDetail.vue       # 謎ページ
│   │   ├── CaseEnd.vue          # 完了ページ
│   │   └── Logout.vue           # ログアウト処理
│   ├── services/
│   │   └── api.ts               # API クライアント（ダミー）
│   ├── App.vue
│   └── main.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── index.html
```

## セットアップ

### インストール

```bash
cd frontend-app
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

ブラウザが自動で http://localhost:5173 で開きます。

### ビルド

```bash
npm run build
```

## 状態管理（Pinia Store）

### GameStore

```typescript
// State
session_auth: boolean       // ログイン中か
progress_stage: number      // 進行度 0..5

// Actions
login(password: string)     // ログイン（常に成功：ダミー）
logout()                    // ログアウト
advanceStage(newStage)      // stageを進行
incrementLoginAttempts()    // 不正解カウント増加
```

### localStorage 永続化

`gameState` キーで以下の情報が保存されます：
- `session_auth`
- `progress_stage`
- `loginAttempts`

ページリロード後も状態が保持されます。

## ルーティング

| パス | ページ | 説明 | auth必須 |
|------|--------|------|--------|
| `/` | Home | ホーム | ❌ |
| `/bbs` | BBS | 掲示板 | ❌ |
| `/bbs/logs` | BBSLogs | 過去ログ | ❌ |
| `/bbs/rules` | BBSRules | 注意書き | ❌ |
| `/diary` | Diary | 日記 | ❌ |
| `/links` | Links | リンク集 | ❌ |
| `/admin` | Admin | 第1暗号入力 | ❌ |
| `/admin/terminal` | AdminTerminal | Case選択 | ✅ |
| `/case/:id` | CaseDetail | 謎ページ | ✅ |
| `/end` | CaseEnd | 完了 | ✅ |
| `/logout` | Logout | ログアウト | ❌ |

### ナビゲーションガード

`meta.requiresAuth` が `true` の場合、ログインなしでアクセスするとリダイレクトされます。
- 遷移先: `/admin`

## UI デザイン

- **時代感**: 2000年代のウェブページ
- **フォント**: MS Pゴシック, Courier New (monospace)
- **カラー**: グレートーン + 黒 + ダークブルー (#6699ff)
- **ナビゲーション**: 全ページ共通（auth状態に非依存）

## 動作確認済み項目

- ✅ グローバルナビ（全ページで表示）
- ✅ ページ遷移（ナビ + router-link）
- ✅ `/admin` → ログイン → `/admin/terminal`
- ✅ `/admin/terminal` からのCase選択（stage分岐）
- ✅ `/logout` での状態リセット（session_auth=false, progress_stage保持）
- ✅ localStorage への保存・復元

## 次フェーズ（第二弾）で追加予定

### ページの謎埋め込み
- [ ] Case02～05 の謎内容
- [ ] BBS, Diary, Links ページの内容
- [ ] 置換表・文字化けの実装

### 採点ロジック
- [ ] `/admin` での第1暗号採点
- [ ] `/case/:id` での謎解答採点
- [ ] 入力正規化ルール
- [ ] progress_stage 自動昇格

### stage別表示差分
- [ ] 各ページの段階的表示変更
- [ ] 削除レスの数変更
- [ ] 文字化けの露出レベル調整

### UI/UX調整
- [ ] エラーメッセージの侵食演出
- [ ] 2000年代風フォントの最適化
- [ ] レスポンシブ対応

## API ダミー仕様（第一弾）

### `postLogin(password: string)`
- 常に `{ success: true }` を返す
- 200ms の遅延あり

### `postCaseAnswer(caseId: string, answer: string)`
- 常に `{ success: false, message: '答え（まだ判定ロジックなし）' }` を返す
- 200ms の遅延あり

## 参考

詳細な設計書は [../docs/IMPLEMENTATION_PHASE1.md](../docs/IMPLEMENTATION_PHASE1.md) を参照。
