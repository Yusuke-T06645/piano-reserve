import { defineTheme } from "@astryxdesign/core/theme";
import { stoneTheme } from "@astryxdesign/theme-stone";

/**
 * ピアノひろばのテーマ。
 * 色の値は src/app/globals.css の :root にあるブランド色と揃えている。
 * サイトはライトモードのみで運用するため、[ライト, ダーク] の組はダーク側も同系色にしている。
 * 変更後は `npx astryx theme build src/themes/piano/pianoTheme.ts` で再ビルドする。
 */
export const pianoTheme = defineTheme({
  name: "piano",
  extends: stoneTheme,
  color: { accent: ["#2e7c8a", "#5fb3bf"], neutralStyle: "warm" },
  typography: {
    scale: { base: 16, ratio: 1.2 },
    body: {
      family: "Zen Kaku Gothic New",
      fallbacks: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif',
    },
    heading: {
      family: "Zen Old Mincho",
      fallbacks: '"Hiragino Mincho ProN", serif',
    },
  },
  // 角丸はサイト既存の値(入力欄 11px・カード 16px 前後)に近づける
  radius: { base: 4, multiplier: 1 },
  tokens: {
    // 本文の行間はサイト既存の 1.8(日本語の読みやすさ優先)に合わせる
    "--text-body-leading": "1.8",
    // 補足文字・バッジが小さくなりすぎないよう、サイトの最小サイズ(補足 14px・バッジ 13px)に合わせる
    "--font-size-sm": "0.875rem",
    "--font-size-xs": "0.8125rem",
    // color.accent から生成される色は少し暗くなるため、ブランドのティールをそのまま使う
    "--color-accent": ["#2e7c8a", "#5fb3bf"],
    "--color-text-primary": ["#221c16", "#f7f3ec"],
    "--color-text-secondary": ["#6e6155", "#c9bfb3"],
    "--color-background-body": ["#ffffff", "#12232e"],
    "--color-background-surface": ["#ffffff", "#1b3a4b"],
    "--color-background-muted": ["#f7f3ec", "#1b3a4b"],
    "--color-background-card": ["#ffffff", "#1b3a4b"],
    "--color-background-popover": ["#ffffff", "#1b3a4b"],
    "--color-border": ["rgba(27, 58, 75, 0.12)", "rgba(240, 222, 184, 0.18)"],
    "--color-success": ["#2f7a51", "#6cc497"],
    "--color-success-muted": ["#eaf5ee", "#1f3b2c"],
    "--color-error": ["#b04b42", "#e58a80"],
    "--color-error-muted": ["#fbede9", "#3d2220"],
    "--color-warning": ["#7d5f33", "#f0deb8"],
    "--color-warning-muted": ["#fbf3e4", "#3a3020"],
    "--color-info": ["#1f5560", "#8fd0d8"],
    "--color-info-muted": ["#e3f1f0", "#16333a"],
  },
  components: {
    // お知らせ(info)はサイトのティール系で表示する(既定は青系)
    banner: {
      // stone テーマは info を青系の変数に向けているので、ティール系に向け直す
      "status:info": {
        "--color-info-muted": "light-dark(#e3f1f0, #16333a)",
        "--color-on-info-muted": "var(--color-info)",
      },
    },
    "banner-icon": {
      "status:info": { color: "var(--color-info)" },
    },
  },
});
