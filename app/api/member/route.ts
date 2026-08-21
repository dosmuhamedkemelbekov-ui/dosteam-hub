import { apiJson, cleanText, currentUser, makeTicketCode, requireHubUser } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx=await currentUser();
  if(!ctx.auth)return apiJson({error:"Требуется вход"},401); if(!ctx.db)return apiJson({error:"База недоступна"},503);
  if(!ctx.user)return apiJson({authenticated:true,onboarding:true,email:ctx.auth.email,name:ctx.auth.displayName});
  const profile=await ctx.db.prepare("SELECT p.*,l.name_ru level_name FROM profiles p LEFT JOIN levels l ON l.id=p.level_id WHERE p.user_id=?").bind(ctx.user.id).first();
  if(!profile)return apiJson({authenticated:true,onboarding:true,email:ctx.auth.email,name:ctx.auth.displayName});
  const [tickets,memberships,follows,notices]=await Promise.all([
    ctx.db.prepare("SELECT r.id,r.ticket_code,r.status,r.registered_at,e.title,e.starts_at,e.ends_at,e.place_text,e.xp_reward,e.coin_reward FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=? ORDER BY e.starts_at DESC LIMIT 30").bind(ctx.user.id).all(),
    ctx.db.prepare("SELECT m.id,m.status,m.role,c.name,c.direction FROM club_memberships m JOIN clubs c ON c.id=m.club_id WHERE m.user_id=? ORDER BY m.applied_at DESC").bind(ctx.user.id).all(),
    ctx.db.prepare("SELECT c.id,c.name,f.notifications_enabled FROM club_follows f JOIN clubs c ON c.id=f.club_id WHERE f.user_id=? ORDER BY f.created_at DESC").bind(ctx.user.id).all(),
    ctx.db.prepare("SELECT id,type,title,body,action_url,read_at,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30").bind(ctx.user.id).all(),
  ]);
  return apiJson({authenticated:true,onboarding:false,user:ctx.user,profile,tickets:tickets.results,memberships:memberships.results,follows:follows.results,notifications:notices.results});
}

