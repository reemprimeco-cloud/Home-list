import { NextResponse } from "next/server";

/**
 * Deliberately does no Supabase/auth/DB work — its only job is to be a
 * cheap target for the keep-warm workflow (.github/workflows/keep-warm.yml)
 * to hit every few minutes, so the Node.js serverless function stays warm
 * against Vercel Hobby-tier cold starts instead of exercising real backend
 * load on every ping.
 */
export function GET() {
  return NextResponse.json({ ok: true });
}
