import { config, venueMapLink } from "@/lib/config";

/**
 * 会場のご案内。
 * 住所・地図リンク・受付方法は常に表示し、運営で未確認の項目(アクセス・入口・駐車場・バリアフリー)は
 * 推測で埋めずに非表示とし、代わりに問い合わせ先を案内する。
 */
export function VenueInfo({ className = "" }: { className?: string }) {
  const mapUrl = venueMapLink();
  const optionalItems = [
    { label: "最寄り駅・バス停からのアクセス", value: config.venueAccess },
    { label: "建物の入口・受付場所", value: config.venueEntrance },
    { label: "駐車場・駐輪場", value: config.venueParking },
    { label: "段差・車いすでのご来館", value: config.venueAccessibility },
  ].filter((item) => item.value.trim().length > 0);

  const hasUnpublishedItems = optionalItems.length < 4;

  return (
    <div className={`rounded-2xl border border-navy/[0.09] bg-white p-6 sm:p-7 ${className}`}>
      <h2 className="font-display text-lg font-bold text-navy mb-4">会場のご案内</h2>
      <dl className="space-y-4 text-[15px] text-ink leading-[1.8]">
        <div>
          <dt className="font-bold text-muted text-[13px]">会場</dt>
          <dd>
            {config.venueName}
            <br />
            {config.venueAddress}
            {mapUrl && (
              <>
                <br />
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-teal/30 bg-teal-soft px-4 font-bold text-teal-dark hover:brightness-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  地図を開く（別タブ）
                </a>
              </>
            )}
          </dd>
        </div>

        {optionalItems.map((item) => (
          <div key={item.label}>
            <dt className="font-bold text-muted text-[13px]">{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}

        <div>
          <dt className="font-bold text-muted text-[13px]">当日の受付方法</dt>
          <dd>{config.venueChecklist}</dd>
        </div>
      </dl>

      {hasUnpublishedItems && (
        <p className="mt-5 rounded-xl bg-cream px-4 py-3.5 text-[14px] text-ink leading-[1.8]">
          アクセス・入口・駐車場・バリアフリーに関する詳しいご案内は、準備でき次第このページに掲載します。
          お急ぎの場合は
          <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
            {config.supportEmail}
          </a>
          {config.supportPhone && `（電話: ${config.supportPhone}）`}
          までお問い合わせください。
        </p>
      )}
    </div>
  );
}
