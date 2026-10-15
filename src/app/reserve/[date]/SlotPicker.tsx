"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui";
import { minutesToTime, timeToMinutes } from "@/lib/config";
import type { BusyRange } from "@/lib/store/types";

type SlotStatus = "open" | "reserved" | "cutoff";

type Slot = { index: number; start: string; end: string; status: SlotStatus };

const STATUS_LABEL: Record<SlotStatus, string> = {
  open: "空きあり",
  reserved: "予約済み",
  cutoff: "受付終了",
};

/** 選んだ時に枠から舞い上がる音符(横方向のずれ・回転・遅延) */
const NOTES = [
  { char: "♪", x: "-26px", r: "-18deg", delay: "0ms", left: "30%" },
  { char: "♫", x: "8px", r: "12deg", delay: "90ms", left: "52%" },
  { char: "♪", x: "28px", r: "22deg", delay: "180ms", left: "72%" },
];

/**
 * 1組の利用時間が時間枠1つ分に固定されている場合(例: 20分×1日3組)の時間枠選択。
 * 長さを調整する必要がないため、ドラッグ操作のバーではなく、時間枠をカードから1つ選ぶ方式にする。
 * 「鍵盤を押す」をモチーフに、押すと沈み込み、選ぶと音符が舞う。
 */
