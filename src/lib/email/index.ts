import type { Mailer } from "./types";
import { ResendMailer } from "./resendMailer";
import { ConsoleMailer } from "./consoleMailer";

let mailerInstance: Mailer | null = null;

/** RESEND_API_KEY があれば実送信(Resend)、なければコンソール/ファイル出力のモック送信に切り替わる */
export function getMailer(): Mailer {
  if (!mailerInstance) {
    mailerInstance = process.env.RESEND_API_KEY
      ? new ResendMailer(process.env.RESEND_API_KEY)
      : new ConsoleMailer();
  }
  return mailerInstance;
}

export * from "./types";
export * as templates from "./templates";
