/**
 * キー単位の簡易Mutex。
 * 「同一予約枠に複数の利用者が同時アクセスした場合の二重予約防止」のための排他制御に使う。
 * Node.jsのシングルプロセス内で有効。Google Sheets運用に切り替えた場合は、
 * これに加えてスプレッドシート側のシート内一意キー制約と組み合わせることを推奨(README参照)。
 */
class KeyedMutex {
  private queues = new Map<string, Promise<unknown>>();

  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => (release = resolve));
    this.queues.set(
      key,
      prev.then(() => next)
    );
    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (this.queues.get(key) === prev.then(() => next)) {
        this.queues.delete(key);
      }
    }
  }
}

export const slotMutex = new KeyedMutex();
