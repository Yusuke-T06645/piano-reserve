import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Alert } from "@/components/ui";
import { getStore } from "@/lib/store";
import { formatJapaneseDate } from "@/lib/dates";
import { buildCheckinUrl, generateQrDataUrl } from "@/lib/qr";
import { config } from "@/lib/config";
import { verifyConfirmationToken } from "@/lib/confirmationToken";

export const dynamic = "force-dynamic";

function buildIcs(date: string, slotStart: string, slotEnd: string, id: string): string {
  const [y, m, d] = date.split("-");
  const [sh, sm] = slotStart.split(":");
  const [eh, em] = slotEnd.split(":");
  const dt = (hh: string, mm: string) => `${y}${m}${d}T${hh}${mm}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:${id}@piano-reserve`,
    `DTSTART:${dt(sh, sm)}`,
    `DTEND:${dt(eh, em)}`,
    `SUMMARY:${config.siteShortName}のご予約`,
    `DESCRIPTION:予約番号 ${id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default async function CompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ct?: string }>;
}) {
  const { id } = await params;
  const { ct } = await searchParams;

  const reservation = (await getStore().getReservation(id)) ?? (ct ? await verifyConfirmationToken(ct, id) : null);
  if (!reservation) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qrDataUrl = await generateQrDataUrl(buildCheckinUrl(reservation.checkinToken, baseUrl));
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(
    buildIcs(reservation.date, reservation.slotStart, reservation.slotEnd, reservation.id)
  )}`;

  return (
    <div className="px-4 sm:px-16 py-14 sm:py-[72px]">
      <div className="mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-4 py-1.5 text-xs font-bold text-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
          予約完了
        </span>
        <h1 className="font-display mt-5 text-2xl sm:text-[32px] font-bold text-navy">ご予約ありがとうございました</h1>
        <p className="mt-3 text-[14.5px] text-muted leading-[1.8]">
          確認メールをお送りしました。当日は下記のQRコードを受付でご提示ください。
        </p>

        <div className="mt-10 rounded-[26px] border border-navy/[0.09] bg-white p-8 sm:p-11 shadow-hero">
          <p className="text-xs text-muted">予約番号</p>
          <p className="font-display mt-1.5 mb-5 text-[22px] font-bold text-navy tracking-wide">{reservation.id}</p>
          <p className="font-display text-[21px] font-bold text-navy">{formatJapaneseDate(reservation.date)}</p>
          <p className="mt-1.5 mb-7 text-sm text-muted">
            {reservation.slotStart}〜{reservation.slotEnd}
          </p>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`予約番号 ${reservation.id} のチェックイン用QRコード`}
            className="mx-auto h-56 w-56 rounded-2xl border border-navy/[0.09] p-4 shadow-soft"
          />
          <p className="mt-4 text-[11.5px] text-muted">
            このQRコードのスクリーンショットを保存するか、確認メールを当日ご提示ください。
          </p>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3.5">
          <a href={icsDataUrl} download={`piano-reserve-${reservation.id}.ics`}>
            <Button variant="outline" className="w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M8 3v4M16 3v4M3 10h18M12 13v6M9 16h6" />
              </svg>
              カレンダーに登録する
            </Button>
          </a>
          <Link href={`/manage/${reservation.manageToken}`}>
            <Button variant="ghost" className="w-full">
              予約内容の確認・キャンセルはこちら
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-left">
          <Alert tone="info" title="当日のお願い">
            近隣へのご配慮（演奏時間の厳守）と、鍵盤をご利用の際の衛生面へのご配慮をお願いいたします。
          </Alert>
        </div>
      </div>
    </div>
  );
}
