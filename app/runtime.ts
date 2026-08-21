import { env } from "cloudflare:workers";

export type HubEnv = {
  DB?: D1Database;
  BUCKET?: R2Bucket;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  DOSTEAM_ADMIN_EMAILS?: string;
};

export const hubEnv = env as unknown as HubEnv;

export function adminEmails() {
  return new Set(
    String(hubEnv.DOSTEAM_ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

