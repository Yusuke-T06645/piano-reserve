import type { ReservationStore } from "./types";
import { LocalJsonStore } from "./localStore";
import { GoogleSheetsStore } from "./sheetsStore";

let storeInstance: ReservationStore | null = null;

/**
 * STORE_BACKEND=sheets を設定すると Google Sheets 実装に切り替わる。
 * 未設定時はローカルJSONファイル(var/data/db.json)で即座に動作するデモ用ストアを使う。
 */
export function getStore(): ReservationStore {
  if (!storeInstance) {
    storeInstance = process.env.STORE_BACKEND === "sheets" ? new GoogleSheetsStore() : new LocalJsonStore();
  }
  return storeInstance;
}

export * from "./types";
