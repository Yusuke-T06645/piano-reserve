"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui";
import { SlotKeys, buildSlots, type Slot, type SlotStatus } from "@/components/SlotKeys";
import type { BusyRange } from "@/lib/store/types";

const STATUS_LABEL: Record<SlotStatus, string> = {
  open: "空きあり",
  reserved: "予約済み",
  cutoff: "受付終了",
};

/**
 * 1組の利用時間が時間枠1つ分に固定されている場合(例: 20分×1日3組)の時間枠選択。
 * 長さを調整する必要がないため、ドラッグ操作のバーではなく、時間枠をカードから1つ選ぶ方式にする。
 * 上の鍵盤でその日の空き状況を示し、下のカードから時間枠を選ぶ。
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

  const slots = useMemo(
    () => buildSlots(openTime, closeTime, slotMinutes, busyRanges),
    [openTime, closeTime, slotMinutes, busyRanges]
  );

  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const selected = slots.find((s) => s.start === selectedStart && s.status === "open") ?? null;
  const hasOpenSlot = slots.some((s) => s.status === "open");
  const openCount = slots.filter((s) => s.status === "open").length;

  function select(slot: Slot) {
    setSelectedStart(slot.start);
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

  return (
    <div className="rounded-2xl border border-navy/[0.08] bg-white p-5 sm:p-8">
      {/* 見出し */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
        <h2 id={`slot-picker-${date}`} className="font-display text-[22px] sm:text-[24px] font-medium text-navy">
          弾きたい時間枠をえらぶ
        </h2>
        <p className="text-[14px] text-muted tabular-nums">
          1枠{slotMinutes}分・残り{openCount}枠
        </p>
      </div>

      {/* その日の空き状況(鍵盤)。選んだ枠の鍵盤が色付きになる */}
      <SlotKeys slots={slots} closeTime={closeTime} selectedStart={selected?.start ?? null} className="mb-8" />

      {!hasOpenSlot && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold-soft px-5 py-4">
          <p className="text-[16px] font-medium text-navy">この日は空いている時間枠がありません</p>
          <p className="mt-2 text-[15px] leading-[1.8] text-ink">
            {showWaitlistCta
              ? "予約済みの枠は、キャンセル待ちにご登録いただけます。キャンセルが発生した場合、先着順で自動的にご案内します。"
              : "別の日付をお選びください。"}
            {waitlistCount > 0 && `（現在 ${waitlistCount} 件のキャンセル待ちが登録されています）`}
          </p>
        </div>
      )}

      {/* 時間枠 */}
      <div role="radiogroup" aria-labelledby={`slot-picker-${date}`} className="grid gap-4 sm:grid-cols-3">
        {slots.map((slot) => {
          const isOpen = slot.status === "open";
          const isSelected = selected?.start === slot.start;
          return (
            <div key={slot.start} className="flex flex-col">
              <label
                className={clsx(
                  "flex min-h-[128px] select-none flex-col rounded-xl border p-5",
                  "transition-[background-color,border-color,transform] duration-150",
                  isOpen && "cursor-pointer active:scale-[0.98]",
                  isSelected
                    ? "border-teal-dark bg-teal-dark text-white"
                    : isOpen
                      ? "border-navy/15 bg-white hover:border-teal-dark/50 hover:bg-teal-soft/40"
                      : "border-dashed border-navy/20 bg-cream",
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

                <span
                  className={clsx(
                    "flex items-center gap-2 text-[14px]",
                    isSelected ? "text-white/85" : isOpen ? "text-success" : "text-muted"
                  )}
                >
                  {isSelected ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                  ) : (
                    <span aria-hidden className={clsx("h-2 w-2 rounded-full", isOpen ? "bg-success" : "bg-navy/25")} />
                  )}
                  {isSelected ? "選択中" : STATUS_LABEL[slot.status]}
                </span>

                <span
                  className={clsx(
                    "mt-4 font-display text-[28px] font-medium leading-none tabular-nums",
                    isSelected ? "text-white" : isOpen ? "text-navy" : "text-muted line-through decoration-1"
                  )}
                >
                  {slot.start}
                  <span className={clsx("mx-2 text-[18px]", isSelected ? "text-white/70" : "text-muted")}>–</span>
                  {slot.end}
                </span>
                <span className={clsx("mt-3 text-[14px]", isSelected ? "text-white/85" : "text-muted")}>
                  {isSelected
                    ? "この時間で予約します"
                    : isOpen
                      ? `${slotMinutes}分間`
                      : slot.status === "reserved"
                        ? "ほかの方が予約済みです"
                        : "受付時間を過ぎました"}
                </span>
              </label>
              {slot.status === "reserved" && showWaitlistCta && (
                <Link
                  href={waitlistHref(slot)}
                  className="mt-2 inline-flex min-h-11 items-center justify-center text-[14px] font-medium text-teal-dark hover:underline"
                >
                  この枠のキャンセル待ちに登録する
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* 選択内容と次へ進むボタン。スマホでは画面下に固定して、スクロールしても押せるようにする */}
      <div className="sticky bottom-3 z-10 mt-8 -mx-2 sm:mx-0">
        <div
          className={clsx(
            "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4",
            selected ? "border-navy/[0.08] bg-white shadow-elevated" : "border-navy/[0.08] bg-cream"
          )}
        >
          <div aria-live="polite" className="min-w-0">
            {selected ? (
              <p className="flex items-baseline gap-2 font-display text-[22px] font-medium text-navy">
                <span className="font-sans text-[14px] text-teal-dark">選択中</span>
                <span className="tabular-nums">
                  {selected.start}–{selected.end}
                </span>
                <span className="font-sans text-[14px] text-muted">（{slotMinutes}分）</span>
              </p>
            ) : (
              <p className="text-[15px] text-muted">
                {hasOpenSlot ? "上の時間枠から1つ選んでください" : "現在お選びいただける枠はありません"}
              </p>
            )}
          </div>
          <Button size="lg" className="shrink-0" disabled={!selected || confirmDisabled} onClick={confirm}>
            {confirmLabel}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </div>
      </div>
      <p className="mt-3 px-1 text-[13px] leading-[1.7] text-muted">
        「{confirmLabel}」を押しても、まだ予約は確定しません。次の画面で内容をご確認ください。
      </p>
    </div>
  );
}
