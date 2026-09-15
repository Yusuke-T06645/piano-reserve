import Image from "next/image";
import { config, venueMapLink } from "@/lib/config";

/** はじめての方が来場の流れを想像できるよう、外観・受付の写真を掲載する */
const PHOTOS = [
  {
    src: "/venue-entrance.jpg",
    width: 1344,
    height: 1008,
    alt: "会社名の看板が立つ本社の外観。手前に来客用駐車場、奥のひさしの下にガラス張りの正面玄関がある。",
    caption: "「株式会社田中組」の看板が目印です。手前が来客用駐車場・駐輪場、奥のひさしの下が正面玄関です。",
  },
  {
    // 掲載用に、ゲストWi-Fiの案内板が写らない範囲へ切り出した写真を使用している
    src: "/venue-reception.jpg",
    width: 790,
    height: 592,
    alt: "1階の受付。台の上に内線呼び出し用の電話機があり、隣に内線番号の案内板が立っている。",
    caption: "受付は無人です。台の上の電話機で内線「9501」（総務部）をお呼び出しください。",
  },
];

/**
 * 会場のご案内。
 * 住所・地図リンク・受付方法は常に表示し、運営で未確認の項目(アクセス・入口・駐車場・バリアフリー)は
 * 推測で埋めずに非表示とし、代わりに問い合わせ先を案内する。
 */
export function VenueInfo({ className = "" }: { className?: string }) {
  const mapUrl = venueMapLink();
  const items = [
    { label: "最寄り駅から", value: config.venueAccess },
    { label: "建物の入口・受付", value: config.venueEntrance },
    { label: "駐車場", value: config.venueParking },
    { label: "段差・車いすでのご来館", value: config.venueAccessibility },
  ];
  const publishedItems = items.filter((item) => item.value.trim().length > 0);
  // 運営で未確認の項目は推測で埋めず、問い合わせ先を案内する
  const pendingItems = items.filter((item) => item.value.trim().length === 0);

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

        {publishedItems.map((item) => (
          <div key={item.label}>
            <dt className="font-bold text-muted text-[13px]">{item.label}</dt>
            <dd className="whitespace-pre-line">{item.value}</dd>
          </div>
        ))}

        <div>
          <dt className="font-bold text-muted text-[13px]">当日の受付方法</dt>
          <dd>{config.venueChecklist}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PHOTOS.map((photo) => (
          <figure key={photo.src}>
            <Image
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 640px) 320px, 100vw"
              className="block w-full h-auto rounded-xl border border-navy/[0.09]"
            />
            <figcaption className="mt-2 text-[14px] leading-[1.7] text-muted">{photo.caption}</figcaption>
          </figure>
        ))}
      </div>

      {pendingItems.length > 0 && (
        <p className="mt-5 rounded-xl bg-cream px-4 py-3.5 text-[14px] text-ink leading-[1.8]">
          {pendingItems.map((item) => item.label).join("・")}
          に関するご案内は、準備でき次第このページに掲載します。 お急ぎの場合は
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
