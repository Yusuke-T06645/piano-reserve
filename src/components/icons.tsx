"use client";

import type { ComponentProps, ReactNode, SVGProps } from "react";
import { Icon } from "@astryxdesign/core/Icon";

/**
 * サイト独自のアイコン集。
 * 画面では <SiteIcon name="musicNote" size="sm" /> のように名前で指定する。
 * 中身は Astryx の Icon なので、大きさ・色は Icon と同じ size / color で指定できる。
 * （サーバーコンポーネントからも使えるよう、アイコン本体ではなく名前を受け取る）
 * Astryx の標準アイコン（check / chevronRight など）で足りるものは <Icon icon="check" /> を直接使う。
 * 線の太さや形を変えるときは、このファイルだけを直せば全画面に反映される。
 */
function outline(children: ReactNode, strokeWidth = 1.8) {
  function OutlineIcon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        {...props}
      >
        {children}
      </svg>
    );
  }
  return OutlineIcon;
}

/** 音符（ロゴ・見出し飾り） */
export const MusicNoteIcon = outline(
  <>
    <path d="M9 18V5l10-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </>
);

/** メール */
export const MailIcon = outline(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </>
);

/** 地図のピン */
export const MapPinIcon = outline(
  <>
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </>
);

/** 人物（管理者アカウント） */
export const UserIcon = outline(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </>
);

/** 右向き矢印（次へ進む） */
export const ArrowRightIcon = outline(<path d="M5 12h14M13 6l6 6-6 6" />, 2.2);

/** 左向き矢印（戻る） */
export const ArrowLeftIcon = outline(<path d="M19 12H5M11 18l-6-6 6-6" />, 2.2);

/** カレンダー */
export const CalendarIcon = outline(
  <>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </>
);

/** カレンダーに追加 */
export const CalendarAddIcon = outline(
  <>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18M12 13v6M9 16h6" />
  </>
);

/** 休止日（カレンダー＋禁止マーク） */
export const CalendarBlockIcon = outline(
  <>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M8 3v4M16 3v4M3 10h18" />
    <circle cx="15.5" cy="15.5" r="3.2" />
    <path d="M13.8 13.8l3.4 3.4" />
  </>
);

/** 時計 */
export const ClockIcon = outline(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </>
);

/** 円（無料の表示に使う円記号） */
export const YenIcon = outline(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 6l3 5 3-5M12 11v7M9 13h6M9 16h6" />
  </>
);

/** 編集（日時の変更） */
export const EditIcon = outline(
  <>
    <path d="M4 20h4l10-10-4-4L4 16v4z" />
    <path d="M13 7l4 4" />
  </>
);

/** 取り消し（丸の中に×） */
export const CancelIcon = outline(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </>
);

/** ダウンロード */
export const DownloadIcon = outline(<path d="M12 3v13m0 0l-4-4m4 4l4-4M4 20h16" />);

/** つまみ（時間帯の範囲を動かすハンドル） */
export const GripIcon = outline(<path d="M9 5v14M15 5v14" />, 2.2);

/** ダッシュボード（4つの四角） */
export const DashboardIcon = outline(
  <>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </>
);

/** QRコードの読み取り枠 */
export const ScanIcon = outline(
  <>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </>
);

const SITE_ICONS = {
  musicNote: MusicNoteIcon,
  mail: MailIcon,
  mapPin: MapPinIcon,
  user: UserIcon,
  arrowRight: ArrowRightIcon,
  arrowLeft: ArrowLeftIcon,
  calendar: CalendarIcon,
  calendarAdd: CalendarAddIcon,
  calendarBlock: CalendarBlockIcon,
  clock: ClockIcon,
  yen: YenIcon,
  edit: EditIcon,
  cancel: CancelIcon,
  download: DownloadIcon,
  grip: GripIcon,
  dashboard: DashboardIcon,
  scan: ScanIcon,
} as const;

export type SiteIconName = keyof typeof SITE_ICONS;

export function SiteIcon({
  name,
  ...props
}: { name: SiteIconName } & Omit<ComponentProps<typeof Icon>, "icon">) {
  return <Icon icon={SITE_ICONS[name]} {...props} />;
}
