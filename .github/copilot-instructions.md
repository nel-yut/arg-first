## Copilot Instructions (zgpa-auth)

本リポジトリは PF 共通認証認可基盤: フロント(Vue3+Vite) / バックエンド(Spring Boot 3, Java 21) / インフラ(Terraform, AWS) / 補助Lambda(Python) で構成。

### 全体アーキテクチャ概要
1. フロント (`frontend-app/`) が Cognito ログインフローをキック + API 呼び出し (OpenAPI で定義) を行い、認可/組織/ユーザ情報を操作。
2. バックエンド (`backend/`) は Cognitoでの認証、トークンクッキー保存、Spring Boot Resource Server として JWT (Cognito) を検証し、DB(PostgreSQL) + JPA + Flyway で永続化。CloudFront 署名 URL, Cognito 等 AWS SDK 連携を含む。
3. Lambda (`custom-message-lambda/`, `lambda-trigger/`) は Cognito トリガ (カスタムメッセージ/トークン前処理) を拡張。
4. インフラ (`infra/auth/`) が Terraform で ALB / ECS Fargate / RDS / Cognito / SES / KMS / Route53 等を構築。Spring Boot コンテナは Jib で ECR へ push。

### 重要ディレクトリと役割
- `backend/openapi/openapi.yaml` : 単一ソースの API 仕様。ここを更新→コード生成→実装。
- `backend/src/gen/java/` : OpenAPI & Kong Admin API の生成成果物 (上書き前提; 手動編集禁止)。
- `backend/src/main/resources/db/migration/` : Flyway マイグレーション (V__ 版管理, テストデータは `R__` プレフィクス)。
- `frontend-app/mock-data/` : ローカル開発用モック API/サンプルレスポンス。
- `infra/auth/*.tf` : 環境命名は `locals` (systemname/subname/envname) に従いタグ付与。
- `custom-message-lambda/pyproject.toml` : Python 3.12 + pydantic; Cognito カスタムメッセージ拡張。

### コード生成ワークフロー (Backend)
1. OpenAPI 変更: `backend/openapi/openapi.yaml` を編集。
2. 実行: `./gradlew generateOpenApi` (Spring インターフェイス) / `./gradlew generateKongAdminApi` (Kong Admin クライアント)。
3. 生成前に対象パッケージを削除→コピーする Gradle タスクで再配置。`compileJava` は `generateKongAdminApi` に依存。
4. 実装: 生成された Controller インターフェイス (`jp.co.kkc.d2pf.auth.adapter.controller`) を `src/main/java` で実装。
5. 生成物はコミット (差分追跡用) するが編集はしない。

### データベース & マイグレーション
- 新規/変更: `V<version>__desc.sql` を `db/migration` に追加→ `./gradlew flywayMigrate` で検証。
- 共有テストデータ: `R__*.sql` に記述。再投入は `flywayRepair`。
- ローカル DB 接続は `build.gradle` の `flyway { url=jdbc:postgresql://localhost:15432/d2pf_common schema=auth }` を参照。

### テスト戦略 (Backend)
- ユニット: `src/test/java` (パラメータ/戻り値/例外/コンバータ検証)。
- 結合: `src/it/java` (sourceSet `integrationTest` + Testcontainers + Flyway)。実行: `./gradlew integrationTest`。
- JUnit5 / Rest-Assured / Testcontainers (PostgreSQL) 利用。

### フロントエンド開発
- 起動: `npm run start` (mode=localdev)。テスト用起動: `npm run test` (mode=localtest)。
- ビルド: `npm run build:<env>` (`localdev|localdeploy|dev|stg|prd`) で環境別設定。プレビュー: `npm run preview`。
- E2E: Playwright 準備 (`npx playwright install && npx playwright install-deps`) → `npm run test:e2e`。
- モックサーバ: `npm run mock-server` (Express + `mock-data/`) で API 擬似応答。
- 状態管理: Pinia + `pinia-plugin-persistedstate`; バリデーション: `vee-validate` + `zod`; 認証フローで `pkce-challenge` / `js-cookie` を利用。

### インフラ & デプロイ要点
- Terraform backend(S3) はコメントアウト; CI/CD で `terraform init -backend-config=...` する想定。`envname` 変数で `dev/prd` 等切替。
- Jib イメージ: `./gradlew jib` → `${accountId}.dkr.ecr.ap-northeast-1.amazonaws.com/<repo>/backend-ap` (env 環境変数 `env` が prd か否かで切替)。

### AWS 連携 (Backend コード上の注意)
- Cognito / CloudFront 署名URL / Secrets Manager / CloudFront KeyValueStore を AWS SDK v2 で利用。失敗時リトライ等は `failsafe` 導入済み (実装方針に合わせる)。

### 変更パターンの具体例
- API 追加: OpenAPI 追記 → `generateOpenApi` → インターフェイス実装 → ユニット/結合テスト追加 → フロント `services/` に Axios ラッパ生成/更新。
- DB 列追加: Flyway Vスクリプト作成 → `flywayMigrate` → エンティティ/Mapper更新 → テスト (ユニット+integration) → OpenAPI スキーマ反映。

### 禁止/注意
- `src/gen/java` の生成コードを直接編集しない (再生成で消える)。
- Flyway スクリプトの後方編集禁止 (新しい V で差分適用)。
- 日本語で回答すること。

### 優先サポート事項 (AIエージェント)
1. OpenAPI/DB 仕様同期 (差異を検出し提案)。
2. 生成コードと実装コードの責務分離維持 (ビジネスロジックは実装側)。
3. 環境別ビルド/設定の変更は既存 `<env>` 命名を踏襲。

不足/不明点があれば、このファイルへ簡潔に追記できる差分案を提示してください。