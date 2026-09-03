import { notFound } from "next/navigation";
import { Stepper } from "@/components/ui";
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
    <div className="px-4 sm:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Stepper current={3} />

        <p className="text-xs font-bold tracking-widest text-gold uppercase">STEP 3 / 3</p>
        <h1 className="font-display mt-2.5 mb-10 text-2xl sm:text-[30px] font-bold text-navy">予約情報を入力する</h1>

        <BookingForm
          date={date}
          slotStart={slotInfo.start}
          slotEnd={slotInfo.end}
          initialMode={waitlist === "1" ? "waitlist" : "book"}
        />
      </div>
    </div>
  );
}
