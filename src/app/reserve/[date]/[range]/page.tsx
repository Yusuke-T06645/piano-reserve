import { notFound } from "next/navigation";
import { Stepper } from "@/components/ui";
import { isDateBookable } from "@/lib/availability";
import { config, timeToMinutes } from "@/lib/config";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

function parseRange(range: string): { slotStart: string; slotEnd: string } | null {
  const [slotStart, slotEnd] = decodeURIComponent(range).split("_");
  if (!slotStart || !slotEnd || !/^\d{2}:\d{2}$/.test(slotStart) || !/^\d{2}:\d{2}$/.test(slotEnd)) return null;

  const start = timeToMinutes(slotStart);
  const end = timeToMinutes(slotEnd);
  const duration = end - start;
  if (
    duration <= 0 ||
    duration > config.maxUsageMinutes ||
    duration % config.granularityMinutes !== 0 ||
    start < timeToMinutes(config.openTime) ||
    end > timeToMinutes(config.closeTime) ||
    start % config.granularityMinutes !== 0
  ) {
    return null;
  }
  return { slotStart, slotEnd };
}

export default async function RangeBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ date: string; range: string }>;
  searchParams: Promise<{ waitlist?: string }>;
}) {
  const { date, range } = await params;
  const { waitlist } = await searchParams;

  if (!(await isDateBookable(date))) notFound();
  const parsed = parseRange(range);
  if (!parsed) notFound();

  return (
    <div className="px-4 sm:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Stepper current={3} />

        <p className="text-xs font-bold tracking-widest text-gold uppercase">STEP 3 / 3</p>
        <h1 className="font-display mt-2.5 mb-10 text-2xl sm:text-[30px] font-bold text-navy">予約情報を入力する</h1>

        <BookingForm
          date={date}
          slotStart={parsed.slotStart}
          slotEnd={parsed.slotEnd}
          initialMode={waitlist === "1" ? "waitlist" : "book"}
        />
      </div>
    </div>
  );
}
