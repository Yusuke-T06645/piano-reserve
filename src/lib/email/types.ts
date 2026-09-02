export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  /** 一部のメールクライアントでインライン画像として表示するためのCID */
  cid?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface Mailer {
  send(message: EmailMessage): Promise<void>;
}
