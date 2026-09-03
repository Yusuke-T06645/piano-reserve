import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import type { EmailMessage, Mailer } from "./types";

/**
 * 開発・デモ用のモック送信実装。
 * 実際には送信せず、内容を var/outbox/ 以下にファイルとして保存し、コンソールにも出力する。
 * RESEND_API_KEY 等を設定すれば ResendMailer に自動的に切り替わる(lib/email/index.ts参照)。
 */
export class ConsoleMailer implements Mailer {
  async send(message: EmailMessage): Promise<void> {
    // Vercel等のサーバーレス環境では process.cwd() 配下は読み取り専用のため、
    // 書き込み可能なOS一時ディレクトリ(/tmp)を使う。
    const base = process.env.VERCEL ? os.tmpdir() : process.cwd();
    const dir = path.join(base, "var", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const filename = `${Date.now()}_${message.to.replace(/[^a-zA-Z0-9@.]/g, "_")}.html`;
    const attachmentNote = (message.attachments ?? [])
      .map((a) => `\n<!-- attachment: ${a.filename} (${a.contentType}, ${a.content.length} bytes) -->`)
      .join("");
    await fs.writeFile(
      path.join(dir, filename),
      `<!-- To: ${message.to} -->\n<!-- Subject: ${message.subject} -->${attachmentNote}\n${message.html}`,
      "utf-8"
    );
    console.log(`[ConsoleMailer] メール送信(モック) → ${message.to} : ${message.subject} (${filename})`);
  }
}
