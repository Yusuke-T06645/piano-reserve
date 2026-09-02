import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Card, Badge, Button, Alert } from "@/components/ui";
import { getStore } from "@/lib/store";
import { formatJapaneseDate } from "@/lib/dates";
import { buildCheckinUrl, generateQrDataUrl } from "@/lib/qr";
import { config } from "@/lib/config";

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

export default async function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await getStore().getReservation(id);
  if (!reservation) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qrDataUrl = await generateQrDataUrl(buildCheckinUrl(reservation.checkinToken, baseUrl));
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(
    buildIcs(reservation.date, reservation.slotStart, reservation.slotEnd, reservation.id)
  )}`;

  return (
    <Container className="py-10 sm:py-14 max-w-xl">
      <div className="text-center mb-8">
        <Badge tone="success">予約完了</Badge>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-navy">ご予約ありがとうございました</h1>
        <p className="mt-2 text-muted">確認メールをお送りしました。当日は下記のQRコードを受付でご提示ください。</p>
      </div>

      <Card className="text-center">
        <p className="text-sm text-muted">予約番号</p>
        <p className="text-xl font-bold text-navy mb-4">{reservation.id}</p>
        <p className="text-lg font-semibold text-navy">{formatJapaneseDate(reservation.date)}</p>
        <p className="text-muted mb-6">
          {reservation.slotStart}〜{reservation.slotEnd}
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`予約番号 ${reservation.id} のチェックイン用QRコード`}
          className="mx-auto h-56 w-56 rounded-xl border border-black/5 p-2"
        />
        <p className="mt-3 text-xs text-muted">
          このQRコードのスクリーンショットを保存するか、確認メールを当日ご提示ください。
        </p>
      </Card>

      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <a href={icsDataUrl} download={`piano-reserve-${reservation.id}.ics`}>
          <Button variant="outline" className="w-full">
            カレンダーに登録する
          </Button>
        </a>
        <Link href={`/manage/${reservation.manageToken}`}>
          <Button variant="ghost" className="w-full">
            予約内容の確認・キャンセルはこちら
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        <Alert tone="info" title="当日のお願い">
          近隣へのご配慮（演奏時間の厳守）と、鍵盤をご利用の際の衛生面へのご配慮をお願いいたします。
        </Alert>
      </div>
    </Container>
  );
}
