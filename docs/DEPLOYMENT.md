# デプロイ・本番設定ガイド

このドキュメントは、開発環境で動作確認済みの予約システムを、実際の運用（Google Sheetsを台帳とした本番運用）に切り替えるための手順です。対象読者は開発・運用担当者を想定しています。

## 0. 全体構成

- **アプリ本体**: Next.js（Vercelへのデプロイを想定）
- **データストア**: 既定は `local`（アプリ内のJSONファイル。すぐ試せるが、サーバーレス環境では永続化されないため本番不可）。本番は `sheets`（Google Sheets）に切り替える。
- **メール送信**: 未設定時は送信されず `var/outbox/` にHTMLとして保存されるのみ（開発確認用）。本番は Resend を利用する。
- **定期実行（Cron）**: リマインダーメール送信・ノーショー判定を Vercel Cron で定期実行する（`vercel.json` に設定済み）。

## 1. Google Sheets 連携の設定（予約台帳）

管理者が使い慣れたスプレッドシート画面で予約状況をリアルタイムに閲覧・軽微な編集ができるようにするため、本番では予約データをGoogle Sheetsに直接読み書きします。

### 1-1. スプレッドシートの準備

1. Google Driveで新規スプレッドシートを作成する（例:「グランドピアノ開放_予約台帳」）。
2. シート内のタブは初回アクセス時にアプリが自動生成するため、事前に手動でタブやヘッダーを作る必要はない（`Reservations` / `Waitlist` / `BlackoutDates` / `NoShowStrikes` の4タブが自動作成される）。
3. 作成したスプレッドシートのURLから **スプレッドシートID** を控える（`https://docs.google.com/spreadsheets/d/【ここがID】/edit`）。

### 1-2. サービスアカウントの作成（Google Cloud Console）

