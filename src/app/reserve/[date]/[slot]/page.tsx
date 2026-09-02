import { notFound } from "next/navigation";
import { Container, SectionTitle } from "@/components/ui";
import { isDateBookable } from "@/lib/availability";
import { generateDaySlots } from "@/lib/config";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function SlotBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string; slot: string }>;
  searchParams: Promise<{ waitlist?: string }>;
}) {
  const { date, slot } = await params;
  const { waitlist } = await searchParams;
  const slotStart = decodeURIComponent(slot);

  if (!(await isDateBookable(date))) notFound();
  const slotInfo = generateDaySlots().find((s) => s.start === slotStart);
  if (!slotInfo) notFound();

  return (
    <Container className="py-10 sm:py-14 max-w-2xl">
      <SectionTitle eyebrow="Step 3" title="予約者情報を入力する" description="以下の内容をご確認のうえ、ご入力ください。" />
      <BookingForm
        date={date}
        slotStart={slotInfo.start}
        slotEnd={slotInfo.end}
        initialMode={waitlist === "1" ? "waitlist" : "book"}
      />
    </Container>
  );
}
