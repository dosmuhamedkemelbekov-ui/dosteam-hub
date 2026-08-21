import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../chatgpt-auth";

export type HubEnv = { DB?: D1Database; BUCKET?: R2Bucket; DOSTEAM_OWNER_EMAIL?: string };
export const hubEnv = env as unknown as HubEnv;
export const apiJson = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

export async function currentUser() {
  const auth = await getChatGPTUser();
  if (!auth || !hubEnv.DB) return { auth, user: null, db: hubEnv.DB };
  const user = await hubEnv.DB.prepare("SELECT id,email,role,status FROM users WHERE email=? LIMIT 1").bind(auth.email.toLowerCase()).first<{ id:string;email:string;role:string;status:string }>();
  return { auth, user, db: hubEnv.DB };
}

export async function requireHubUser(roles?: string[]) {
  const ctx = await currentUser();
  if (!ctx.auth) return { error: apiJson({ error:"Требуется вход" },401) } as const;
  if (!ctx.db) return { error: apiJson({ error:"База данных недоступна" },503) } as const;
  if (!ctx.user) return { error: apiJson({ error:"Сначала создайте профиль", onboarding:true },403) } as const;
  if (ctx.user.status !== "active") return { error: apiJson({ error:"Профиль заблокирован" },403) } as const;
  if (roles && !roles.includes(ctx.user.role)) return { error: apiJson({ error:"Недостаточно прав" },403) } as const;
  return ctx;
}

export function cleanText(value: unknown, max = 2000) {
  return String(value ?? "").trim().slice(0,max);
}

export function makeTicketCode() {
  return `DST-${crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase()}`;
}
