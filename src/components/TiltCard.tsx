"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import clsx from "clsx";

/**
 * マウスの位置に合わせて少し傾き、光沢が映り込むカード。
 * タッチ端末や「視差効果を減らす」設定の場合は傾けない。
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
    el.style.setProperty("--glare", "1");
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--glare", "0");
  }

  return (
    <div style={{ perspective: "1100px" }} className="w-full flex justify-center">
      <div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={clsx("relative transition-transform duration-300 ease-out will-change-transform", className)}
        style={{
          transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        {children}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: "var(--glare, 0)",
            background:
              "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.28), transparent 55%)",
            mixBlendMode: "soft-light",
          }}
        />
      </div>
    </div>
  );
}