1. [Google Cloud Console](https://console.cloud.google.com/) で新規プロジェクトを作成（または既存プロジェクトを使用）。
2. 「APIとサービス」→「ライブラリ」から **Google Sheets API** を有効化する。
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「サービスアカウント」を選択し、任意の名前で作成する。
4. 作成したサービスアカウントの詳細画面で「キー」タブ →「鍵を追加」→「新しい鍵を作成」→ JSON形式でダウンロードする。
5. ダウンロードしたJSONファイルから以下の2つの値を控える:
   - `client_email`（サービスアカウントのメールアドレス）
   - `private_key`（秘密鍵。改行を含む文字列）

### 1-3. スプレッドシートの共有

1. 手順1-1で作成したスプレッドシートを開き、「共有」ボタンをクリック。
2. 手順1-2の `client_email`（例: `xxxx@xxxx.iam.gserviceaccount.com`）を **編集者** 権限で追加する。これを行わないとAPIから書き込みできない。

### 1-4. 環境変数の設定

`.env.local`（またはVercelの環境変数設定画面）に以下を設定する。

```
STORE_BACKEND=sheets
GOOGLE_SHEET_ID=<手順1-1で控えたスプレッドシートID>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<手順1-2で控えたclient_email>
GOOGLE_PRIVATE_KEY="<手順1-2で控えたprivate_key。改行はそのまま\nの形で1行に入れる>"
```

`GOOGLE_PRIVATE_KEY` はJSONファイル内では `\n` を含む1行の文字列になっているので、そのままコピー＆ペーストすればよい（アプリ側で `\n` を実際の改行に変換して読み込む）。

### 1-5. 動作確認

環境変数を設定してアプリを再起動（またはVercelに再デプロイ）した後、テスト予約を1件作成し、スプレッドシートの `Reservations` タブに行が追加されることを確認する。

## 2. メール送信（Resend）の設定

### 2-1. Resendアカウントの準備

1. [Resend](https://resend.com/) でアカウントを作成する。
2. 送信元ドメイン（例: `tanakagumi.co.jp` のサブドメイン等）を追加し、DNS認証（SPF/DKIM）を完了させる。ドメイン未認証の状態では、Resendが用意するテスト用アドレスからしか送信できない点に注意。
3. APIキーを発行する。

### 2-2. 環境変数の設定

```
RESEND_API_KEY=<発行したAPIキー>
MAIL_FROM="田中組グランドピアノ開放事業 <no-reply@your-domain>"
ADMIN_NOTIFY_EMAIL=<新規予約・キャンセルの通知を受け取る運営担当者のメールアドレス>
SUPPORT_EMAIL=<利用者からの問い合わせ先として案内するメールアドレス>
```

`RESEND_API_KEY` が空のままの場合、メールは実送信されず `var/outbox/` にHTMLファイルとして保存されるだけになる（開発時の内容確認用）。本番公開前に必ず設定すること。

## 3. 管理者アカウントの設定（重要・セキュリティ）

開発時のデフォルト値（`.env.example` の `ADMIN_EMAIL` / `ADMIN_PASSWORD`）は **デモ用の弱いパスワード** です。本番公開前に必ず変更してください。

1. 強固なパスワードを決め、bcryptハッシュを生成する（Node.jsが使える環境で以下を実行）:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('ここに強いパスワードを入力', 10))"
   ```
2. 生成されたハッシュ値を `ADMIN_PASSWORD_HASH` に設定し、`ADMIN_PASSWORD` は削除（空欄）にする。
3. `ADMIN_SESSION_SECRET` を十分に長いランダム文字列に変更する（例: `openssl rand -base64 32`）。
4. 複数の管理者アカウントが必要な場合は、現状は単一アカウント運用を前提とした簡易実装のため、運用担当者にご連絡いただければ複数アカウント対応の拡張を検討します。

## 4. Cron（定期実行）の設定

`vercel.json` に以下のCronジョブが定義済みです。

| パス | スケジュール | 内容 |
|---|---|---|
| `/api/cron/reminders` | 毎日 21:00（UTC） | 翌日以降の予約者へのリマインダーメール送信 |
| `/api/cron/no-shows` | 3時間ごと | 来場確認が取れなかった過去の予約をノーショーとして記録 |

これらのエンドポイントは `CRON_SECRET` による保護がかかっているため、Vercelにデプロイする際に環境変数 `CRON_SECRET` を設定してください（Vercel Cronからのリクエストには自動的にこの値がAuthorizationヘッダーとして付与されます）。

Vercel以外の環境（自社サーバー等）で運用する場合は、上記2つのエンドポイントを外部のスケジューラ（cronジョブ等）から、`Authorization: Bearer <CRON_SECRET>` ヘッダーを付けて定期的に呼び出してください。

## 5. Vercelへのデプロイ手順

1. GitHubリポジトリにコードをプッシュする。
2. [Vercel](https://vercel.com/) にログインし、「New Project」から対象リポジトリをインポートする。
3. 環境変数を設定する（上記1〜4章の内容 + `NEXT_PUBLIC_BASE_URL` を本番URLに設定）。
   - `NEXT_PUBLIC_BASE_URL` はQRコードや通知メール内のリンク生成に使われるため、必ず実際の公開URL（例: `https://piano.tanakagumi.co.jp`）に設定すること。
4. デプロイを実行する。
5. デプロイ後、`vercel.json` のCron設定が有効化されていることを Vercelダッシュボードの「Cron Jobs」タブで確認する。

## 6. 個人情報の取り扱い・匿名化バッチ

`scripts/purge-old-data.ts` は、設定期間（既定12ヶ月、`src/lib/config.ts` の `piiRetentionMonths`）を過ぎた予約データの氏名・連絡先を匿名化するバッチです。

- 実行方法: `npm run purge-old-data`
- 定期実行が必要な場合は、上記Cronと同様に外部スケジューラ（月1回程度を推奨）から実行するか、Vercel Cronに追加してください（現状 `vercel.json` には未登録のため、必要に応じて追加をご検討ください）。

## 7. 本番公開前チェックリスト

- [ ] `STORE_BACKEND=sheets` に設定し、Google Sheets連携が動作することを確認した
- [ ] Resendの送信ドメイン認証が完了し、テストメールが実際に届くことを確認した
- [ ] `ADMIN_PASSWORD_HASH` を強固なパスワードのハッシュに変更した（デフォルトの `changeme123` を使用していない）
- [ ] `ADMIN_SESSION_SECRET` / `CRON_SECRET` をランダムな文字列に変更した
- [ ] `NEXT_PUBLIC_BASE_URL` を本番URLに設定した
- [ ] 利用規約・プライバシーポリシー（`/terms` `/privacy`）の内容を法務担当者が確認済み
- [ ] 休止日（調律日等）を[運用マニュアル](./OPERATIONS.md)に従って登録済み
