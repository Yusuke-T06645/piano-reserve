"use client";

import { useEffect, useRef, useState } from "react";
import { Card, Button, Alert, Badge, Label } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";
import type { Html5Qrcode } from "html5-qrcode";

type ReservationView = {
  id: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  ageCategory: string;
};

type LookupResult =
  | { reservation: ReservationView; needsConfirmation: true }
  | { reservation: ReservationView; alreadyProcessed: true; message: string }
  | { reservation: ReservationView; checkedIn: true };

export function CheckinScanner() {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader-region";

  function extractToken(raw: string): string | null {
    try {
      const url = new URL(raw);
      const t = url.searchParams.get("token");
      if (t) return t;
    } catch {
      // rawがURLでない場合はそのままトークンとして扱う
    }
    return raw.trim() || null;
  }

  async function lookup(token: string, confirm = false) {
    setError(null);
    setBusy(true);
    setLastToken(token);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "読み取りに失敗しました。");
        setResult(null);
        return;
      }
      setResult(data);
    } finally {
      setBusy(false);
    }
  }

  async function startScan() {
    setScanning(true);
    setError(null);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        async (decodedText: string) => {
          await stopScan();
          const token = extractToken(decodedText);
          if (token) await lookup(token);
        },
        () => {}
      );
    } catch {
      setError("カメラを起動できませんでした。カメラへのアクセスを許可するか、下の欄にQR内のコードを直接ご入力ください。");
      setScanning(false);
    }
  }

  async function stopScan() {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {
      // ignore
    }
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <p className="text-sm text-muted mb-4">
          利用者が提示するQRコードをカメラで読み取ってください。カメラが使えない場合は、下の欄にQRコード内のトークンを直接入力しても照合できます。
        </p>
        <div id={regionId} className="mx-auto max-w-sm rounded-xl overflow-hidden bg-black/5 aspect-square" />
        <div className="mt-4 flex gap-3 justify-center">
          {!scanning ? (
            <Button onClick={startScan}>カメラでQRを読み取る</Button>
          ) : (
            <Button variant="ghost" onClick={stopScan}>
              読み取りを停止
            </Button>
          )}
        </div>

        <div className="mt-6 border-t border-black/10 pt-4">
          <Label htmlFor="manual">手入力で照合（トークン/URL）</Label>
          <div className="flex gap-2">
            <input
              id="manual"
              className="flex-1 rounded-lg border border-black/10 px-3 py-2.5 text-sm"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="例: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
            <Button
              variant="outline"
              disabled={busy || !manualInput}
              onClick={() => {
                const token = extractToken(manualInput);
                if (token) lookup(token);
              }}
            >
              照合する
            </Button>
          </div>
        </div>
      </Card>

      {error && <Alert tone="danger">{error}</Alert>}

      {result && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted">予約番号 {result.reservation.id}</p>
            {"checkedIn" in result && <Badge tone="success">来場確認完了</Badge>}
            {"alreadyProcessed" in result && <Badge tone="warning">対応済み</Badge>}
            {"needsConfirmation" in result && <Badge tone="info">要確認</Badge>}
          </div>
          <p className="text-xl font-bold text-navy">{result.reservation.name} 様</p>
          <p className="text-muted">
            {formatJapaneseDate(result.reservation.date)} {result.reservation.slotStart}〜{result.reservation.slotEnd}
            {result.reservation.ageCategory === "minor" && "（未成年・保護者同伴要確認）"}
          </p>

          {"needsConfirmation" in result && (
            <div className="mt-5">
              <Button size="lg" disabled={busy || !lastToken} onClick={() => lastToken && lookup(lastToken, true)}>
                この内容で来場確認する
              </Button>
            </div>
          )}
          {"alreadyProcessed" in result && <p className="mt-3 text-sm text-muted">{result.message}</p>}
        </Card>
      )}
    </div>
  );
}
