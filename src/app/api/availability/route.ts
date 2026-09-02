import { NextResponse } from "next/server";
import { getDayAvailability, listBookableDates } from "@/lib/availability";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (date) {
    const slots = await getDayAvailability(date);
    return NextResponse.json({ date, slots });
  }
  const dates = await listBookableDates();
  return NextResponse.json({ dates });
}
