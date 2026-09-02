import { ButtonHTMLAttributes, HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mx-auto max-w-5xl px-4 sm:px-6", className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-2xl border border-black/5 bg-white p-5 sm:p-6 shadow-sm", className)}
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
      {eyebrow && <p className="text-xs font-semibold tracking-widest text-gold uppercase mb-1">{eyebrow}</p>}
      <h1 className="text-2xl sm:text-3xl font-bold text-navy">{title}</h1>
      {description && <p className="mt-2 text-muted leading-relaxed">{description}</p>}
    </div>
  );
}

const buttonVariants = {
  primary: "bg-teal text-white hover:bg-teal-dark disabled:bg-muted/40",
  secondary: "bg-navy text-white hover:bg-navy-dark disabled:bg-muted/40",
  outline: "border-2 border-navy text-navy hover:bg-navy hover:text-white disabled:opacity-40",
  ghost: "text-navy hover:bg-cream",
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
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed",
        size === "lg" && "px-7 py-3.5 text-base",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "sm" && "px-3.5 py-1.5 text-xs",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-sm font-semibold text-navy mb-1.5" {...props} />;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger flex items-center gap-1">
      <span aria-hidden>⚠</span> {children}
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
    neutral: "bg-cream text-navy",
    success: "bg-success/10 text-success",
    warning: "bg-gold/20 text-navy",
    danger: "bg-danger/10 text-danger",
    info: "bg-teal/10 text-teal-dark",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
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
    info: "border-teal/30 bg-teal/5 text-teal-dark",
    success: "border-success/30 bg-success/5 text-success",
    warning: "border-gold/40 bg-gold/10 text-navy",
    danger: "border-danger/30 bg-danger/5 text-danger",
  };
  return (
    <div role="status" className={clsx("rounded-xl border px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      {children}
    </div>
  );
}