export function SlotPicker({
  date,
  openTime,
  closeTime,
  slotMinutes,
  busyRanges,
  waitlistCount,
  onConfirm,
  confirmLabel = "この時間で入力へ進む",
  confirmDisabled = false,
  showWaitlistCta = true,
}: {
  date: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  busyRanges: BusyRange[];
  waitlistCount: number;
  onConfirm?: (slotStart: string, slotEnd: string) => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  showWaitlistCta?: boolean;
}) {
  const router = useRouter();

  const slots = useMemo(() => {
    const result: Slot[] = [];
    const close = timeToMinutes(closeTime);
    for (let t = timeToMinutes(openTime), i = 0; t + slotMinutes <= close; t += slotMinutes, i++) {
      const end = t + slotMinutes;
      // 予約済みの範囲が枠の一部でも重なれば、その枠は予約できない(例: 16:45〜17:00 の予約 → ③ 16:40〜17:00)
      const overlapping = busyRanges.filter((r) => timeToMinutes(r.start) < end && timeToMinutes(r.end) > t);
      const status: SlotStatus =
        overlapping.length === 0 ? "open" : overlapping.some((r) => r.kind === "reserved") ? "reserved" : "cutoff";
      result.push({ index: i, start: minutesToTime(t), end: minutesToTime(end), status });
    }
    return result;
  }, [openTime, closeTime, slotMinutes, busyRanges]);

  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  // 同じ枠を選び直した時にも音符のアニメーションを再生するためのカウンタ
  const [burst, setBurst] = useState(0);
  const selected = slots.find((s) => s.start === selectedStart && s.status === "open") ?? null;
  const hasOpenSlot = slots.some((s) => s.status === "open");
  const openCount = slots.filter((s) => s.status === "open").length;

  function select(slot: Slot) {
    setSelectedStart(slot.start);
    setBurst((n) => n + 1);
    // 対応端末(主にAndroid)では軽い振動で「押した」手応えを返す
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
  }

  function waitlistHref(slot: Slot) {
    return `/reserve/${date}/${encodeURIComponent(slot.start)}_${encodeURIComponent(slot.end)}?waitlist=1`;
  }

  function confirm() {
    if (!selected) return;
    if (onConfirm) onConfirm(selected.start, selected.end);
    else router.push(`/reserve/${date}/${encodeURIComponent(selected.start)}_${encodeURIComponent(selected.end)}`);
  }

  const segmentWidth = 100 / Math.max(slots.length, 1);

  return (
    <div className="relative rounded-[26px] border border-navy/[0.09] bg-white p-5 sm:p-10 shadow-soft">
      {/* 見出し */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="text-[12.5px] font-bold tracking-[0.18em] text-gold-ink">CHOOSE YOUR TIME</p>
          <h2 id={`slot-picker-${date}`} className="mt-1 font-display text-[22px] sm:text-[24px] font-bold text-navy">
            弾きたい時間枠をえらぶ
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-[13px] font-bold text-white">
          <span aria-hidden className="text-gold-light">♪</span>
          1枠{slotMinutes}分・のこり{openCount}枠
        </span>
      </div>

      {/* 16:00〜17:00 のタイムライン。選んだ枠へインジケーターが弾むように移動する */}
      <div aria-hidden className="mb-7">
        <div className="relative flex h-3 overflow-hidden rounded-full bg-navy-soft">
          {slots.map((slot) => (
            <span
              key={slot.start}
              className={clsx(
                "h-full border-r-2 border-white last:border-r-0",
                slot.status === "open" ? "bg-success-soft" : ""
              )}
              style={{
                width: `${segmentWidth}%`,
                backgroundImage:
                  slot.status === "open"
                    ? undefined
                    : "repeating-linear-gradient(135deg, rgba(27,58,75,.18) 0 4px, transparent 4px 8px)",
              }}
            />
          ))}
          <span
            className={clsx(
              "absolute inset-y-0 rounded-full bg-linear-to-r from-teal to-teal-dark shadow-[0_0_14px_rgba(46,124,138,.55)]",
              "transition-[left,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
              selected ? "opacity-100" : "opacity-0"
            )}
            style={{ left: `${(selected?.index ?? 0) * segmentWidth}%`, width: `${segmentWidth}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[12.5px] font-medium text-muted">
          {slots.map((slot) => (
            <span key={slot.start}>{slot.start}</span>
          ))}
          <span>{closeTime}</span>
        </div>
      </div>

      {!hasOpenSlot && (
        <div className="mb-6 rounded-2xl border border-gold/40 bg-gold-soft px-5 py-4">
          <p className="text-[16px] font-bold text-navy">この日は空いている時間枠がありません</p>
          <p className="mt-1.5 text-[15px] leading-[1.8] text-ink">
            {showWaitlistCta
              ? "予約済みの枠は、キャンセル待ちにご登録いただけます。キャンセルが発生した場合、先着順で自動的にご案内します。"
              : "別の日付をお選びください。"}
            {waitlistCount > 0 && `（現在 ${waitlistCount} 件のキャンセル待ちが登録されています）`}
          </p>
        </div>
      )}

      {/* 時間枠(鍵盤) */}
      <div role="radiogroup" aria-labelledby={`slot-picker-${date}`} className="grid gap-4 sm:grid-cols-3">
        {slots.map((slot) => {
          const isOpen = slot.status === "open";
          const isSelected = selected?.start === slot.start;
          return (
            <div
              key={slot.start}
              className="slot-rise flex flex-col"
              style={{ animationDelay: `${120 + slot.index * 90}ms` }}
            >
              <label
                className={clsx(
                  "group relative flex min-h-[148px] select-none flex-col overflow-visible rounded-[22px] px-5 pt-4 pb-5",
                  "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out",
                  isOpen && "cursor-pointer",
                  isSelected
                    ? // 押し込まれた鍵盤: 少し沈み、下端の厚みが薄くなる
                      "translate-y-[3px] border-2 border-teal-dark bg-linear-to-br from-teal to-teal-dark text-white shadow-[inset_0_-3px_0_rgba(0,0,0,.18),0_14px_28px_-16px_rgba(31,85,96,.9)]"
                    : isOpen
                      ? // 待機中の鍵盤: 下端に厚みを持たせ、ホバーで少し浮き、押すと沈む
                        "border-2 border-navy/[0.12] bg-white shadow-[inset_0_-7px_0_rgba(27,58,75,.07),0_10px_22px_-18px_rgba(18,35,46,.5)] hover:-translate-y-0.5 hover:border-teal/60 hover:shadow-[inset_0_-7px_0_rgba(46,124,138,.12),0_18px_30px_-18px_rgba(31,85,96,.55)] active:translate-y-[3px] active:shadow-[inset_0_-3px_0_rgba(27,58,75,.1)]"
                      : "border-2 border-dashed border-navy/[0.18] bg-[#F5F1EC]",
                  "has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold"
                )}
              >
                <input
                  type="radio"
                  name={`slot-${date}`}
                  value={slot.start}
                  className="sr-only"
                  checked={isSelected}
                  disabled={!isOpen}
                  onChange={() => select(slot)}
                />

                {/* 選んだ瞬間に舞い上がる音符 */}
                {isSelected &&
                  NOTES.map((n, i) => (
                    <span
                      key={`${burst}-${i}`}
                      aria-hidden
                      className="slot-note pointer-events-none absolute top-6 text-[22px] font-bold text-teal-dark"
                      style={
                        {
                          left: n.left,
                          animationDelay: n.delay,
                          "--note-x": n.x,
                          "--note-r": n.r,
                        } as React.CSSProperties
                      }
                    >
                      {n.char}
                    </span>
                  ))}

                <span className="flex items-center justify-between gap-2">
                  <span
                    aria-hidden
                    className={clsx(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-[17px] font-bold transition-colors",
                      isSelected
                        ? "bg-white/20 text-white"
                        : isOpen
                          ? "bg-teal-soft text-teal-dark group-hover:bg-teal group-hover:text-white"
                          : "bg-[#EDE8DF] text-muted"
                    )}
                  >
                    {slot.index + 1}
                  </span>
                  {isSelected ? (
                    <span
                      key={`check-${burst}`}
                      className="slot-pop inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12.5px] font-bold text-teal-dark"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12l5 5L19 7" />
                      </svg>
                      選択中
                    </span>
                  ) : (
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold",
                        isOpen ? "bg-success-soft text-success" : "bg-[#EDE8DF] text-muted"
                      )}
                    >
                      {isOpen && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />}
                      {STATUS_LABEL[slot.status]}
                    </span>
                  )}
                </span>

                <span
                  className={clsx(
                    "mt-5 font-display text-[28px] font-bold leading-none tracking-tight tabular-nums",
                    isSelected ? "text-white" : isOpen ? "text-navy" : "text-muted line-through decoration-1"
                  )}
                >
                  {slot.start}
                  <span className={clsx("mx-1.5 text-[18px] font-medium", isSelected ? "text-white/70" : "text-muted")}>
                    –
                  </span>
                  {slot.end}
                </span>
                <span className={clsx("mt-2.5 text-[13.5px]", isSelected ? "text-white/85" : "text-muted")}>
                  {isSelected
                    ? "この時間で予約します"
                    : isOpen
                      ? `${slotMinutes}分間・タップして選択`
                      : slot.status === "reserved"
                        ? "ほかの方が予約済みです"
                        : "受付時間を過ぎました"}
                </span>
              </label>
              {slot.status === "reserved" && showWaitlistCta && (
                <Link
                  href={waitlistHref(slot)}
                  className="mt-2 inline-flex min-h-11 items-center justify-center gap-1 text-[14px] font-bold text-teal-dark hover:underline"
                >
                  この枠のキャンセル待ちに登録する
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* 選択内容と次へ進むボタン。スマホでは画面下に浮かせて、スクロールしても押せるようにする */}
      <div className="sticky bottom-3 z-10 mt-8 -mx-2 sm:mx-0">
        <div
          className={clsx(
            "flex flex-col gap-2.5 rounded-[20px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4",
            "transition-[background-color,box-shadow,border-color] duration-300",
            selected
              ? "border-teal/20 bg-white/85 shadow-[0_18px_40px_-20px_rgba(18,35,46,.45)] backdrop-blur-md"
              : "border-navy/[0.09] bg-cream/80 backdrop-blur-md"
          )}
        >
          <div aria-live="polite" className="min-w-0">
            {selected ? (
              <p key={`sum-${burst}`} className="slot-rise flex items-baseline gap-2 font-display text-[20px] sm:text-[22px] font-bold text-navy">
                <span className="text-[13px] font-sans font-bold text-teal-dark">選択中</span>
                <span className="tabular-nums">
                  {selected.start}–{selected.end}
                </span>
                <span className="text-[14px] font-sans font-semibold text-muted">（{slotMinutes}分）</span>
              </p>
            ) : (
              <p className="text-[15px] font-medium text-muted">
                {hasOpenSlot ? "↑ 弾きたい時間枠をタップしてください" : "現在お選びいただける枠はありません"}
              </p>
            )}
          </div>
          <Button
            size="lg"
            className={clsx("relative shrink-0 overflow-hidden", selected && "slot-shine")}
            key={selected ? `btn-${burst}` : "btn-idle"}
            disabled={!selected || confirmDisabled}
            onClick={confirm}
          >
            {confirmLabel}
            <span aria-hidden className="ml-1.5">→</span>
          </Button>
        </div>
      </div>
      <p className="mt-3 px-1 text-[12.5px] leading-[1.7] text-muted">
        「{confirmLabel}」を押しても、まだ予約は確定しません。次の画面で内容をご確認ください。
      </p>
    </div>
  );
}
