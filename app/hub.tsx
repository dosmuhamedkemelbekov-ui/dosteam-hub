"use client";

import { useEffect, useMemo, useState } from "react";
import RoutedView from "./views";

export type View = "dashboard" | "feed" | "events" | "clubs" | "leaderboard" | "rooms" | "achievements" | "rewards" | "profile" | "admin";

export type HubIdentity = {
  userId: string;
  fullName: string;
  firstName: string;
  initials: string;
  groupName: string;
  faculty: string;
  avatarUrl: string | null;
  xp: number;
  coins: number;
  levelName: string;
  levelMinXp: number;
  nextLevelName: string | null;
  nextLevelXp: number | null;
  role: string;
};

const nav: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Главная", icon: "⌂" }, { id: "feed", label: "Моя лента", icon: "◫" },
  { id: "events", label: "Мероприятия", icon: "◇" }, { id: "clubs", label: "Клубы", icon: "◎" },
  { id: "leaderboard", label: "Рейтинг", icon: "↗" }, { id: "rooms", label: "Помещения", icon: "▦" },
  { id: "achievements", label: "Достижения", icon: "✦" }, { id: "rewards", label: "DC Coins", icon: "◉" },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="DOSTEAM HUB"><div className="brandMark"><span>D</span></div>{!compact && <div><b>DOSTEAM</b><small>STUDENT HUB</small></div>}</div>;
}

function RingProgress({ value = 72 }: { value?: number }) {
  return <div className="ring" style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}%</strong><span>прогресс</span></div></div>;
}

export function Avatar({ text = "DK", small = false, imageUrl = null }: { text?: string; small?: boolean; imageUrl?: string|null }) {
  return <div className={`avatar ${small ? "small" : ""}`}>{imageUrl?<img src={imageUrl} alt=""/>:text}</div>;
}

