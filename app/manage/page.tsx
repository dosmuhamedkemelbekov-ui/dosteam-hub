import { requireDosteamUser } from "../dosteam-auth";
import { notFound } from "next/navigation";
import { hubEnv } from "../api/_lib";
import ManageClient from "./manage-client";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const user = await requireDosteamUser("/manage");
  const db = hubEnv.DB;
  if (!db) notFound();

  const account = await db.prepare("SELECT role,status FROM users WHERE id=? LIMIT 1").bind(user.id).first<{ role:string; status:string }>();
  if (account?.role !== "admin" || account.status !== "active") notFound();

  return <ManageClient signedInName={user.displayName} signedInEmail={user.email} />;
}