export async function POST(request:Request) {
  const body=await request.json().catch(()=>({})) as Record<string,unknown>; const action=String(body.action||"");
  if(action==="onboard") {
    const ctx=await currentUser(); if(!ctx.auth||!ctx.db||!ctx.user)return apiJson({error:"Требуется вход"},401); const existing=await ctx.db.prepare("SELECT user_id FROM profiles WHERE user_id=?").bind(ctx.user.id).first(); if(existing)return apiJson({ok:true});
    const fullName=cleanText(body.fullName,120)||ctx.auth.displayName; const studentId=cleanText(body.studentId,40); const groupName=cleanText(body.groupName,40); if(!studentId||!groupName)return apiJson({error:"Укажите студенческий ID и группу"},400);
    const level=await ctx.db.prepare("SELECT id FROM levels ORDER BY rank LIMIT 1").first<{id:number}>();
    try{await ctx.db.prepare("INSERT INTO profiles (user_id,full_name,student_id,faculty,group_name,course,avatar_url,bio,interests_json,xp,coin_balance,level_id,is_public) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)").bind(ctx.user.id,fullName,studentId,cleanText(body.faculty,100),groupName,Number(body.course)||1,cleanText(body.avatarUrl,500),cleanText(body.bio,500),JSON.stringify(Array.isArray(body.interests)?body.interests:[]),0,0,level?.id||null).run();return apiJson({ok:true});}catch{return apiJson({error:"Этот студенческий ID уже зарегистрирован"},409)}
  }
  const ctx=await requireHubUser(); if("error" in ctx)return ctx.error; const now=Date.now();
  if(action==="updateProfile") {
    const fullName=cleanText(body.fullName,120),studentId=cleanText(body.studentId,40),groupName=cleanText(body.groupName,40);
    if(!fullName||!studentId||!groupName)return apiJson({error:"Укажите имя, студенческий ID и группу"},400);
    const current=await ctx.db.prepare("SELECT avatar_url FROM profiles WHERE user_id=?").bind(ctx.user.id).first<{avatar_url:string|null}>();
    if(!current)return apiJson({error:"Профиль не найден",onboarding:true},404);
    const avatarUrl=Object.prototype.hasOwnProperty.call(body,"avatarUrl")?cleanText(body.avatarUrl,500):current.avatar_url;
    const interests=Array.isArray(body.interests)?body.interests.map(x=>cleanText(x,40)).filter(Boolean).slice(0,12):[];
    try{
      await ctx.db.batch([
        ctx.db.prepare("UPDATE profiles SET full_name=?,student_id=?,faculty=?,group_name=?,course=?,avatar_url=?,bio=?,interests_json=?,is_public=? WHERE user_id=?")
          .bind(fullName,studentId,cleanText(body.faculty,100),groupName,Math.min(8,Math.max(1,Number(body.course)||1)),avatarUrl,cleanText(body.bio,500),JSON.stringify(interests),body.isPublic===false?0:1,ctx.user.id),
        ctx.db.prepare("UPDATE users SET updated_at=? WHERE id=?").bind(now,ctx.user.id),
      ]);
      return apiJson({ok:true});
    }catch{return apiJson({error:"Такой студенческий ID уже используется"},409)}
  }
  if(action==="registerEvent") {
    const eventId=cleanText(body.eventId,100); const event=await ctx.db.prepare("SELECT id,title,capacity,starts_at,status FROM events WHERE id=?").bind(eventId).first<{id:string;title:string;capacity:number;starts_at:number;status:string}>(); if(!event||event.status!=="published")return apiJson({error:"Регистрация закрыта"},400);
    const count=await ctx.db.prepare("SELECT COUNT(*) total FROM registrations WHERE event_id=? AND status!='cancelled'").bind(eventId).first<{total:number}>(); if(Number(count?.total||0)>=event.capacity)return apiJson({error:"Свободных мест больше нет"},409);
    const existing=await ctx.db.prepare("SELECT ticket_code,status FROM registrations WHERE event_id=? AND user_id=?").bind(eventId,ctx.user.id).first<{ticket_code:string;status:string}>(); if(existing)return apiJson({ok:true,ticketCode:existing.ticket_code,status:existing.status});
    const ticketCode=makeTicketCode(); await ctx.db.batch([ctx.db.prepare("INSERT INTO registrations (id,event_id,user_id,ticket_code,status,source,registered_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),eventId,ctx.user.id,ticketCode,"registered",cleanText(body.source,30)||"hub",now),ctx.db.prepare("INSERT INTO notifications (id,user_id,type,title,body,action_url,created_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),ctx.user.id,"event_registered","Регистрация подтверждена",event.title,`/join`,now)]); return apiJson({ok:true,ticketCode,status:"registered"});
  }
  if(action==="followClub") {
    const clubId=cleanText(body.clubId,100); const existing=await ctx.db.prepare("SELECT user_id FROM club_follows WHERE user_id=? AND club_id=?").bind(ctx.user.id,clubId).first(); if(existing){await ctx.db.prepare("DELETE FROM club_follows WHERE user_id=? AND club_id=?").bind(ctx.user.id,clubId).run();return apiJson({ok:true,following:false})} await ctx.db.prepare("INSERT INTO club_follows (user_id,club_id,notifications_enabled,created_at) VALUES (?,?,1,?)").bind(ctx.user.id,clubId,now).run(); return apiJson({ok:true,following:true});
  }
  if(action==="joinClub") {
    const clubId=cleanText(body.clubId,100); const existing=await ctx.db.prepare("SELECT id,status FROM club_memberships WHERE user_id=? AND club_id=?").bind(ctx.user.id,clubId).first<{id:string;status:string}>(); if(existing)return apiJson({ok:true,status:existing.status}); await ctx.db.prepare("INSERT INTO club_memberships (id,user_id,club_id,role,status,motivation,applied_at) VALUES (?,?,?,?,?,?,?)").bind(crypto.randomUUID(),ctx.user.id,clubId,"member","pending",cleanText(body.motivation,500),now).run(); return apiJson({ok:true,status:"pending"});
  }
  if(action==="readNotifications") { await ctx.db.prepare("UPDATE notifications SET read_at=? WHERE user_id=? AND read_at IS NULL").bind(now,ctx.user.id).run(); return apiJson({ok:true}); }
  return apiJson({error:"Неизвестное действие"},400);
}
