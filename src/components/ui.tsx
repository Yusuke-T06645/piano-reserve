import { ButtonHTMLAttributes, HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Badge as AstryxBadge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Stepper as AstryxStepper, Step } from "@astryxdesign/core/Stepper";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mx-auto max-w-5xl px-4 sm:px-6", className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-navy/[0.09] bg-white p-5 sm:p-6 shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-[13px] font-bold tracking-widest text-gold-ink uppercase mb-1.5">{eyebrow}</p>
      )}
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy">{title}</h1>
      {description && <p className="mt-3 text-[15px] text-muted leading-relaxed">{description}</p>}
    </div>
  );
}

const buttonVariants = {
  primary:
    "bg-linear-to-br from-teal to-teal-dark text-white shadow-[0_8px_18px_-8px_rgba(31,85,96,0.5)] hover:brightness-105 disabled:from-muted/40 disabled:to-muted/40 disabled:shadow-none",
  secondary:
    "bg-linear-to-br from-navy to-navy-dark text-white shadow-[0_12px_24px_-12px_rgba(18,35,46,0.5)] hover:brightness-110 disabled:from-muted/40 disabled:to-muted/40 disabled:shadow-none",
  gold: "bg-linear-to-br from-gold-light to-gold text-navy-dark shadow-[0_16px_30px_-10px_rgba(217,178,126,0.5)] hover:brightness-105 disabled:from-muted/40 disabled:to-muted/40",
  outline: "border-[1.5px] border-navy text-navy hover:bg-navy hover:text-white disabled:opacity-40",
  ghost: "text-navy hover:bg-cream disabled:opacity-40",
  danger: "bg-danger text-white hover:opacity-90 disabled:bg-muted/40",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: "md" | "lg" | "sm";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all disabled:cursor-not-allowed",
        size === "lg" && "min-h-12 min-w-11 px-7 py-4 text-base",
        size === "md" && "min-h-11 min-w-11 px-5 py-2.5 text-[15px]",
        size === "sm" && "min-h-11 min-w-11 px-4 py-2 text-[13px]",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-[15px] font-bold text-navy mb-2" {...props} />;
}

/** 入力エラーは該当欄の直下に、原因と直し方がわかる文言で表示する */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 flex items-start gap-1.5 text-[14px] font-bold text-danger leading-[1.7]">
      <span aria-hidden className="mt-px">⚠</span>
      <span>{children}</span>
    </p>
  );
}

const badgeVariants = {
  neutral: "neutral",
  success: "success",
  warning: "warning",
  danger: "error",
  info: "info",
} as const;

/** 状態を表す小さなラベル。中身は Astryx の Badge（色はテーマ src/themes/piano で管理） */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof badgeVariants;
}) {
  return <AstryxBadge label={children} variant={badgeVariants[tone]} />;
}

const alertStatuses = {
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
} as const;

/**
 * お知らせ枠。中身は Astryx の Banner。
 * Banner 自体は読み上げ用のライブリージョンを持たないため、従来どおり role="status" で包んで、
 * エラーや完了の表示がスクリーンリーダーにも伝わるようにしている。
 * タイトルがないときは本文をタイトル位置に表示する。
 */
export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof alertStatuses;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div role="status">
      <Banner
        status={alertStatuses[tone]}
        collapsible={false}
        title={title ?? children}
        description={title ? children : undefined}
      />
    </div>
  );
}

/**
 * 予約導線（日付→時間→情報入力）の3ステップ進捗表示。中身は Astryx の Stepper。
 * 完了・現在地は色だけでなく形（チェックマーク・番号）と読み上げでも区別される。
 * 画面が狭いときは Stepper が自動で「現在のステップ名」だけの表示に切り替わる。
 */
const STEPS = ["日付", "時間", "情報入力"] as const;

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 sm:mb-12 max-w-xl">
      <AstryxStepper
        activeStep={current - 1}
        label="予約の進行状況"
        horizontalOptions={{ minimumStepWidth: 96, collapsedVariant: "withLabel" }}
      >
        {STEPS.map((label, i) => (
          <Step key={label} step={i} label={label} />
        ))}
      </AstryxStepper>
    </div>
  );
}

/** ヘッダー直下に敷く鍵盤モチーフの区切り線 */
export function PianoKeyDivider() {
  return (
    <div className="piano-key-divider" aria-hidden>
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
