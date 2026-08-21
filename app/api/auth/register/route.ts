import { authErrorMessage, supabaseAuthClient } from "../../../supabase-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string,unknown>;
  const fullName = String(body.fullName || "").trim().slice(0,120);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!fullName || !email || password.length < 8) return Response.json({ error:"Укажите имя, Gmail и пароль не короче 8 символов" }, { status:400 });
  try {
    const supabase = supabaseAuthClient();
    const origin = new URL(request.url).origin;
    const { data, error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:fullName }, emailRedirectTo:`${origin}/auth?confirmed=1` } });
    if (error) return Response.json({ error:authErrorMessage(error.message) }, { status:400 });
    if (data.user?.identities?.length === 0) return Response.json({ error:"Этот Gmail уже зарегистрирован" }, { status:409 });
    return Response.json({ ok:true, needsConfirmation:!data.session });
  } catch (error) {
    return Response.json({ error:authErrorMessage(error instanceof Error ? error.message : "signup failed") }, { status:400 });
  }
}

