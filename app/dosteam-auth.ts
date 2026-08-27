import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminEmails, hubEnv } from "./runtime";

const SESSION_COOKIE = "dosteam_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;
const ADMIN_TRUST_COOKIE = "dosteam_admin_trust";
const ADMIN_TRUST_AGE_SECONDS = 60 * 60 * 24 * 180;

export type DosteamUser = {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName: string;
};

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getDosteamUser(): Promise<DosteamUser | null> {
  const db = hubEnv.DB;
  if (!db) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const now = Date.now();
  const row = await db.prepare(
    `SELECT u.id,u.email,u.role,u.status,COALESCE(p.full_name,u.email) display_name
       FROM auth_sessions s
       JOIN users u ON u.id=s.user_id
       LEFT JOIN profiles p ON p.user_id=u.id
      WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'
        AND (u.role!='admin' OR s.mfa_verified_at IS NOT NULL)
      LIMIT 1`,
  ).bind(await sha256(token), now).first<{ id:string;email:string;role:string;status:string;display_name:string }>();
  if (!row) return null;
  return { id:row.id, email:row.email, role:row.role, status:row.status, displayName:row.display_name };
}

export async function requireDosteamUser(returnTo: string) {
  const user = await getDosteamUser();
  if (user) return user;
  redirect(`/auth?return_to=${encodeURIComponent(safeReturnTo(returnTo))}`);
}

export async function ensureDosteamAccount(email: string, displayName?: string | null) {
  const db = hubEnv.DB;
  if (!db) throw new Error("База данных недоступна");
  const normalized = email.trim().toLowerCase();
  const shouldBeAdmin = adminEmails().has(normalized);
  let user = await db.prepare("SELECT id,email,role,status FROM users WHERE email=? LIMIT 1").bind(normalized).first<{id:string;email:string;role:string;status:string}>();
  const now = Date.now();
  if (!user) {
    const id = crypto.randomUUID();
    await db.prepare("INSERT INTO users (id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,?,?)")
      .bind(id, normalized, shouldBeAdmin ? "admin" : "student", "active", now, now).run();
    user = { id, email: normalized, role: shouldBeAdmin ? "admin" : "student", status: "active" };
  } else if (shouldBeAdmin && user.role !== "admin") {
    await db.prepare("UPDATE users SET role='admin',updated_at=? WHERE id=?").bind(now,user.id).run();
    user = { ...user, role:"admin" };
  }
  return { ...user, displayName: displayName?.trim() || normalized.split("@")[0] };
}

export async function createDosteamSession(userId: string, mfaVerified: boolean) {
  const db = hubEnv.DB;
  if (!db) throw new Error("База данных недоступна");
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM auth_sessions WHERE expires_at<=?").bind(now),
    db.prepare("INSERT INTO auth_sessions (id,user_id,token_hash,expires_at,created_at,last_seen_at,mfa_verified_at) VALUES (?,?,?,?,?,?,?)")
      .bind(crypto.randomUUID(), userId, await sha256(token), now + SESSION_AGE_SECONDS * 1000, now, now, mfaVerified ? now : null),
  ]);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly:true, secure:true, sameSite:"lax", path:"/", maxAge:SESSION_AGE_SECONDS });
}

export async function rememberAdminDevice(userId: string) {
  const db = hubEnv.DB;
  if (!db) throw new Error("База данных недоступна");
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const now = Date.now();
  await db.prepare("INSERT INTO auth_sessions (id,user_id,token_hash,expires_at,created_at,last_seen_at,mfa_verified_at) VALUES (?,?,?,?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await sha256(token), now + ADMIN_TRUST_AGE_SECONDS * 1000, now, now, now).run();
  (await cookies()).set(ADMIN_TRUST_COOKIE, token, { httpOnly:true, secure:true, sameSite:"lax", path:"/", maxAge:ADMIN_TRUST_AGE_SECONDS });
}

export async function hasTrustedAdminDevice(userId: string) {
  const db = hubEnv.DB;
  const token = (await cookies()).get(ADMIN_TRUST_COOKIE)?.value;
  if (!db || !token) return false;
  const row = await db.prepare(
    `SELECT s.id
       FROM auth_sessions s
       JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=? AND s.user_id=? AND s.expires_at>?
        AND s.mfa_verified_at IS NOT NULL AND u.role='admin' AND u.status='active'
      LIMIT 1`,
  ).bind(await sha256(token), userId, Date.now()).first<{id:string}>();
  if (!row) {
    (await cookies()).set(ADMIN_TRUST_COOKIE, "", { httpOnly:true, secure:true, sameSite:"lax", path:"/", maxAge:0 });
    return false;
  }
  await db.prepare("UPDATE auth_sessions SET last_seen_at=? WHERE id=?").bind(Date.now(), row.id).run();
  return true;
}

export async function destroyDosteamSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && hubEnv.DB) await hubEnv.DB.prepare("DELETE FROM auth_sessions WHERE token_hash=?").bind(await sha256(token)).run();
  jar.set(SESSION_COOKIE, "", { httpOnly:true, secure:true, sameSite:"lax", path:"/", maxAge:0 });
}

export function safeReturnTo(value: unknown) {
  const candidate = String(value || "/join");
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/auth")) return "/join";
  return candidate;
}
