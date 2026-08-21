import { redirect } from "next/navigation";
import HubApp, { type HubIdentity } from "../hub";
import { requireChatGPTUser } from "../chatgpt-auth";
import { hubEnv } from "../api/_lib";

export const dynamic = "force-dynamic";

type ProfileRow = {
  full_name: string;
  group_name: string;
  faculty: string | null;
  avatar_url: string | null;
  xp: number;
  coin_balance: number;
  level_name: string | null;
  role: string;
};

export default async function HubPage() {
  const auth = await requireChatGPTUser("/hub");
  const db = hubEnv.DB;
  if (!db) redirect("/join");

  const profile = await db.prepare(
    `SELECT p.full_name,p.group_name,p.faculty,p.avatar_url,p.xp,p.coin_balance,
            l.name_ru level_name,u.role
       FROM users u
       JOIN profiles p ON p.user_id=u.id
       LEFT JOIN levels l ON l.id=p.level_id
      WHERE u.email=? AND u.status='active'
      LIMIT 1`,
  ).bind(auth.email.toLowerCase()).first<ProfileRow>();

  if (!profile) redirect("/join");

  const identity: HubIdentity = {
    fullName: profile.full_name,
    firstName: profile.full_name.trim().split(/\s+/)[0] || profile.full_name,
    initials: profile.full_name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
    groupName: profile.group_name,
    faculty: profile.faculty || "ЕАГИ",
    avatarUrl: profile.avatar_url,
    xp: Number(profile.xp || 0),
    coins: Number(profile.coin_balance || 0),
    levelName: profile.level_name || "Новичок",
    role: profile.role || "student",
  };

  return <HubApp identity={identity} />;
}
