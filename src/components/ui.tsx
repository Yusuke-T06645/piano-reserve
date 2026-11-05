import { ButtonHTMLAttributes, HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

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
        <p className="text-[14px] font-medium text-gold-ink mb-2">{eyebrow}</p>
      )}
      <h1 className="font-display text-[28px] sm:text-[32px] font-medium leading-[1.3] text-navy">{title}</h1>
      {description && <p className="mt-3 text-[15px] text-muted leading-relaxed">{description}</p>}
    </div>
  );
}

const buttonVariants = {
  primary: "bg-teal-dark text-white hover:bg-navy disabled:bg-muted/40",
  secondary: "bg-navy text-white hover:bg-navy-dark disabled:bg-muted/40",
  gold: "bg-gold text-navy-dark hover:bg-gold-light disabled:bg-muted/40",
  outline: "border border-navy/25 bg-white text-navy hover:border-navy/50 hover:bg-cream disabled:opacity-40",
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
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        size === "lg" && "min-h-12 min-w-11 px-6 py-3 text-base",
        size === "md" && "min-h-11 min-w-11 px-5 py-2 text-[15px]",
        size === "sm" && "min-h-11 min-w-11 px-4 py-2 text-[14px]",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-[15px] font-medium text-navy mb-2" {...props} />;
}

/** 入力エラーは該当欄の直下に、原因と直し方がわかる文言で表示する */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 flex items-start gap-2 text-[14px] font-medium text-danger leading-[1.7]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-1 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-navy-soft text-muted",
    success: "bg-success-soft text-success",
    warning: "bg-gold-soft text-gold-ink",
    danger: "bg-danger-soft text-danger",
    info: "bg-teal-soft text-teal-dark",
  };
  const dotTones: Record<string, string> = {
    neutral: "bg-muted",
    success: "bg-success",
    warning: "bg-gold",
    danger: "bg-danger",
    info: "bg-teal-dark",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-md px-2 py-1 text-[13px] font-medium",
        tones[tone]
      )}
    >
      <span aria-hidden className={clsx("h-1.5 w-1.5 rounded-full", dotTones[tone])} />
      {children}
    </span>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "border-teal/20 bg-teal-soft text-teal-dark",
    success: "border-success/25 bg-success-soft text-success",
    warning: "border-gold/40 bg-gold-soft text-navy",
    danger: "border-danger/25 bg-danger-soft text-danger",
  };
  return (
    <div role="status" className={clsx("rounded-xl border px-5 py-4 text-[15px] leading-[1.8]", tones[tone])}>
      {title && <p className="font-medium mb-1">{title}</p>}
      {children}
    </div>
  );
}

/**
 * 予約導線（日付→時間→情報入力）の3ステップ進捗表示。
 * スマートフォンでも見出しが省略されないよう短い表記にし、
 * 現在地・完了は色だけでなく形（チェックマーク・下線）とテキストでも区別する。
 */
export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "日付" },
    { n: 2, label: "時間" },
    { n: 3, label: "情報入力" },
  ];
  return (
    <nav aria-label="予約の進行状況" className="mb-8 sm:mb-12">
      <ol className="flex items-center gap-0 max-w-xl">
        {steps.map((step, i) => {
          const done = step.n < current;
          const active = step.n === current;
          return (
            <li
              key={step.n}
              aria-current={active ? "step" : undefined}
              className={clsx("flex items-center min-w-0", i < steps.length - 1 && "flex-1")}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  aria-hidden
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-medium tabular-nums",
                    done && "bg-teal text-white",
                    active && "bg-navy text-white",
                    !done && !active && "border border-navy/25 bg-white text-muted"
                  )}
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                  ) : (
                    step.n
                  )}
                </span>
                <span
                  className={clsx(
                    "text-[14px] leading-tight",
                    active && "font-medium text-navy underline decoration-1 underline-offset-[6px]",
                    done && "text-navy",
                    !done && !active && "text-muted"
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {done ? "（完了）" : active ? "（現在のステップ）" : "（未完了）"}
                  </span>
                </span>
              </span>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={clsx("h-px flex-1 mx-2 sm:mx-3 min-w-2", done ? "bg-teal" : "bg-navy/20")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
