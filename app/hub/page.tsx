import { redirect } from "next/navigation";
import HubApp, { type HubIdentity } from "../hub";
import { requireDosteamUser } from "../dosteam-auth";
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
  level_min_xp: number | null;
  next_level_name: string | null;
  next_level_xp: number | null;
  role: string;
};

export default async function HubPage() {
  const auth = await requireDosteamUser("/hub");
  const db = hubEnv.DB;
  if (!db) redirect("/join");

  const profile = await db.prepare(
    `SELECT p.full_name,p.group_name,p.faculty,p.avatar_url,p.xp,p.coin_balance,
            l.name_ru level_name,l.min_xp level_min_xp,u.role,
            (SELECT nl.name_ru FROM levels nl WHERE nl.is_active=1 AND nl.rank>COALESCE(l.rank,0) ORDER BY nl.rank LIMIT 1) next_level_name,
            (SELECT nl.min_xp FROM levels nl WHERE nl.is_active=1 AND nl.rank>COALESCE(l.rank,0) ORDER BY nl.rank LIMIT 1) next_level_xp
       FROM users u
       JOIN profiles p ON p.user_id=u.id
       LEFT JOIN levels l ON l.id=p.level_id
      WHERE u.id=? AND u.status='active'
      LIMIT 1`,
  ).bind(auth.id).first<ProfileRow>();

  if (!profile) redirect("/join");

  const identity: HubIdentity = {
    userId: auth.id,
    fullName: profile.full_name,
    firstName: profile.full_name.trim().split(/\s+/)[0] || profile.full_name,
    initials: profile.full_name.trim().split(/\s+/).map((part:string) => part[0]).slice(0, 2).join("").toUpperCase(),
    groupName: profile.group_name,
    faculty: profile.faculty || "ЕАГИ",
    avatarUrl: profile.avatar_url,
    xp: Number(profile.xp || 0),
    coins: Number(profile.coin_balance || 0),
    levelName: profile.level_name || "Новичок",
    levelMinXp: Number(profile.level_min_xp || 0),
    nextLevelName: profile.next_level_name,
    nextLevelXp: profile.next_level_xp === null ? null : Number(profile.next_level_xp),
    role: profile.role || "student",
  };

  return <HubApp identity={identity} />;
}
