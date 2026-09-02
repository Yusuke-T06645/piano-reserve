import { SectionTitle } from "@/components/ui";
import { getStore } from "@/lib/store";
import { listUpcomingEligibleDates } from "@/lib/dates";
import { BlackoutManager } from "./BlackoutManager";

export const dynamic = "force-dynamic";

export default async function BlackoutDatesPage() {
  const store = getStore();
  const existing = await store.listBlackoutDates();
  const eligibleDates = listUpcomingEligibleDates();

  return (
    <div>
      <SectionTitle
        title="開放日の休止設定（調律・点検日など）"
        description="定期調律や点検等で開放を休止する日を、あらかじめ登録しておくことができます。"
      />
      <BlackoutManager existing={existing} eligibleDates={eligibleDates} />
    </div>
  );
}
