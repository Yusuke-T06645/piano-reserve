import { notFound } from "next/navigation";
import { Container, SectionTitle } from "@/components/ui";
import { getStore } from "@/lib/store";
import { config } from "@/lib/config";
import { ManagePanel } from "./ManagePanel";

export const dynamic = "force-dynamic";

export default async function ManageTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reservation = await getStore().getReservationByManageToken(token);
  if (!reservation) notFound();

  return (
    <Container className="py-10 sm:py-14 max-w-lg">
      <SectionTitle title="ご予約内容の確認" />
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
    </Container>
  );
}