export default function HubApp({ identity }: { identity: HubIdentity }) {
  const [view, setView] = useState<View>("dashboard");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [notifications,setNotifications]=useState<Record<string,unknown>[]>([]);
  const [toast, setToast] = useState("");
  const canScan = ["admin", "event_organizer", "club_manager"].includes(identity.role);
  const title = useMemo(() => nav.find((item) => item.id === view)?.label ?? "DOSTEAM HUB", [view]);
  const go = (next: View) => { setMobileMoreOpen(false); setNoticeOpen(false); setAccountOpen(false); if (next === "admin") { window.location.assign("/manage"); return; } if(next === "profile") { window.location.assign("/join"); return; } setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  useEffect(()=>{fetch("/api/member").then(r=>r.json()).then(data=>setNotifications(data.notifications||[])).catch(()=>setNotifications([]))},[]);

  return <div className="appShell">
    <aside className="sidebar">
      <Logo />
      <nav className="sideNav" aria-label="Главная навигация">
        <p className="navLabel">МОЙ HUB</p>
        {nav.map((item) => <button key={item.id} onClick={() => go(item.id)} className={view === item.id ? "active" : ""}><span>{item.icon}</span>{item.label}</button>)}
        {canScan && <><p className="navLabel">ИНСТРУМЕНТЫ</p><button onClick={() => window.location.assign("/scan")}><span>⌗</span>QR Scanner</button></>}
        {identity.role === "admin" && <button onClick={() => go("admin")} className={view === "admin" ? "active" : ""}><span>◈</span>Admin Panel</button>}
      </nav>
      <div className="sidebarCard"><span className="miniSun">✦</span><strong>Развивай свой HUB</strong><p>Участвуй в реальных событиях — активность появится в цифровом профиле.</p><button onClick={() => go("events")}>Мероприятия →</button></div>
      <div className="sideProfile" onClick={() => go("profile")} role="button" tabIndex={0}><Avatar text={identity.initials} imageUrl={identity.avatarUrl} small /><div><strong>{identity.firstName}</strong><span>{identity.groupName} · {identity.levelName}</span></div><b>•••</b></div>
    </aside>

    <main className="mainArea">
      <header className="topbar">
        <div className="mobileLogo"><Logo compact /></div><div className="viewTitle"><p className="eyebrow">DOSTEAM HUB</p><h1>{title}</h1></div>
        <div className="topActions"><button className="iconButton" onClick={() => setSearchOpen(true)} aria-label="Поиск">⌕</button><button className="iconButton notice" onClick={() => setNoticeOpen(!noticeOpen)} aria-label="Уведомления">♢{notifications.some(item=>!item.read_at)&&<i />}</button><div className="coinPill"><span>◉</span><b>{identity.coins.toLocaleString("ru-RU")}</b><em>DC</em></div><button className="accountButton" onClick={()=>setAccountOpen(!accountOpen)} aria-label="Аккаунт"><Avatar text={identity.initials} imageUrl={identity.avatarUrl} small /></button></div>
        {noticeOpen && <div className="popover notifications"><div className="popoverHead"><strong>Уведомления</strong><button onClick={() => setNoticeOpen(false)}>×</button></div>{notifications.length?notifications.slice(0,5).map((notice,index)=><div className={`noticeItem ${notice.read_at?"":"new"}`} key={String(notice.id||index)}><span>✦</span><div><b>{String(notice.title||"Обновление HUB")}</b><p>{String(notice.body||"")}</p></div></div>):<div className="emptyMini"><b>Уведомлений пока нет</b><span>Здесь появятся только реальные обновления.</span></div>}</div>}
        {accountOpen && <div className="popover accountMenu"><div className="accountSummary"><Avatar text={identity.initials} imageUrl={identity.avatarUrl}/><div><b>{identity.fullName}</b><span>{identity.groupName} · {identity.levelName}</span></div></div><p>МОЙ АККАУНТ</p><button onClick={()=>go("profile")}><span>♙</span>Личный кабинет<i>→</i></button>{canScan&&<button onClick={()=>window.location.assign("/scan")}><span>⌗</span>QR Scanner<i>→</i></button>}{identity.role==="admin"&&<button onClick={()=>go("admin")}><span>◈</span>Admin Panel<i>→</i></button>}<button className="signOut" onClick={()=>window.location.assign("/api/auth/logout")}>Выйти</button></div>}
      </header>
      {view === "dashboard" ? <Dashboard go={go} flash={flash} identity={identity} /> : <RoutedView view={view} go={go} flash={flash} identity={identity} />}
    </main>

    <nav className="mobileNav" aria-label="Мобильная навигация">
      {nav.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
      <button className={mobileMoreOpen || ["leaderboard","rooms","achievements","rewards"].includes(view) ? "active" : ""} onClick={() => setMobileMoreOpen(x => !x)} aria-expanded={mobileMoreOpen}><span>•••</span><small>Ещё</small></button>
    </nav>
    {mobileMoreOpen && <div className="mobileMenuLayer" onMouseDown={() => setMobileMoreOpen(false)}><section className="mobileMenuSheet" onMouseDown={e => e.stopPropagation()}>
      <div className="mobileMenuHandle"/><header><div className="accountSummary"><Avatar text={identity.initials} imageUrl={identity.avatarUrl}/><div><b>{identity.fullName}</b><span>{identity.groupName} · {identity.levelName}</span></div></div><button onClick={() => setMobileMoreOpen(false)} aria-label="Закрыть">×</button></header>
      <div className="mobileMenuGrid">{nav.slice(4).map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}><span>{item.icon}</span><b>{item.label}</b></button>)}<button onClick={() => go("profile")}><span>♙</span><b>Профиль</b></button>{canScan&&<button onClick={()=>window.location.assign("/scan")}><span>⌗</span><b>QR Scanner</b></button>}{identity.role==="admin"&&<button onClick={()=>go("admin")}><span>◈</span><b>Admin</b></button>}</div>
      <a className="mobileSignout" href="/api/auth/logout">Выйти из аккаунта</a>
    </section></div>}
    {searchOpen && <SearchModal close={() => setSearchOpen(false)} go={go} />}{toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;
}

function Dashboard({ go, identity }: { go: (view: View) => void; flash: (message: string) => void; identity: HubIdentity }) {
  const [live,setLive]=useState<{events:Record<string,unknown>[];clubs:Record<string,unknown>[];leaderboard:Record<string,unknown>[];summary:Record<string,unknown>}|null>(null);
  const [member,setMember]=useState<{stats?:Record<string,unknown>;achievements?:Record<string,unknown>[]} | null>(null);
  useEffect(()=>{Promise.all([fetch("/api/public").then(r=>r.json()),fetch("/api/member").then(r=>r.json())]).then(([publicData,memberData])=>{setLive({events:publicData.events||[],clubs:publicData.clubs||[],leaderboard:publicData.leaderboard||[],summary:publicData.summary||{}});setMember(memberData)}).catch(()=>{setLive({events:[],clubs:[],leaderboard:[],summary:{}});setMember({stats:{},achievements:[]})})},[]);
  const leaders=(live?.leaderboard||[]).slice(0,3);
  const rank=(live?.leaderboard||[]).findIndex(row=>String(row.user_id)===identity.userId)+1;
  const upcoming=(live?.events||[]).slice(0,3).map((event,index)=>{const starts=new Date(Number(event.starts_at));return{...event,date:String(starts.getDate()).padStart(2,"0"),month:starts.toLocaleString("ru-RU",{month:"short"}).replace(".","").toUpperCase(),time:starts.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}),tone:["violet","blue","orange"][index%3]}});
  const activeClubs=(live?.clubs||[]).slice(0,4);
  const latestAchievement=(member?.achievements||[]).find(item=>item.unlocked_at);
  const stats=live?.summary||{};
  const registrations=Number(stats.registrations||0),attended=Number(stats.attended||0);
  const attendanceRate=registrations?Math.round(attended/registrations*100):0;
  const levelProgress=identity.nextLevelXp===null?100:Math.max(0,Math.min(100,Math.round((identity.xp-identity.levelMinXp)/Math.max(1,identity.nextLevelXp-identity.levelMinXp)*100)));
  return <div className="pageContent dashboard">
    <section className="heroPanel">
      <div className="heroCopy"><div className="statusLine"><span>●</span> ЛИЧНЫЙ HUB АКТИВЕН</div><h2>Добрый день,<br/><em>{identity.firstName}!</em></h2><p>{identity.groupName} · {identity.faculty}<br/>Твоя активность формирует цифровое портфолио ЕАГИ.</p><div className="heroActions"><button className="primary" onClick={() => go("events")}>Найти мероприятие <span>↗</span></button><button className="secondary" onClick={() => go("profile")}>Мой профиль</button></div></div>
      <div className="levelCard"><div className="levelTop"><span>ТВОЙ УРОВЕНЬ</span><b>{identity.levelName}</b></div><RingProgress value={levelProgress} /><h3>{identity.levelName}</h3><div className="xpLine"><span>{identity.xp.toLocaleString("ru-RU")} XP</span><span>{identity.nextLevelXp===null?"Максимум":`${identity.nextLevelXp.toLocaleString("ru-RU")} XP`}</span></div><div className="progress"><i style={{ width: `${levelProgress}%` }} /></div><small>{identity.nextLevelName?`Следующий уровень: ${identity.nextLevelName}`:"Достигнут максимальный уровень"}</small></div><div className="heroPattern">D</div>
    </section>

    <section className="metricGrid">
      <button onClick={() => go("leaderboard")} className="metricCard"><div className="metricIcon gold">↗</div><div><span>ПОЗИЦИЯ В РЕЙТИНГЕ</span><strong>{rank?`#${rank}`:"—"}</strong><p>{rank?"По реальным данным":"Профиль скрыт"}</p></div><em>→</em></button>
      <button onClick={() => go("rewards")} className="metricCard"><div className="metricIcon black">◉</div><div><span>DC COINS</span><strong>{identity.coins.toLocaleString("ru-RU")}</strong><p>Текущий баланс</p></div><em>→</em></button>
      <button onClick={() => go("achievements")} className="metricCard"><div className="metricIcon purple">✦</div><div><span>ДОСТИЖЕНИЯ</span><strong>{member?Number(member.stats?.achievements||0):"—"}</strong><p>Получено значков</p></div><em>→</em></button>
      <button onClick={() => go("events")} className="metricCard"><div className="metricIcon blue">◇</div><div><span>ПОСЕЩЕНО</span><strong>{member?Number(member.stats?.attended||0):"—"}</strong><p>мероприятий</p></div><em>→</em></button>
    </section>

    <div className="contentGrid"><section className="sectionCard eventsPanel"><div className="sectionHead"><div><span>АКТУАЛЬНО</span><h3>Ближайшие мероприятия</h3></div><button onClick={() => go("events")}>Все мероприятия →</button></div><div className="eventList">{upcoming.length?upcoming.map((event) => <article className="eventRow" key={String(event.id)}><div className={`dateBox ${event.tone}`}><strong>{event.date}</strong><span>{event.month}</span></div><div className="eventInfo"><span>{String(event.club_name||"Без клуба")}</span><h4>{String(event.title)}</h4><p>◷ {event.time} <i/>⌖ {String(event.place_text||"ЕАГИ")}</p></div><div className="seatInfo"><span>{Math.max(0,Number(event.capacity||0)-Number(event.registered||0))} мест</span><small>из {Number(event.capacity||0)}</small></div><button aria-label={`Открыть ${String(event.title)}`} onClick={() => go("events")}>→</button></article>):<div className="emptyMini"><b>Мероприятий пока нет</b><span>Опубликованные события появятся здесь.</span></div>}</div></section>
      <section className="sectionCard achievementPanel"><div className="sectionHead"><div><span>ПРОФИЛЬ</span><h3>Последнее достижение</h3></div><button onClick={() => go("achievements")}>Все →</button></div>{latestAchievement?<><div className="achievementBadge"><div className="badgeMedal"><span>{String(latestAchievement.icon||"★")}</span></div><div className="rays" /></div><span className="unlocked">ПОЛУЧЕНО {new Date(Number(latestAchievement.unlocked_at)).toLocaleDateString("ru-RU")}</span><h4>{String(latestAchievement.name)}</h4><p>{String(latestAchievement.description||"Достижение за подтверждённую активность")}</p><div className="rewardLine"><span>+{Number(latestAchievement.xp_reward||0)} XP</span><span>+{Number(latestAchievement.coin_reward||0)} DC</span></div></>:<div className="emptyMini"><b>Достижений пока нет</b><span>Администратор ещё не добавил условия достижений.</span></div>}</section>
    </div>

    <div className="contentGrid lower"><section className="sectionCard clubsPanel"><div className="sectionHead"><div><span>СООБЩЕСТВА</span><h3>Активные клубы</h3></div><button onClick={() => go("clubs")}>Все клубы →</button></div><div className="clubGrid">{activeClubs.length?activeClubs.map((club,index) => <article key={String(club.id)}><div className="clubLogo" style={{ background:["#111","#2672ff","#7442d6","#e78b27"][index%4] }}>{String(club.name).split(/\s+/).map(x=>x[0]).join("").slice(0,2)}</div><div><h4>{String(club.name)}</h4><p>{String(club.direction||"Направление не указано")}</p><span>{Number(club.members||0)} участников</span></div><button onClick={() => go("clubs")}>→</button></article>):<div className="emptyMini"><b>Клубов пока нет</b><span>Активные клубы появятся после добавления.</span></div>}</div></section>
      <section className="sectionCard ratingPanel"><div className="sectionHead"><div><span>ТОП СТУДЕНТОВ</span><h3>Лидерборд</h3></div><button onClick={() => go("leaderboard")}>Рейтинг →</button></div>{leaders.length?leaders.map((leader,index)=><div className={`leader ${String(leader.user_id)===identity.userId?"me":""}`} key={String(leader.user_id)}><strong className={`rank r${index+1}`}>{index+1}</strong><Avatar text={String(leader.full_name||"S").split(/\s+/).map(x=>x[0]).slice(0,2).join("")} imageUrl={leader.avatar_url?String(leader.avatar_url):null} small/><div><b>{String(leader.full_name)}{String(leader.user_id)===identity.userId&&<i> Вы</i>}</b><span>{String(leader.group_name||"ЕАГИ")} · {String(leader.level_name||"Новичок")}</span></div><em>{Number(leader.xp||0).toLocaleString("ru-RU")} XP</em></div>):<div className="emptyMini"><b>Рейтинг пока пуст</b><span>Он заполнится реальными профилями студентов.</span></div>}</section>
    </div>

    <section className="pulseStrip"><div><span>DOSTEAM PULSE</span><h3>Только реальные данные HUB</h3></div><div className="pulseStats"><p><strong>{Number(stats.students||0)}</strong><span>активных студентов</span></p><i/><p><strong>{Number(stats.clubs||0)}</strong><span>активных клубов</span></p><i/><p><strong>{Number(stats.events||0)}</strong><span>опубликованных событий</span></p><i/><p><strong>{attendanceRate}%</strong><span>посещаемость</span></p></div></section>
  </div>;
}

