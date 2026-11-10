"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { Theme } from "@astryxdesign/core/theme";
import { LinkProvider } from "@astryxdesign/core/Link";
import { themes, defaultThemeSlug } from "../astryx-themes";

/**
 * Astryx のテーマ(src/themes/piano)をアプリ全体に適用する。
 * テーマの組み立てはクライアント側の関数を使うため、サーバーコンポーネントの layout から切り離している。
 * Astryx 部品内のリンクは Next.js の Link で遷移させる。サイトはライトモードのみで運用する。
 */
export function AppTheme({ children }: { children: ReactNode }) {
  return (
    <Theme theme={themes[defaultThemeSlug]} mode="light">
      <LinkProvider component={NextLink}>{children}</LinkProvider>
    </Theme>
  );
}
