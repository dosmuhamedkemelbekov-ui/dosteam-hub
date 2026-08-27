import { cookies } from "next/headers";
import { createDosteamSession, ensureDosteamAccount, hasTrustedAdminDevice, safeReturnTo } from "../../../dosteam-auth";
import { authErrorMessage, supabaseAuthClient } from "../../../supabase-auth";

export const dynamic = "force-dynamic";
const pendingOptions = { httpOnly:true, secure:true, sameSite:"lax" as const, path:"/", maxAge:60 * 10 };

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string,unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return Response.json({ error:"Введите Gmail и пароль" }, { status:400 });
  try {
    const supabase = supabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) return Response.json({ error:authErrorMessage(error?.message || "login failed") }, { status:401 });
    const account = await ensureDosteamAccount(data.user.email || email, String(data.user.user_metadata?.full_name || ""));
    if (account.status !== "active") return Response.json({ error:"Аккаунт заблокирован" }, { status:403 });
    const returnTo = safeReturnTo(body.returnTo);
    if (account.role !== "admin") {
      await createDosteamSession(account.id, false);
      return Response.json({ ok:true, returnTo });
    }
    if (await hasTrustedAdminDevice(account.id)) {
      await createDosteamSession(account.id, true);
      return Response.json({ ok:true, returnTo: returnTo === "/join" ? "/manage" : returnTo });
    }

    const jar = await cookies();
    jar.set("dosteam_pending_access", data.session.access_token, pendingOptions);
    jar.set("dosteam_pending_refresh", data.session.refresh_token, pendingOptions);
    jar.set("dosteam_pending_user", account.id, pendingOptions);
    jar.set("dosteam_pending_return", returnTo, pendingOptions);

    const { data:factors, error:factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const verifiedFactor = factors.totp.find((item) => item.status === "verified");
    let factorId = verifiedFactor?.id || "";
    let qrCode: string | null = null;
    let secret: string | null = null;
    if (!factorId) {
      const { data:enrolled, error:enrollError } = await supabase.auth.mfa.enroll({ factorType:"totp", friendlyName:"DOSTEAM Admin" });
      if (enrollError) throw enrollError;
      factorId = enrolled.id;
      qrCode = enrolled.totp.qr_code;
      secret = enrolled.totp.secret;
    }
    const { data:challenge, error:challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;
    return Response.json({ ok:true, mfaRequired:true, setup:Boolean(qrCode), factorId, challengeId:challenge.id, qrCode, secret });
  } catch (error) {
    return Response.json({ error:authErrorMessage(error instanceof Error ? error.message : "login failed") }, { status:400 });
  }
}