function SearchModal({ close, go }: { close: () => void; go: (view: View) => void }) {
  const [query,setQuery]=useState("");
  const [items,setItems]=useState<{title:string;meta:string;view:View;glyph:string;tone:string}[]>([]);
  useEffect(()=>{fetch("/api/public").then(r=>r.json()).then(data=>setItems([
    ...(data.clubs||[]).map((x:Record<string,unknown>)=>({title:String(x.name),meta:`Клуб · ${Number(x.members||0)} участников`,view:"clubs" as View,glyph:"◎",tone:""})),
    ...(data.events||[]).map((x:Record<string,unknown>)=>({title:String(x.title),meta:"Мероприятие",view:"events" as View,glyph:"◇",tone:"yellow"})),
    ...(data.rooms||[]).map((x:Record<string,unknown>)=>({title:String(x.name),meta:`Помещение · ${Number(x.capacity||0)} мест`,view:"rooms" as View,glyph:"▦",tone:"grey"})),
    ...(data.leaderboard||[]).map((x:Record<string,unknown>)=>({title:String(x.full_name),meta:`Студент · ${Number(x.xp||0)} XP`,view:"leaderboard" as View,glyph:"♙",tone:"grey"})),
  ])).catch(()=>setItems([]))},[]);
  const shown=items.filter(item=>`${item.title} ${item.meta}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0,8);
  return <div className="modalLayer" onMouseDown={close}><div className="searchModal" onMouseDown={(e) => e.stopPropagation()}><div className="searchInput"><span>⌕</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск студентов, клубов, событий..."/><kbd>ESC</kbd></div><p>{query?"РЕЗУЛЬТАТЫ":"ДАННЫЕ HUB"}</p>{shown.length?shown.map((item,index)=><button key={`${item.view}-${item.title}-${index}`} onClick={()=>{close();go(item.view)}}><span className={`searchGlyph ${item.tone}`}>{item.glyph}</span><div><b>{item.title}</b><small>{item.meta}</small></div><em>→</em></button>):<div className="emptyMini"><b>Ничего не найдено</b><span>Поиск работает только по реальным данным HUB.</span></div>}</div></div>;
}
