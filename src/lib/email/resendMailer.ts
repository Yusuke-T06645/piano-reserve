import { Resend } from "resend";
import type { EmailMessage, Mailer } from "./types";
import { config } from "../config";

/** 本番運用向け: Resend APIを使った実送信実装。RESEND_API_KEY 設定時に自動で使われる。 */
export class ResendMailer implements Mailer {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<void> {
    const from = process.env.MAIL_FROM || `${config.siteName} <no-reply@example.com>`;
    const { error } = await this.client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    if (error) {
      throw new Error(`Resendでのメール送信に失敗しました(to: ${message.to}): ${error.name} - ${error.message}`);
    }
  }
}
