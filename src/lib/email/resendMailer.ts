import { Resend } from "resend";
import type { EmailMessage, Mailer } from "./types";
import { config } from "../config";

/**
 * 環境変数の値は、設定手順の例(MAIL_FROM="名前 <email>")をそのままコピペした際に
 * 前後にクォート文字ごと入ってしまうことがある。Resendは `"名前 <email>"` のような
 * 値を不正な形式として拒否する(validation_error: Invalid `from` field)ため、
 * 前後の引用符と余分な空白を取り除いてから使う。
 */
function sanitizeFromAddress(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1).trim() : trimmed;
  return unquoted;
}

/** 本番運用向け: Resend APIを使った実送信実装。RESEND_API_KEY 設定時に自動で使われる。 */
export class ResendMailer implements Mailer {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const from = sanitizeFromAddress(process.env.MAIL_FROM || `${config.siteName} <no-reply@example.com>`);
    const { error } = await this.client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      // ResendのSDKはリクエストボディをJSON.stringifyするだけなので、Bufferをそのまま渡すと
      // "{ type: 'Buffer', data: [...] }" という配列表現に化けてしまい、Resend側で
      // 不正な添付ファイルとして送信自体が失敗する。base64文字列に変換してから渡す。
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
        contentType: a.contentType,
        contentId: a.cid,
      })),
    });
    if (error) {
      throw new Error(`Resendでのメール送信に失敗しました(to: ${message.to}): ${error.name} - ${error.message}`);
    }
  }
}
