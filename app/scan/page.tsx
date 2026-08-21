import { requireDosteamUser } from "../dosteam-auth";
import { notFound } from "next/navigation";
import { hubEnv } from "../api/_lib";
import ScanClient from "./scan-client";

export const dynamic = "force-dynamic";
export default async function ScanPage(){
  const auth=await requireDosteamUser("/scan");
  const db=hubEnv.DB;
  if(!db)notFound();
  const user=await db.prepare("SELECT role,status FROM users WHERE id=? LIMIT 1").bind(auth.id).first<{role:string;status:string}>();
  if(!user||user.status!=="active"||!["admin","event_organizer","club_manager"].includes(user.role))notFound();
  return <ScanClient/>;
}
