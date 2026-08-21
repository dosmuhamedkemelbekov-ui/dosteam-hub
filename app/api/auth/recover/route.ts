import { authErrorMessage, supabaseAuthClient } from "../../../supabase-auth";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string,unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return Response.json({ error:"Введите Gmail" }, { status:400 });
  try {
    const supabase = supabaseAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo:`${new URL(request.url).origin}/reset` });
    if (error) return Response.json({ error:authErrorMessage(error.message) }, { status:400 });
    return Response.json({ ok:true });
  } catch (error) {
    return Response.json({ error:authErrorMessage(error instanceof Error ? error.message : "recover failed") }, { status:400 });
  }
}

