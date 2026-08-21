import { cookies } from "next/headers";
import { createDosteamSession, safeReturnTo } from "../../../dosteam-auth";
import { authErrorMessage, supabaseAuthClient } from "../../../supabase-auth";

export const dynamic = "force-dynamic";

function clearPending(jar: Awaited<ReturnType<typeof cookies>>) {
  for (const name of ["dosteam_pending_access","dosteam_pending_refresh","dosteam_pending_user","dosteam_pending_return"])
    jar.set(name,"",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string,unknown>;
  const code = String(body.code || "").replace(/\s/g, "");
  const factorId = String(body.factorId || "");
  const challengeId = String(body.challengeId || "");
  const jar = await cookies();
  const accessToken = jar.get("dosteam_pending_access")?.value;
  const refreshToken = jar.get("dosteam_pending_refresh")?.value;
  const userId = jar.get("dosteam_pending_user")?.value;
  if (!accessToken || !refreshToken || !userId) return Response.json({ error:"Сессия подтверждения истекла. Войдите снова" }, { status:401 });
  if (!/^\d{6}$/.test(code) || !factorId || !challengeId) return Response.json({ error:"Введите 6-значный код" }, { status:400 });
  try {
    const supabase = supabaseAuthClient();
    const { error:setError } = await supabase.auth.setSession({ access_token:accessToken, refresh_token:refreshToken });
    if (setError) throw setError;
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) return Response.json({ error:"Неверный или устаревший код" }, { status:401 });
    await createDosteamSession(userId, true);
    const returnTo = safeReturnTo(jar.get("dosteam_pending_return")?.value || "/manage");
    clearPending(jar);
    return Response.json({ ok:true, returnTo: returnTo === "/join" ? "/manage" : returnTo });
  } catch (error) {
    return Response.json({ error:authErrorMessage(error instanceof Error ? error.message : "mfa failed") }, { status:400 });
  }
}

