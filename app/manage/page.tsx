import { requireChatGPTUser } from "../chatgpt-auth";
import { notFound } from "next/navigation";
import { hubEnv } from "../api/_lib";
import ManageClient from "./manage-client";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const user = await requireChatGPTUser("/manage");
  const db = hubEnv.DB;
  if (!db) notFound();

  const account = await db.prepare(
    "SELECT role,status FROM users WHERE email=? LIMIT 1",
  ).bind(user.email.toLowerCase()).first<{ role:string; status:string }>();
  const ownerEmail = String(hubEnv.DOSTEAM_OWNER_EMAIL || "").toLowerCase();
  const canBootstrap = !account && ownerEmail === user.email.toLowerCase();
  if (!canBootstrap && (account?.role !== "admin" || account.status !== "active")) notFound();

  return <ManageClient signedInName={user.displayName} signedInEmail={user.email} />;
}
