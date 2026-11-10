import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import { Stepper } from "@/components/ui";
import { listDaySummaries, type DaySummary } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * 日付ごとの状況。色だけでなく文言でも区別できるようにする。
 * スマートフォンの1行に収まるよう、バッジは短い言葉にして詳しい説明は2行目(note)に出す。
 */
function dayStatus(d: DaySummary): { badge: string; variant: "success" | "warning" | "neutral"; note: string } {
  switch (d.status) {
    case "open":
      return { badge: "空きあり", variant: "success", note: `残り${d.freeMinutes}分` };
    case "full":
      return {
        badge: "満席",
        variant: "warning",
        note: d.waitlistCount > 0 ? "キャンセル待ち受付中" : "キャンセル待ちできます",
      };
    case "closed":
      return { badge: "受付終了", variant: "neutral", note: "本日の受付は終了しました" };
    case "blackout":
      return { badge: "休止日", variant: "neutral", note: "調律・点検等のため" };
  }
}

export default async function ReservePage() {
  const days = await listDaySummaries();
  const nextBookable = days.find((d) => d.status === "open");

  return (
    <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px]">
        <Stepper current={1} />

        <p className="text-[13px] font-bold tracking-widest text-gold-ink uppercase">STEP 1 / 3</p>
        <h1 className="font-display mt-2.5 text-2xl sm:text-[30px] font-bold text-navy">予約する日を選ぶ</h1>
        <p className="mt-3 mb-6 text-[16px] text-muted leading-[1.8]">
          開放日は毎月第1・第3金曜日、{config.openTime}〜{config.closeTime}です。下の開放日の一覧から、ご希望の日を選んでください。
        </p>

        {nextBookable && (
          <div className="mb-6 max-w-3xl">
            <Banner
              status="info"
              collapsible={false}
              title="次に予約できる日"
              description={`${formatJapaneseDate(nextBookable.date)}（残り${nextBookable.freeMinutes}分）`}
              endContent={
                <Button
                  label="この日の時間を選ぶ"
                  variant="primary"
                  size="sm"
                  href={`/reserve/${nextBookable.date}`}
                  endContent={<Icon icon="chevronRight" />}
                />
              }
            />
          </div>
        )}

        {days.length > 0 && !nextBookable && (
          <div className="mb-6 max-w-3xl">
            <Banner
              status="warning"
              collapsible={false}
              title="現在、すぐにご予約いただける空き枠がありません"
              description="満席の日はキャンセル待ちにご登録いただけます（キャンセルが出た場合、先着順で自動的にご案内します）。休止日・受付終了の日はお選びいただけません。"
            />
          </div>
        )}

        {/* 開放日は1行ずつの一覧にして、スマートフォンでも一度に多くの日を見比べられるようにする */}
        {days.length > 0 && (
          <div className="max-w-3xl">
            <Card padding={2}>
              <List hasDividers edge="outset" header={<span className="sr-only">開放日の一覧</span>}>
                {days.map((d) => {
                  const status = dayStatus(d);
                  const selectable = d.status === "open" || d.status === "full";
                  return (
                    <ListItem
                      key={d.date}
                      label={<span className="font-display text-[17px] sm:text-[19px] font-bold">{formatJapaneseDate(d.date)}</span>}
                      description={`${config.openTime}〜${config.closeTime}・${status.note}`}
                      href={selectable ? `/reserve/${d.date}` : undefined}
                      isDisabled={!selectable}
                      endContent={
                        <span className="flex items-center gap-2">
                          <Badge label={status.badge} variant={status.variant} />
                          {selectable && <Icon icon="chevronRight" color="secondary" />}
                        </span>
                      }
                    />
                  );
                })}
              </List>
            </Card>
          </div>
        )}

        {days.length === 0 && (
          <p className="text-[16px] leading-[1.8] text-ink">
            現在、予約可能な開放日の情報がありません。次回の日程が決まり次第、このページに掲載します。お急ぎの場合は
            <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
              {config.supportEmail}
            </a>
            までお問い合わせください。
          </p>
        )}
      </div>
    </div>
  );
}
