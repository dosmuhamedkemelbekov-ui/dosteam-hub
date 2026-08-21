import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) return Response.json({ events: [], clubs: [], rooms: [], leaderboard: [], summary: {} });
  try {
    const [events, clubs, rooms, leaderboard, summary] = await Promise.all([
      db.prepare("SELECT e.id,e.title,e.description,e.category,e.starts_at,e.ends_at,e.capacity,e.xp_reward,e.coin_reward,e.place_text,c.name club_name,COUNT(r.id) registered FROM events e LEFT JOIN clubs c ON c.id=e.club_id LEFT JOIN registrations r ON r.event_id=e.id WHERE e.status='published' AND e.ends_at>? GROUP BY e.id ORDER BY e.starts_at LIMIT 30").bind(Date.now()).all(),
      db.prepare("SELECT c.id,c.name,c.description,c.direction,c.instagram,c.telegram,COUNT(DISTINCT f.user_id) followers,COUNT(DISTINCT m.user_id) members FROM clubs c LEFT JOIN club_follows f ON f.club_id=c.id LEFT JOIN club_memberships m ON m.club_id=c.id AND m.status='approved' WHERE c.status='active' GROUP BY c.id ORDER BY members DESC,c.name LIMIT 30").all(),
      db.prepare("SELECT id,name,capacity,location,equipment_json FROM rooms WHERE is_active=1 ORDER BY name LIMIT 50").all(),
      db.prepare("SELECT p.user_id,p.full_name,p.group_name,p.faculty,p.xp,p.avatar_url,COALESCE(l.name_ru,'Новичок') level_name,COUNT(ua.achievement_id) achievements FROM profiles p JOIN users u ON u.id=p.user_id LEFT JOIN levels l ON l.id=p.level_id LEFT JOIN user_achievements ua ON ua.user_id=p.user_id AND ua.unlocked_at IS NOT NULL WHERE u.status='active' AND p.is_public=1 GROUP BY p.user_id ORDER BY p.xp DESC,p.full_name LIMIT 100").all(),
      db.prepare("SELECT (SELECT COUNT(*) FROM users WHERE role='student' AND status='active') students,(SELECT COUNT(*) FROM clubs WHERE status='active') clubs,(SELECT COUNT(*) FROM events WHERE status IN ('published','completed')) events,(SELECT COUNT(*) FROM registrations WHERE status='attended') attended").first(),
    ]);
    return Response.json({ events: events.results, clubs: clubs.results, rooms: rooms.results, leaderboard: leaderboard.results, summary }, { headers: { "cache-control":"private, no-store" } });
  } catch {
    return Response.json({ events: [], clubs: [], rooms: [], leaderboard: [], summary: {} }, { headers: { "cache-control": "no-store" } });
  }
}
