import { getDosteamUser } from "../../dosteam-auth";
import { hubEnv } from "../../runtime";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

async function identity() {
  const auth = await getDosteamUser();
  if (!auth || !hubEnv.DB) return { auth, admin: null, db: hubEnv.DB };
  const admin = await hubEnv.DB.prepare("SELECT id, email, role, status FROM users WHERE id = ? LIMIT 1").bind(auth.id).first<{ id: string; email: string; role: string; status: string }>();
  return { auth, admin, db: hubEnv.DB };
}

async function requireAdmin() {
  const ctx = await identity();
  if (!ctx.auth) return { error: json({ error: "Требуется вход в DOSTEAM HUB" }, 401) };
  if (!ctx.db) return { error: json({ error: "База данных пока не подключена" }, 503) };
  if (!ctx.admin || ctx.admin.role !== "admin" || ctx.admin.status !== "active") return { error: json({ error: "Нет прав администратора" }, 403) };
  return ctx;
}

function value(body: Record<string, unknown>, key: string) {
  const result = String(body[key] ?? "").trim();
  if (!result) throw new Error(`Заполните поле «${key}»`);
  return result;
}

export async function GET() {
  const { auth, admin, db } = await identity();
  if (!auth) return json({ error: "Требуется вход в DOSTEAM HUB" }, 401);
  if (!db) return json({ error: "База данных пока не подключена" }, 503);

  if (!admin) return json({
    authenticated: true,
    email: auth.email,
    name: auth.displayName,
    setupRequired: true,
    canBootstrap: false,
  });
  if (admin.role !== "admin" || admin.status !== "active") return json({ authenticated: true, setupRequired: false, role: admin.role, error: "Нет прав администратора" }, 403);

  const [students, clubs, rooms, events, levels, achievements, rewards, transactions, posts, summary] = await Promise.all([
    db.prepare("SELECT u.id, u.email, u.role, u.status, p.full_name, p.group_name, p.faculty, p.xp, p.coin_balance FROM users u LEFT JOIN profiles p ON p.user_id = u.id ORDER BY u.created_at DESC LIMIT 100").all(),
    db.prepare("SELECT id, name, direction, status, instagram, telegram, created_at FROM clubs ORDER BY created_at DESC LIMIT 100").all(),
    db.prepare("SELECT id, name, capacity, location, equipment_json, is_active FROM rooms ORDER BY name").all(),
    db.prepare("SELECT e.id, e.title, e.category, e.starts_at, e.ends_at, e.capacity, e.status, e.place_text, c.name club_name, COUNT(r.id) registered, SUM(CASE WHEN r.status = 'attended' THEN 1 ELSE 0 END) attended FROM events e LEFT JOIN clubs c ON c.id=e.club_id LEFT JOIN registrations r ON r.event_id=e.id GROUP BY e.id ORDER BY e.starts_at DESC LIMIT 100").all(),
    db.prepare("SELECT id, name_ru, min_xp, rank, is_active FROM levels ORDER BY rank").all(),
    db.prepare("SELECT id, name, description, rule_type, rule_value, xp_reward, coin_reward, is_active FROM achievements ORDER BY name LIMIT 100").all(),
    db.prepare("SELECT id, name, description, cost, stock, image_url, is_active FROM rewards ORDER BY name LIMIT 100").all(),
    db.prepare("SELECT ct.id, ct.amount, ct.reason, ct.created_at, p.full_name FROM coin_transactions ct JOIN profiles p ON p.user_id=ct.user_id ORDER BY ct.created_at DESC LIMIT 20").all(),
    db.prepare("SELECT p.id,p.body,p.media_json,p.published_at,c.name club_name,(SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id=p.id AND pr.type='like') likes,(SELECT COUNT(*) FROM comments cm WHERE cm.post_id=p.id AND cm.deleted_at IS NULL) comments FROM posts p JOIN clubs c ON c.id=p.club_id ORDER BY p.published_at DESC LIMIT 100").all(),
    db.prepare("SELECT (SELECT COUNT(*) FROM users WHERE role='student') students, (SELECT COUNT(*) FROM clubs WHERE status='active') clubs, (SELECT COUNT(*) FROM events) events, (SELECT COUNT(*) FROM rooms WHERE is_active=1) rooms, (SELECT COALESCE(SUM(CASE WHEN amount>0 THEN amount ELSE 0 END),0) FROM coin_transactions) coins_issued").first(),
  ]);
  return json({ authenticated: true, setupRequired: false, profile: { email: auth.email, name: auth.displayName, role: admin.role }, students: students.results, clubs: clubs.results, rooms: rooms.results, events: events.results, levels: levels.results, achievements: achievements.results, rewards: rewards.results, transactions: transactions.results, posts: posts.results, summary });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action ?? "");

  if (action === "bootstrap") return json({ error:"Первичная настройка больше не используется" }, 400);

  const ctx = await requireAdmin();
  if ("error" in ctx) return ctx.error;
  const { db, admin } = ctx;
  try {
    const id = crypto.randomUUID(); const now = Date.now();
    if (action === "updateRole") {
      const email=value(body,"email").toLowerCase();
      const role=value(body,"role");
      const allowed=["student","club_manager","event_organizer","admin"];
      if(!allowed.includes(role))throw new Error("Неизвестная роль");
      const target=await db.prepare("SELECT id,role FROM users WHERE email=? LIMIT 1").bind(email).first<{id:string;role:string}>();
      if(!target)throw new Error("Пользователь не найден");
      if(target.id===admin.id&&role!=="admin")throw new Error("Нельзя снять права у собственного аккаунта");
      await db.prepare("UPDATE users SET role=?,updated_at=? WHERE id=?").bind(role,now,target.id).run();
    } else if (action === "createClub") {
      const name=value(body,"name"), direction=value(body,"direction"); const slug=`${name.toLowerCase().replace(/[^a-zа-яё0-9]+/gi,"-").replace(/^-|-$/g,"")}-${id.slice(0,6)}`;
      await db.prepare("INSERT INTO clubs (id,name,slug,description,direction,manager_id,logo_url,cover_url,instagram,telegram,status,created_at,approved_at,approved_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,name,slug,String(body.description||""),direction,admin.id,String(body.logoUrl||""),String(body.coverUrl||""),String(body.instagram||""),String(body.telegram||""),"active",now,now,admin.id).run();
    } else if (action === "createRoom") {
      await db.prepare("INSERT INTO rooms (id,name,capacity,location,equipment_json,is_active) VALUES (?,?,?,?,?,1)").bind(id,value(body,"name"),Number(body.capacity)||1,String(body.location||""),JSON.stringify(String(body.equipment||"").split(",").map(x=>x.trim()).filter(Boolean))).run();
    } else if (action === "createEvent") {
      const start=new Date(value(body,"startsAt")).getTime(), end=new Date(value(body,"endsAt")).getTime(); if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start) throw new Error("Проверьте дату и время мероприятия");
      await db.prepare("INSERT INTO events (id,title,description,organizer_id,club_id,room_id,place_text,category,cover_url,starts_at,ends_at,capacity,xp_reward,coin_reward,status,registration_source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,value(body,"title"),String(body.description||""),admin.id,body.clubId||null,body.roomId||null,String(body.placeText||""),String(body.category||"Другое"),String(body.coverUrl||""),start,end,Number(body.capacity)||1,Number(body.xpReward)||0,Number(body.coinReward)||0,"published","admin").run();
    } else if (action === "addStudent") {
      const email=value(body,"email").toLowerCase(), userId=crypto.randomUUID();
      await db.batch([db.prepare("INSERT INTO users (id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,?,?)").bind(userId,email,String(body.role||"student"),"active",now,now),db.prepare("INSERT INTO profiles (user_id,full_name,group_name,faculty,xp,coin_balance,interests_json,is_public) VALUES (?,?,?,?,0,0,'[]',1)").bind(userId,value(body,"fullName"),String(body.groupName||""),String(body.faculty||""))]);
    } else if (action === "adjustCoins") {
      const target=await db.prepare("SELECT u.id,p.coin_balance FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.email=?").bind(value(body,"email").toLowerCase()).first<{id:string;coin_balance:number}>(); if(!target) throw new Error("Студент с такой почтой не найден"); const amount=Number(body.amount); if(!Number.isInteger(amount)||amount===0) throw new Error("Укажите целое количество Coins"); const balance=target.coin_balance+amount; if(balance<0) throw new Error("Недостаточный баланс");
      await db.batch([db.prepare("UPDATE profiles SET coin_balance=? WHERE user_id=?").bind(balance,target.id),db.prepare("INSERT INTO coin_transactions (id,user_id,amount,balance_after,reason,source_type,created_at,created_by) VALUES (?,?,?,?,?,?,?,?)").bind(id,target.id,amount,balance,value(body,"reason"),"admin",now,admin.id)]);
    } else if (action === "createAchievement") {
      await db.prepare("INSERT INTO achievements (id,name,description,category,rule_type,rule_value,xp_reward,coin_reward,is_hidden,is_active) VALUES (?,?,?,?,?,?,?,?,0,1)").bind(id,value(body,"name"),String(body.description||""),String(body.category||"Общее"),String(body.ruleType||"events_attended"),Number(body.ruleValue)||1,Number(body.xpReward)||0,Number(body.coinReward)||0).run();
    } else if (action === "createReward") {
      const cost=Number(body.cost), stock=Number(body.stock);
      if(!Number.isInteger(cost)||cost<0) throw new Error("Стоимость должна быть целым неотрицательным числом");
      if(!Number.isInteger(stock)||stock<0) throw new Error("Остаток должен быть целым неотрицательным числом");
      await db.prepare("INSERT INTO rewards (id,name,description,cost,stock,image_url,is_active) VALUES (?,?,?,?,?,?,1)").bind(id,value(body,"name"),String(body.description||""),cost,stock,String(body.imageUrl||"")).run();
    } else if (action === "createPost") {
      await db.prepare("INSERT INTO posts (id,club_id,author_id,body,tags_json,link_url,media_json,status,view_count,published_at,updated_at) VALUES (?,?,?,?,?,?,?,?,0,?,?)").bind(id,value(body,"clubId"),admin.id,value(body,"body"),JSON.stringify(String(body.tags||"").split(/\s+/).filter(x=>x.startsWith("#"))),String(body.linkUrl||""),JSON.stringify(body.mediaUrl?[{url:String(body.mediaUrl),type:String(body.mediaType||"image/jpeg")}]:[]),"published",now,now).run();
    } else if (action === "delete") {
      const entity=String(body.entity), target=value(body,"id"); const map:Record<string,string>={club:"clubs",room:"rooms",event:"events",achievement:"achievements",reward:"rewards",post:"posts"}; if(!map[entity]) throw new Error("Неизвестный тип записи"); await db.prepare(`DELETE FROM ${map[entity]} WHERE id=?`).bind(target).run();
    } else return json({ error: "Неизвестное действие" }, 400);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Не удалось сохранить" }, 400);
  }
}
