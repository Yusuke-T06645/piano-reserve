import clsx from "clsx";
import { minutesToTime, timeToMinutes } from "@/lib/config";
import type { BusyRange } from "@/lib/store/types";

export type SlotStatus = "open" | "reserved" | "cutoff";
export type Slot = { index: number; start: string; end: string; status: SlotStatus };

/** 開放時間を slotMinutes ごとの枠に分け、予約済み・受付終了の範囲と重なる枠に状態を付ける */
export function buildSlots(openTime: string, closeTime: string, slotMinutes: number, busyRanges: BusyRange[]): Slot[] {
  const result: Slot[] = [];
  const close = timeToMinutes(closeTime);
  for (let t = timeToMinutes(openTime), i = 0; t + slotMinutes <= close; t += slotMinutes, i++) {
    const end = t + slotMinutes;
    // 予約済みの範囲が枠の一部でも重なれば、その枠は予約できない(例: 16:45〜17:00 の予約 → 16:40〜17:00)
    const overlapping = busyRanges.filter((r) => timeToMinutes(r.start) < end && timeToMinutes(r.end) > t);
    const status: SlotStatus =
      overlapping.length === 0 ? "open" : overlapping.some((r) => r.kind === "reserved") ? "reserved" : "cutoff";
    result.push({ index: i, start: minutesToTime(t), end: minutesToTime(end), status });
  }
  return result;
}

const STATUS_TEXT: Record<SlotStatus, string> = {
  open: "空き",
  reserved: "予約済み",
  cutoff: "受付終了",
};

/**
 * その日の空き状況を鍵盤で表す。1枠が白鍵1つで、埋まった枠は黒く塗る。
 * トップページの「次回の開放日」と、時間枠の選択画面だけで使う。
 */
export function SlotKeys({
  slots,
  closeTime,
  tone = "light",
  selectedStart = null,
  className,
}: {
  slots: Slot[];
  closeTime: string;
  tone?: "light" | "dark";
  selectedStart?: string | null;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div className={className}>
      <ul
        aria-label="時間枠ごとの空き状況"
        className={clsx("flex gap-1 rounded-[10px] p-1", dark ? "bg-black/30" : "bg-navy/[0.06]")}
      >
        {slots.map((slot) => {
          const isOpen = slot.status === "open";
          const isSelected = isOpen && slot.start === selectedStart;
          return (
            <li
              key={slot.start}
              className={clsx(
                "flex h-14 flex-1 items-end justify-center rounded-b-md rounded-t-[2px] pb-2 text-[12px] transition-colors duration-150",
                isSelected
                  ? "bg-teal-dark text-white"
                  : isOpen
                    ? "bg-[#fbf9f4] text-muted shadow-[inset_0_-4px_0_rgba(18,35,46,0.08)]"
                    : "bg-[#17191b] text-white/60"
              )}
            >
              <span className="sr-only">
                {slot.start}〜{slot.end}
              </span>
              <span className={clsx(slots.length > 4 && "sr-only")}>
                {isSelected ? "選択中" : STATUS_TEXT[slot.status]}
              </span>
            </li>
          );
        })}
      </ul>
      <div
        aria-hidden
        className={clsx("relative mt-2 flex text-[12px] tabular-nums", dark ? "text-white/60" : "text-muted")}
      >
        {slots.map((slot) => (
          <span key={slot.start} className="flex-1 pl-1">
            {slot.start}
          </span>
        ))}
        <span className="absolute right-1">{closeTime}</span>
      </div>
    </div>
  );
}
