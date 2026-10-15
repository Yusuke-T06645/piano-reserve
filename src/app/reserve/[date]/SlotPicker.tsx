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

/** ①②③… の丸数字 */
function slotNumber(index: number): string {
  return String.fromCharCode(0x2460 + index);
}

/**
 * 1組の利用時間が時間枠1つ分に固定されている場合(例: 20分×1日3組)の時間枠選択。
 * 長さを調整する必要がないため、ドラッグ操作のバーではなく、時間枠をカードから1つ選ぶ方式にする。
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
  const selected = slots.find((s) => s.start === selectedStart && s.status === "open") ?? null;
  const hasOpenSlot = slots.some((s) => s.status === "open");

  function waitlistHref(slot: Slot) {
    return `/reserve/${date}/${encodeURIComponent(slot.start)}_${encodeURIComponent(slot.end)}?waitlist=1`;
  }

  function confirm() {
    if (!selected) return;
    if (onConfirm) onConfirm(selected.start, selected.end);
    else router.push(`/reserve/${date}/${encodeURIComponent(selected.start)}_${encodeURIComponent(selected.end)}`);
  }

  return (
    <div className="rounded-[22px] border border-navy/[0.09] bg-white p-6 sm:p-10 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 mb-6">
        <h2 id={`slot-picker-${date}`} className="text-[17px] font-bold text-navy">
          時間枠を選んでください
        </h2>
        <span className="inline-flex items-center rounded-full bg-teal-soft px-4 py-2 text-[13px] font-bold text-teal-dark">
          1枠{slotMinutes}分・1日{slots.length}組まで
        </span>
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

      <div role="radiogroup" aria-labelledby={`slot-picker-${date}`} className="grid gap-3.5 sm:grid-cols-3">
        {slots.map((slot) => {
          const isOpen = slot.status === "open";
          const isSelected = selected?.start === slot.start;
          return (
            <div key={slot.start} className="flex flex-col">
              <label
                className={clsx(
                  "relative flex min-h-[132px] flex-col rounded-2xl px-5 py-4 transition-all",
                  isOpen && "cursor-pointer",
                  isSelected
                    ? "border-2 border-teal-dark bg-teal-soft shadow-[0_10px_24px_-14px_rgba(31,85,96,.6)]"
                    : isOpen
                      ? "border-[1.5px] border-navy/[0.16] bg-white hover:border-teal hover:shadow-soft"
                      : "border-[1.5px] border-dashed border-navy/[0.2] bg-[#F5F1EC]",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-dark"
                )}
              >
                <input
                  type="radio"
                  name={`slot-${date}`}
                  value={slot.start}
                  className="sr-only"
                  checked={isSelected}
                  disabled={!isOpen}
                  onChange={() => setSelectedStart(slot.start)}
                />
                <span className="flex items-center justify-between gap-2">
                  <span
                    className={clsx(
                      "font-display text-[22px] font-bold leading-none",
                      isOpen ? "text-teal-dark" : "text-muted"
                    )}
                    aria-hidden
                  >
                    {slotNumber(slot.index)}
                  </span>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-dark px-3 py-1 text-[12.5px] font-bold text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12l5 5L19 7" />
                      </svg>
                      選択中
                    </span>
                  ) : (
                    <span
                      className={clsx(
                        "rounded-full px-3 py-1 text-[12.5px] font-bold",
                        isOpen ? "bg-success-soft text-success" : "bg-[#EDE8DF] text-muted"
                      )}
                    >
                      {STATUS_LABEL[slot.status]}
                    </span>
                  )}
                </span>
                <span
                  className={clsx(
                    "mt-4 font-display text-[24px] font-bold tracking-tight",
                    isOpen ? "text-navy" : "text-muted line-through decoration-1"
                  )}
                >
                  {slot.start}
                  <span className="mx-1 text-[18px]">〜</span>
                  {slot.end}
                </span>
                <span className="mt-1 text-[13.5px] text-muted">
                  {isOpen ? `${slotMinutes}分間` : slot.status === "reserved" ? "ほかの方が予約済みです" : "受付時間を過ぎました"}
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

      <div className="mt-8 flex flex-col gap-4 border-t border-navy/[0.09] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          {selected ? (
            <>
              <p className="text-[13px] font-bold tracking-wide text-muted">選択中の時間</p>
              <p className="mt-1 font-display text-[22px] font-bold text-navy">
                {slotNumber(selected.index)} {selected.start}〜{selected.end}
                <span className="ml-2 text-[15px] font-semibold text-teal-dark">（{slotMinutes}分）</span>
              </p>
            </>
          ) : (
            <p className="text-[15px] text-muted">
              {hasOpenSlot ? "上の「空きあり」の枠から1つお選びください。" : "現在お選びいただける枠はありません。"}
            </p>
          )}
          <p className="mt-2 text-[13.5px] leading-[1.8] text-muted">
            このボタンではまだ予約は確定しません。次の画面で内容をご確認のうえ確定してください。
          </p>
        </div>
        <Button size="lg" className="shrink-0" disabled={!selected || confirmDisabled} onClick={confirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
