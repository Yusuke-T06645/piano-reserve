"use client";

import { useRef, useState, type KeyboardEvent } from "react";

/** 1オクターブ分(ド〜高いド)の鍵盤。freq はHz。 */
const WHITE_KEYS = [
  { name: "ド", freq: 261.63 },
  { name: "レ", freq: 293.66 },
  { name: "ミ", freq: 329.63 },
  { name: "ファ", freq: 349.23 },
  { name: "ソ", freq: 392.0 },
  { name: "ラ", freq: 440.0 },
  { name: "シ", freq: 493.88 },
  { name: "ド", freq: 523.25 },
];

/** 黒鍵。after は直前の白鍵のインデックス。 */
const BLACK_KEYS = [
  { name: "ド♯", freq: 277.18, after: 0 },
  { name: "レ♯", freq: 311.13, after: 1 },
  { name: "ファ♯", freq: 369.99, after: 3 },
  { name: "ソ♯", freq: 415.3, after: 4 },
  { name: "ラ♯", freq: 466.16, after: 5 },
];

const NOTE_GLYPHS = ["♪", "♫", "♩", "♬"];

type FloatingNote = { id: number; left: number; glyph: string; x: number; r: number };

/**
 * ヒーローに置く「触れると音が鳴る」ミニ鍵盤。
 * 音は Web Audio API で合成しており、利用者が鍵盤に触れたときだけ鳴る。
 */
export function MiniKeyboard() {
  const ctxRef = useRef<AudioContext | null>(null);
  const idRef = useRef(0);
  const [active, setActive] = useState<string | null>(null);
  const [notes, setNotes] = useState<FloatingNote[]>([]);

  function play(freq: number, keyId: string, leftPercent: number) {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current ??= new Ctx();
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const now = ctx.currentTime;

      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(0.32, now + 0.012);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 6, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 1.2);
      filter.connect(out).connect(ctx.destination);

      // 基音 + 倍音を少し重ねて、ピアノらしい柔らかい響きにする
      [
        { type: "triangle" as const, mult: 1, gain: 0.7 },
        { type: "sine" as const, mult: 2, gain: 0.25 },
        { type: "sine" as const, mult: 3, gain: 0.08 },
      ].forEach(({ type, mult, gain }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq * mult, now);
        g.gain.value = gain;
        osc.connect(g).connect(filter);
        osc.start(now);
        osc.stop(now + 1.9);
      });
    } catch {
      // 音が出せない環境でも見た目の反応だけは返す
    }

    setActive(keyId);
    window.setTimeout(() => setActive((cur) => (cur === keyId ? null : cur)), 160);

    const id = ++idRef.current;
    const note: FloatingNote = {
      id,
      left: leftPercent,
      glyph: NOTE_GLYPHS[id % NOTE_GLYPHS.length],
      // 押すたびに少しずつ違う方向へ飛ばす(乱数を使わず番号から決める)
      x: ((id * 37) % 50) - 25,
      r: ((id * 53) % 50) - 25,
    };
    setNotes((prev) => [...prev.slice(-8), note]);
    window.setTimeout(() => setNotes((prev) => prev.filter((n) => n.id !== id)), 1300);
  }

  function onKey(e: KeyboardEvent, freq: number, keyId: string, left: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!e.repeat) play(freq, keyId, left);
    }
  }

  const whiteWidth = 100 / WHITE_KEYS.length;

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[520px]">
      <p className="mb-2.5 flex items-center justify-center gap-2 text-[13px] font-bold tracking-wide text-gold-light">
        <span aria-hidden>♪</span>
        鍵盤にふれてみてください（音が出ます）
      </p>
      <div
        role="group"
        aria-label="ミニ鍵盤（押すと音が鳴ります）"
        className="relative h-24 sm:h-28 select-none touch-manipulation rounded-xl border border-gold-light/30 bg-navy-dark/70 p-1.5 shadow-hero backdrop-blur-sm"
      >
        <div className="relative h-full">
          {WHITE_KEYS.map((k, i) => {
            const keyId = `w${i}`;
            const left = i * whiteWidth + whiteWidth / 2;
            return (
              <button
                key={keyId}
                type="button"
                aria-label={k.name}
                data-active={active === keyId}
                onPointerDown={() => play(k.freq, keyId, left)}
                onKeyDown={(e) => onKey(e, k.freq, keyId, left)}
                className="mini-key absolute top-0 bottom-0 rounded-b-md border-x border-navy/15 bg-linear-to-b from-white to-[#f3efe6] shadow-[inset_0_-6px_0_rgba(0,0,0,0.06)] hover:to-gold-soft data-[active=true]:from-gold-soft data-[active=true]:to-gold-light data-[active=true]:shadow-none"
                style={{ left: `${i * whiteWidth}%`, width: `${whiteWidth}%` }}
              >
                <span className="absolute inset-x-0 bottom-1.5 text-center text-[10px] font-bold text-muted/80">{k.name}</span>
              </button>
            );
          })}
          {BLACK_KEYS.map((k, i) => {
            const keyId = `b${i}`;
            const center = (k.after + 1) * whiteWidth;
            const width = whiteWidth * 0.6;
            return (
              <button
                key={keyId}
                type="button"
                aria-label={k.name}
                data-active={active === keyId}
                onPointerDown={() => play(k.freq, keyId, center)}
                onKeyDown={(e) => onKey(e, k.freq, keyId, center)}
                className="mini-key absolute top-0 z-10 h-[60%] rounded-b-md bg-linear-to-b from-[#2a2a2a] to-black shadow-[0_3px_6px_rgba(0,0,0,0.45)] hover:from-[#3a3a3a] data-[active=true]:from-teal-dark data-[active=true]:to-navy-dark"
                style={{ left: `${center - width / 2}%`, width: `${width}%` }}
              />
            );
          })}
        </div>
        {notes.map((n) => (
          <span
            key={n.id}
            aria-hidden
            className="key-note pointer-events-none absolute top-0 text-2xl font-bold text-gold-light drop-shadow"
            style={
              {
                left: `${n.left}%`,
                "--note-x": `${n.x}px`,
                "--note-r": `${n.r}deg`,
              } as React.CSSProperties
            }
          >
            {n.glyph}
          </span>
        ))}
      </div>
    </div>
  );
}
