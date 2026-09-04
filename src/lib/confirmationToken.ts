import { SignJWT, jwtVerify } from "jose";
import type { Reservation } from "./store/types";

/**
 * 予約直後の完了画面(/reserve/complete/[id])は、Vercel等のサーバーレス環境で
 * デモ用のローカルJSONストア(STORE_BACKEND未設定時)を使っていると、予約作成を
 * 処理したインスタンスと直後の画面表示を処理するインスタンスが別になり、書き込み
 * 直後の読み取りに失敗して404になることがある(ローカルストアは/tmpに書くため
 * インスタンス間で共有されない)。
 *
 * これを避けるため、予約作成時に表示に必要な最小限の情報を署名付きトークンとして
 * 発行し、完了画面はストアの再読み込みに失敗した場合のみこのトークンをフォール
 * バックとして使う(ストアが正しく設定されていれば通常は使われない)。
 */

const TOKEN_TTL_MINUTES = 30;

export type ConfirmationSnapshot = Pick<
  Reservation,
  "id" | "date" | "slotStart" | "slotEnd" | "checkinToken" | "manageToken"
>;

function getSecret() {
  const secret =
    process.env.RESERVATION_TOKEN_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function signConfirmationToken(reservation: Reservation): Promise<string> {
  const snapshot: ConfirmationSnapshot = {
    id: reservation.id,
    date: reservation.date,
    slotStart: reservation.slotStart,
    slotEnd: reservation.slotEnd,
    checkinToken: reservation.checkinToken,
    manageToken: reservation.manageToken,
  };
  return new SignJWT({ ...snapshot })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_MINUTES}m`)
    .sign(getSecret());
}

export async function verifyConfirmationToken(
  token: string,
  expectedId: string
): Promise<ConfirmationSnapshot | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { id, date, slotStart, slotEnd, checkinToken, manageToken } = payload as Record<string, unknown>;
    if (
      id !== expectedId ||
      typeof date !== "string" ||
      typeof slotStart !== "string" ||
      typeof slotEnd !== "string" ||
      typeof checkinToken !== "string" ||
      typeof manageToken !== "string"
    ) {
      return null;
    }
    return { id: expectedId, date, slotStart, slotEnd, checkinToken, manageToken };
  } catch {
    return null;
  }
}
