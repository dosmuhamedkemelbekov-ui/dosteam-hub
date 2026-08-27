import { hubEnv } from "../../runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = String(hubEnv.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = String(hubEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const configured = Boolean(url && key);
  let reachable = false;
  let authStatus: number | null = null;

  if (configured) {
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
        headers: { apikey: key },
      });
      reachable = response.ok;
      authStatus = response.status;
    } catch {
      reachable = false;
    }
  }

  return Response.json(
    {
      ok: configured && reachable,
      supabase: { configured, reachable, status: authStatus },
      storage: {
        database: Boolean(hubEnv.DB),
        uploads: Boolean(hubEnv.BUCKET),
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
