import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) return Response.json({ events: [], clubs: [], rooms: [], summary: {} });
  try {
    const [events, clubs, rooms, summary] = await Promise.all([
      db.prepare("SELECT e.id,e.title,e.description,e.category,e.starts_at,e.ends_at,e.capacity,e.xp_reward,e.coin_reward,e.place_text,c.name club_name,COUNT(r.id) registered FROM events e LEFT JOIN clubs c ON c.id=e.club_id LEFT JOIN registrations r ON r.event_id=e.id WHERE e.status='published' AND e.ends_at>? GROUP BY e.id ORDER BY e.starts_at LIMIT 30").bind(Date.now()).all(),
      db.prepare("SELECT c.id,c.name,c.description,c.direction,c.instagram,c.telegram,COUNT(DISTINCT f.user_id) followers,COUNT(DISTINCT m.user_id) members FROM clubs c LEFT JOIN club_follows f ON f.club_id=c.id LEFT JOIN club_memberships m ON m.club_id=c.id AND m.status='approved' WHERE c.status='active' GROUP BY c.id ORDER BY members DESC,c.name LIMIT 30").all(),
      db.prepare("SELECT id,name,capacity,location,equipment_json FROM rooms WHERE is_active=1 ORDER BY name LIMIT 50").all(),
      db.prepare("SELECT (SELECT COUNT(*) FROM users WHERE role='student' AND status='active') students,(SELECT COUNT(*) FROM clubs WHERE status='active') clubs,(SELECT COUNT(*) FROM events WHERE status IN ('published','completed')) events,(SELECT COUNT(*) FROM registrations WHERE status='attended') attended").first(),
    ]);
    return Response.json({ events: events.results, clubs: clubs.results, rooms: rooms.results, summary }, { headers: { "cache-control": "public, max-age=30" } });
  } catch {
    return Response.json({ events: [], clubs: [], rooms: [], summary: {} }, { headers: { "cache-control": "no-store" } });
  }
}
