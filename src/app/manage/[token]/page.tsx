import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { config } from "@/lib/config";
import { ManagePanel } from "./ManagePanel";

export const dynamic = "force-dynamic";

export default async function ManageTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reservation = await getStore().getReservationByManageToken(token);
  if (!reservation) notFound();

  return (
    <div className="px-4 sm:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[680px]">
        <p className="text-center text-xs font-bold tracking-widest text-gold uppercase">MY RESERVATION</p>
        <h1 className="font-display mt-2.5 mb-11 text-center text-2xl sm:text-[28px] font-bold text-navy">
          ご予約内容の確認
        </h1>
        <ManagePanel
          token={token}
          initialReservation={{
            id: reservation.id,
            date: reservation.date,
            slotStart: reservation.slotStart,
            slotEnd: reservation.slotEnd,
            name: reservation.name,
            status: reservation.status,
          }}
          changeDeadlineHours={config.selfServiceChangeDeadlineHours}
        />
      </div>
    </div>
  );
}
