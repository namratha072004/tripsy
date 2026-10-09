import { db } from "@/lib/db";

// Hit daily by Vercel Cron (see vercel.json). Supabase's free plan pauses a
// project after ~7 days without database activity; one tiny read a day keeps
// Tripsy awake. Returns no trip data.
export async function GET() {
  const { error } = await db().from("trips").select("id", { head: true, count: "exact" }).limit(1);
  if (error) {
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
  return Response.json({ ok: true, at: new Date().toISOString() });
}
