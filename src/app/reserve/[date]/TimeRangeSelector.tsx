"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { minutesToTime, timeToMinutes } from "@/lib/config";
import type { BusyRange } from "@/lib/store/types";

type Gap = { start: number; end: number };
type DragMode = "start" | "end" | "move" | null;

function mergeAndInvert(busyRanges: BusyRange[], windowStart: number, windowEnd: number): Gap[] {
  const intervals = busyRanges
    .map((r) => [timeToMinutes(r.start), timeToMinutes(r.end)] as const)
    .sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const [s, e] of intervals) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }

  const gaps: Gap[] = [];
  let cursor = windowStart;
  for (const [s, e] of merged) {
    if (s > cursor) gaps.push({ start: cursor, end: Math.min(s, windowEnd) });
    cursor = Math.max(cursor, e);
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });
  return gaps.filter((g) => g.end - g.start >= 1);
}

function snap(minutes: number, granularity: number): number {
  return Math.round(minutes / granularity) * granularity;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TimeRangeSelector({
  date,
  openTime,
  closeTime,
  granularityMinutes,
  maxUsageMinutes,
  busyRanges,
  waitlistCount,
  onConfirm,
  confirmLabel = "この時間で予約する",
  confirmDisabled = false,
  showWaitlistCta = true,
}: {
  date: string;
  openTime: string;
  closeTime: string;
  granularityMinutes: number;
  maxUsageMinutes: number;
  busyRanges: BusyRange[];
  waitlistCount: number;
  /** 指定時は画面遷移せず、選択した時間帯(slotStart, slotEnd)をこのコールバックに渡す */
  onConfirm?: (slotStart: string, slotEnd: string) => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  showWaitlistCta?: boolean;
}) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; gap: Gap; pointerId: number; grabOffsetMin: number } | null>(null);

  const windowStart = timeToMinutes(openTime);
  const windowEnd = timeToMinutes(closeTime);
  const windowTotal = windowEnd - windowStart;

  const gaps = useMemo(() => mergeAndInvert(busyRanges, windowStart, windowEnd), [busyRanges, windowStart, windowEnd]);
  const largestGap = useMemo(
    () => gaps.reduce((best, g) => (g.end - g.start > (best?.end ?? 0) - (best?.start ?? 0) ? g : best), gaps[0]),
    [gaps]
  );

  const [selection, setSelection] = useState<{ start: number; end: number } | null>(() => {
    if (!largestGap) return null;
    const duration = Math.min(maxUsageMinutes, largestGap.end - largestGap.start);
    return { start: largestGap.start, end: largestGap.start + duration };
  });
  if (!largestGap || !selection) {
    return (
      <div className="rounded-[22px] border border-navy/[0.09] bg-white p-6 sm:p-10 text-center shadow-soft">
        <p className="text-[15px] font-bold text-navy">この日は空き時間がありません</p>
        <p className="mt-2.5 text-[13.5px] text-muted leading-relaxed">
          {showWaitlistCta
            ? "満席のため、キャンセル待ちに登録いただけます。キャンセルが発生した場合、先着順で自動的にご案内します。"
            : "満席のため、別の日付をお選びください。"}
          {waitlistCount > 0 && `（現在 ${waitlistCount} 件のキャンセル待ちが登録されています）`}
        </p>
        {showWaitlistCta && (
          <Button
            className="mt-6"
            onClick={() => router.push(`/reserve/${date}/${encodeURIComponent(openTime)}_${encodeURIComponent(closeTime)}?waitlist=1`)}
          >
            キャンセル待ちに登録する
          </Button>
        )}
      </div>
    );
  }

  const gapForSelection = (sel: { start: number; end: number }): Gap =>
    gaps.find((g) => sel.start >= g.start && sel.end <= g.end) ?? largestGap;

  function toPercent(min: number): number {
    return ((min - windowStart) / windowTotal) * 100;
  }

  function minutesFromClientX(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return windowStart;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return windowStart + ratio * windowTotal;
  }

  function updateSelection(next: { start: number; end: number }) {
    setSelection(next);
  }

  function handlePointerDown(mode: DragMode, e: React.PointerEvent) {
    if (!selection) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const gap = gapForSelection(selection);
    const grabMinutes = minutesFromClientX(e.clientX);
    dragRef.current = { mode, gap, pointerId: e.pointerId, grabOffsetMin: grabMinutes - selection.start };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !selection) return;
    const { mode, gap } = drag;
    const rawMinutes = minutesFromClientX(e.clientX);

    if (mode === "start") {
      let newStart = snap(rawMinutes, granularityMinutes);
      newStart = clamp(newStart, gap.start, selection.end - granularityMinutes);
      newStart = Math.max(newStart, selection.end - maxUsageMinutes);
      updateSelection({ start: newStart, end: selection.end });
    } else if (mode === "end") {
      let newEnd = snap(rawMinutes, granularityMinutes);
      newEnd = clamp(newEnd, selection.start + granularityMinutes, gap.end);
      newEnd = Math.min(newEnd, selection.start + maxUsageMinutes);
      updateSelection({ start: selection.start, end: newEnd });
    } else if (mode === "move") {
      const duration = selection.end - selection.start;
      let newStart = snap(rawMinutes - drag.grabOffsetMin, granularityMinutes);
      newStart = clamp(newStart, gap.start, gap.end - duration);
      updateSelection({ start: newStart, end: newStart + duration });
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  function adjustStart(deltaMinutes: number) {
    if (!selection) return;
    const gap = gapForSelection(selection);
    let newStart = clamp(selection.start + deltaMinutes, gap.start, selection.end - granularityMinutes);
    newStart = Math.max(newStart, selection.end - maxUsageMinutes);
    updateSelection({ start: newStart, end: selection.end });
  }

  function adjustEnd(deltaMinutes: number) {
    if (!selection) return;
    const gap = gapForSelection(selection);
    let newEnd = clamp(selection.end + deltaMinutes, selection.start + granularityMinutes, gap.end);
    newEnd = Math.min(newEnd, selection.start + maxUsageMinutes);
    updateSelection({ start: selection.start, end: newEnd });
  }

  function jumpToGap(g: Gap, clickMinutes: number) {
    if (!selection) return;
    const duration = Math.min(maxUsageMinutes, selection.end - selection.start, g.end - g.start);
    let start = snap(clickMinutes - duration / 2, granularityMinutes);
    start = clamp(start, g.start, g.end - duration);
    updateSelection({ start, end: start + duration });
  }

  const duration = selection.end - selection.start;
  const canGrow = duration < maxUsageMinutes;

  return (
    <div className="rounded-[22px] border border-navy/[0.09] bg-white p-6 sm:p-10 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5 mb-8">
        <div>
          <p className="text-xs font-bold tracking-wide text-muted uppercase">選択中の利用時間</p>
          <p className="mt-1.5 font-display text-2xl sm:text-[30px] font-bold text-navy">
            {minutesToTime(selection.start)} 〜 {minutesToTime(selection.end)}
            <span className="ml-2.5 text-base font-semibold text-teal-dark">（{duration}分）</span>
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-4 py-2 text-xs font-bold text-teal-dark">
          ドラッグで自由に調整できます
        </span>
      </div>

      {/* track */}
      <div
        ref={trackRef}
        className="relative h-16 rounded-2xl bg-navy-soft touch-none select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {gaps
          .filter((g) => g !== gapForSelection(selection))
          .map((g, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${minutesToTime(g.start)}〜${minutesToTime(g.end)}を選択`}
              className="absolute inset-y-0 rounded-2xl bg-success-soft hover:brightness-95"
              style={{ left: `${toPercent(g.start)}%`, width: `${toPercent(g.end) - toPercent(g.start)}%` }}
              onClick={() => jumpToGap(g, (g.start + g.end) / 2)}
            />
          ))}

        {busyRanges.map((r, i) => (
          <div
            key={i}
            aria-hidden
            className="absolute inset-y-0 flex items-center justify-center overflow-hidden rounded-2xl"
            style={{
              left: `${toPercent(timeToMinutes(r.start))}%`,
              width: `${toPercent(timeToMinutes(r.end)) - toPercent(timeToMinutes(r.start))}%`,
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(27,58,75,.16) 0 6px, transparent 6px 12px)",
            }}
          >
            <span className="whitespace-nowrap text-[10.5px] font-bold text-muted px-1">
              {r.kind === "cutoff" ? "受付終了" : "予約済み"}
            </span>
          </div>
        ))}

        {/* selected range */}
        <div
          className="absolute inset-y-0 rounded-2xl bg-linear-to-br from-teal to-teal-dark shadow-[0_10px_24px_-10px_rgba(31,85,96,.6)] cursor-grab active:cursor-grabbing"
          style={{ left: `${toPercent(selection.start)}%`, width: `${toPercent(selection.end) - toPercent(selection.start)}%` }}
          onPointerDown={(e) => handlePointerDown("move", e)}
        />

        {/* left handle */}
        <div
          role="slider"
          aria-label="開始時刻"
          aria-valuetext={minutesToTime(selection.start)}
          aria-valuenow={selection.start}
          aria-valuemin={gapForSelection(selection).start}
          aria-valuemax={selection.end - granularityMinutes}
          tabIndex={0}
          className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-full border-[3px] border-teal-dark bg-white shadow-md touch-none"
          style={{ left: `${toPercent(selection.start)}%` }}
          onPointerDown={(e) => handlePointerDown("start", e)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") adjustStart(-granularityMinutes);
            if (e.key === "ArrowRight") adjustStart(granularityMinutes);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal-dark)" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M9 5v14M15 5v14" />
          </svg>
        </div>
        <div
          aria-hidden
          className="absolute -top-9 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-bold text-white"
          style={{ left: `${toPercent(selection.start)}%` }}
        >
          {minutesToTime(selection.start)}
        </div>

        {/* right handle */}
        <div
          role="slider"
          aria-label="終了時刻"
          aria-valuetext={minutesToTime(selection.end)}
          aria-valuenow={selection.end}
          aria-valuemin={selection.start + granularityMinutes}
          aria-valuemax={gapForSelection(selection).end}
          tabIndex={0}
          className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-full border-[3px] border-teal-dark bg-white shadow-md touch-none"
          style={{ left: `${toPercent(selection.end)}%` }}
          onPointerDown={(e) => handlePointerDown("end", e)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") adjustEnd(-granularityMinutes);
            if (e.key === "ArrowRight") adjustEnd(granularityMinutes);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal-dark)" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <path d="M9 5v14M15 5v14" />
          </svg>
        </div>
        <div
          aria-hidden
          className="absolute -top-9 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs font-bold text-white"
          style={{ left: `${toPercent(selection.end)}%` }}
        >
          {minutesToTime(selection.end)}
        </div>
      </div>

      {/* axis labels */}
      <div className="mt-3.5 flex justify-between text-[11px] text-muted">
        <span>{openTime}</span>
        <span>{closeTime}</span>
      </div>

      {/* legend */}
      <div className="mt-7 flex flex-wrap gap-5 border-t border-navy/[0.09] pt-6">
        <span className="inline-flex items-center gap-2 text-xs text-muted">
          <span className="h-3.5 w-3.5 rounded bg-linear-to-br from-teal to-teal-dark" />選択中の時間
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-muted">
          <span className="h-3.5 w-3.5 rounded border border-navy/[0.16] bg-success-soft" />ご利用いただけます
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-muted">
          <span className="h-3.5 w-3.5 rounded border border-navy/[0.16] bg-navy-soft" />予約済み・受付終了
        </span>
      </div>

      {/* fine adjust */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="flex flex-1 items-center justify-between rounded-xl bg-cream px-4 py-3">
          <span className="text-xs font-bold text-navy">開始時刻</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="開始時刻を早める"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/[0.16] bg-white text-navy font-bold disabled:opacity-30"
              disabled={selection.start <= gapForSelection(selection).start}
              onClick={() => adjustStart(-granularityMinutes)}
            >
              －
            </button>
            <span className="font-display min-w-[52px] text-center text-base font-bold text-navy">
              {minutesToTime(selection.start)}
            </span>
            <button
              type="button"
              aria-label="開始時刻を遅らせる"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/[0.16] bg-white text-navy font-bold disabled:opacity-30"
              disabled={selection.start + granularityMinutes >= selection.end}
              onClick={() => adjustStart(granularityMinutes)}
            >
              ＋
            </button>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-xl bg-cream px-4 py-3">
          <span className="text-xs font-bold text-navy">終了時刻</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="終了時刻を早める"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/[0.16] bg-white text-navy font-bold disabled:opacity-30"
              disabled={selection.end - granularityMinutes <= selection.start}
              onClick={() => adjustEnd(-granularityMinutes)}
            >
              －
            </button>
            <span className="font-display min-w-[52px] text-center text-base font-bold text-navy">
              {minutesToTime(selection.end)}
            </span>
            <button
              type="button"
              aria-label="終了時刻を遅らせる"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-navy/[0.16] bg-white text-navy font-bold disabled:opacity-30"
              disabled={!canGrow || selection.end >= gapForSelection(selection).end}
              onClick={() => adjustEnd(granularityMinutes)}
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="flex items-center gap-1.5 text-[12.5px] text-muted">
          混雑緩和のため、1回のご利用は最大{maxUsageMinutes}分までとさせていただいております。
        </p>
        <Button
          size="lg"
          disabled={confirmDisabled}
          onClick={() => {
            const start = minutesToTime(selection.start);
            const end = minutesToTime(selection.end);
            if (onConfirm) {
              onConfirm(start, end);
            } else {
              router.push(`/reserve/${date}/${encodeURIComponent(start)}_${encodeURIComponent(end)}`);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
