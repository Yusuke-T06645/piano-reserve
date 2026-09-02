import QRCode from "qrcode";

/**
 * チェックイン用URLを生成する。
 * QRコードには予約情報そのものではなく「一意のトークン」だけを埋め込み、
 * 実データはサーバー側(データストア)で管理する。これにより、QR画像が
 * 流出しても予約者の個人情報が直接読み取られることはない。
 */
export function buildCheckinUrl(token: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/admin/checkin?token=${token}`;
}

export function buildManageUrl(token: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, "")}/manage/${token}`;
}

/** QRコードをdata URL(PNG, base64)として生成する */
export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#1F2A44", light: "#FFFFFFFF" },
  });
}

/** メール添付用にQRコードをPNGバッファとして生成する */
export async function generateQrBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#1F2A44", light: "#FFFFFFFF" },
  });
}
