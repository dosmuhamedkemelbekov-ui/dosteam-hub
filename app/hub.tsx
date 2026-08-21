"use client";

import { useMemo, useState } from "react";
import RoutedView from "./views";

export type View = "dashboard" | "feed" | "events" | "clubs" | "leaderboard" | "rooms" | "rewards" | "profile" | "admin";

export type HubIdentity = {
  fullName: string;
  firstName: string;
  initials: string;
  groupName: string;
  faculty: string;
  avatarUrl: string | null;
  xp: number;
  coins: number;
  levelName: string;
  role: string;
};

const nav: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Главная", icon: "⌂" }, { id: "feed", label: "Моя лента", icon: "◫" },
  { id: "events", label: "Мероприятия", icon: "◇" }, { id: "clubs", label: "Клубы", icon: "◎" },
  { id: "leaderboard", label: "Рейтинг", icon: "↗" }, { id: "rooms", label: "Помещения", icon: "▦" },
  { id: "rewards", label: "Награды", icon: "✦" },
];

const events = [
  { id: 1, date: "24", month: "АВГ", title: "EAGI Welcome Day", time: "16:00", place: "Конференц-зал", club: "DOSTEAM", seats: 38, total: 120, tone: "violet" },
  { id: 2, date: "26", month: "АВГ", title: "EAGI Running: Open Run", time: "18:30", place: "Триатлон парк", club: "EAGI Running", seats: 14, total: 60, tone: "blue" },
  { id: 3, date: "29", month: "АВГ", title: "Startup Talk: От идеи к MVP", time: "17:00", place: "Аудитория 305", club: "Business Club", seats: 22, total: 80, tone: "orange" },
];

const clubs = [
  { name: "DOSTEAM Community", tag: "Сообщество", members: 486, initials: "DS", color: "#111111" },
  { name: "EAGI Running", tag: "Спорт", members: 214, initials: "ER", color: "#2775ff" },
  { name: "Debate Club", tag: "Образование", members: 178, initials: "DC", color: "#7d3cff" },
  { name: "Business Club", tag: "Предпринимательство", members: 162, initials: "BC", color: "#e58924" },
];

const leaders = [
  { rank: 1, name: "Аружан Сәрсен", group: "ЮТК-23", xp: 8420, level: "Амбассадор", badge: "AS" },
  { rank: 2, name: "Нұрдәулет Әли", group: "ФК-24", xp: 7980, level: "Амбассадор", badge: "NA" },
  { rank: 3, name: "Айша Қанат", group: "ПДР-23", xp: 7650, level: "Лидер", badge: "AQ" },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="brand" aria-label="DOSTEAM HUB"><div className="brandMark"><span>D</span></div>{!compact && <div><b>DOSTEAM</b><small>STUDENT HUB</small></div>}</div>;
}

function RingProgress({ value = 72 }: { value?: number }) {
  return <div className="ring" style={{ "--progress": `${value * 3.6}deg` } as React.CSSProperties}><div><strong>{value}%</strong><span>прогресс</span></div></div>;
}

export function Avatar({ text = "DK", small = false }: { text?: string; small?: boolean }) {
  return <div className={`avatar ${small ? "small" : ""}`}>{text}</div>;
}

export default function HubApp({ identity }: { identity: HubIdentity }) {
  const [view, setView] = useState<View>("dashboard");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [toast, setToast] = useState("");
  const canScan = ["admin", "event_organizer", "club_manager"].includes(identity.role);
  const title = useMemo(() => nav.find((item) => item.id === view)?.label ?? "DOSTEAM HUB", [view]);
  const go = (next: View) => { if (next === "admin") { window.location.assign("/manage"); return; } if(next === "profile") { window.location.assign("/join"); return; } setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };

  return <div className="appShell">
    <aside className="sidebar">
      <Logo />
      <nav className="sideNav" aria-label="Главная навигация">
        <p className="navLabel">МОЙ HUB</p>
        {nav.map((item) => <button key={item.id} onClick={() => go(item.id)} className={view === item.id ? "active" : ""}><span>{item.icon}</span>{item.label}{item.id === "feed" && <i>4</i>}</button>)}
        {canScan && <><p className="navLabel">ИНСТРУМЕНТЫ</p><button onClick={() => window.location.assign("/scan")}><span>⌗</span>QR Scanner</button></>}
        {identity.role === "admin" && <button onClick={() => go("admin")} className={view === "admin" ? "active" : ""}><span>◈</span>Admin Panel</button>}
      </nav>
      <div className="sidebarCard"><span className="miniSun">✦</span><strong>Стань активнее</strong><p>До нового достижения осталось 2 мероприятия.</p><button onClick={() => go("events")}>Найти событие →</button></div>
      <div className="sideProfile" onClick={() => go("profile")} role="button" tabIndex={0}><Avatar text={identity.initials} small /><div><strong>{identity.firstName}</strong><span>{identity.groupName} · {identity.levelName}</span></div><b>•••</b></div>
    </aside>

    <main className="mainArea">
      <header className="topbar">
        <div className="mobileLogo"><Logo compact /></div><div><p className="eyebrow">DOSTEAM HUB</p><h1>{title}</h1></div>
        <div className="topActions"><button className="iconButton" onClick={() => setSearchOpen(true)} aria-label="Поиск">⌕</button><button className="iconButton notice" onClick={() => setNoticeOpen(!noticeOpen)} aria-label="Уведомления">♢<i /></button><div className="coinPill"><span>◉</span><b>{identity.coins.toLocaleString("ru-RU")}</b><em>DC</em></div><button className="accountButton" onClick={()=>setAccountOpen(!accountOpen)} aria-label="Аккаунт"><Avatar text={identity.initials} small /></button></div>
        {noticeOpen && <div className="popover notifications"><div className="popoverHead"><strong>Уведомления</strong><button onClick={() => setNoticeOpen(false)}>×</button></div><div className="noticeItem new"><span>+30</span><div><b>DC Coins начислены</b><p>За волонтёрство на EAGI CUP · 5 мин</p></div></div><div className="noticeItem"><span>✓</span><div><b>Заявка одобрена</b><p>Вы приняты в EAGI Running · 2 ч</p></div></div><div className="noticeItem"><span>◇</span><div><b>Событие скоро начнётся</b><p>Welcome Day — завтра в 16:00</p></div></div><button className="fullLink">Все уведомления</button></div>}
        {accountOpen && <div className="popover accountMenu"><div className="accountSummary"><Avatar text={identity.initials}/><div><b>{identity.fullName}</b><span>{identity.groupName} · {identity.levelName}</span></div></div><p>МОЙ АККАУНТ</p><button onClick={()=>go("profile")}><span>♙</span>Личный кабинет<i>→</i></button>{canScan&&<button onClick={()=>window.location.assign("/scan")}><span>⌗</span>QR Scanner<i>→</i></button>}{identity.role==="admin"&&<button onClick={()=>go("admin")}><span>◈</span>Admin Panel<i>→</i></button>}<button className="signOut" onClick={()=>window.location.assign("/api/auth/logout")}>Выйти</button></div>}
      </header>
      {view === "dashboard" ? <Dashboard go={go} flash={flash} identity={identity} /> : <RoutedView view={view} go={go} flash={flash} />}
    </main>

    <nav className="mobileNav">{nav.slice(0, 5).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>
    {searchOpen && <SearchModal close={() => setSearchOpen(false)} go={go} />}{toast && <div className="toast"><span>✓</span>{toast}</div>}
  </div>;
}

function Dashboard({ go, flash, identity }: { go: (view: View) => void; flash: (message: string) => void; identity: HubIdentity }) {
  return <div className="pageContent dashboard">
    <section className="heroPanel">
      <div className="heroCopy"><div className="statusLine"><span>●</span> ЛИЧНЫЙ HUB АКТИВЕН</div><h2>Добрый день,<br/><em>{identity.firstName}!</em></h2><p>{identity.groupName} · {identity.faculty}<br/>Твоя активность формирует цифровое портфолио ЕАГИ.</p><div className="heroActions"><button className="primary" onClick={() => go("events")}>Найти мероприятие <span>↗</span></button><button className="secondary" onClick={() => go("profile")}>Мой профиль</button></div></div>
      <div className="levelCard"><div className="levelTop"><span>ТВОЙ УРОВЕНЬ</span><b>{identity.levelName}</b></div><RingProgress value={Math.min(100, Math.round((identity.xp % 1000) / 10))} /><h3>{identity.levelName}</h3><div className="xpLine"><span>{identity.xp.toLocaleString("ru-RU")} XP</span><span>Активность</span></div><div className="progress"><i style={{ width: `${Math.min(100, Math.round((identity.xp % 1000) / 10))}%` }} /></div><small>XP обновляется после подтверждённого участия</small></div><div className="heroPattern">D</div>
    </section>

    <section className="metricGrid">
      <button onClick={() => go("leaderboard")} className="metricCard"><div className="metricIcon gold">↗</div><div><span>ПОЗИЦИЯ В РЕЙТИНГЕ</span><strong>#12</strong><p><b>↑ 3</b> за этот месяц</p></div><em>→</em></button>
      <button onClick={() => go("rewards")} className="metricCard"><div className="metricIcon black">◉</div><div><span>DC COINS</span><strong>{identity.coins.toLocaleString("ru-RU")}</strong><p>Текущий баланс</p></div><em>→</em></button>
      <button onClick={() => go("profile")} className="metricCard"><div className="metricIcon purple">✦</div><div><span>ДОСТИЖЕНИЯ</span><strong>14</strong><p>2 почти открыты</p></div><em>→</em></button>
      <button onClick={() => go("events")} className="metricCard"><div className="metricIcon blue">◇</div><div><span>ПОСЕЩЕНО</span><strong>23</strong><p>мероприятия</p></div><em>→</em></button>
    </section>

    <div className="contentGrid"><section className="sectionCard eventsPanel"><div className="sectionHead"><div><span>НЕ ПРОПУСТИ</span><h3>Ближайшие мероприятия</h3></div><button onClick={() => go("events")}>Все мероприятия →</button></div><div className="eventList">{events.map((event) => <article className="eventRow" key={event.id}><div className={`dateBox ${event.tone}`}><strong>{event.date}</strong><span>{event.month}</span></div><div className="eventInfo"><span>{event.club}</span><h4>{event.title}</h4><p>◷ {event.time} <i/>⌖ {event.place}</p></div><div className="seatInfo"><span>{event.seats} мест</span><small>из {event.total}</small></div><button aria-label={`Открыть ${event.title}`} onClick={() => flash(`Открыто: ${event.title}`)}>→</button></article>)}</div></section>
      <section className="sectionCard achievementPanel"><div className="sectionHead"><div><span>НОВОЕ</span><h3>Последнее достижение</h3></div><button onClick={() => go("profile")}>Все →</button></div><div className="achievementBadge"><div className="badgeMedal"><span>★</span></div><div className="rays" /></div><span className="unlocked">ОТКРЫТО 18 АВГУСТА</span><h4>Сила команды</h4><p>Ты посетил 10 мероприятий<br/>вместе со своим клубом.</p><div className="rewardLine"><span>+150 XP</span><span>+50 DC</span></div></section>
    </div>

    <div className="contentGrid lower"><section className="sectionCard clubsPanel"><div className="sectionHead"><div><span>СООБЩЕСТВА</span><h3>Популярные клубы</h3></div><button onClick={() => go("clubs")}>Все клубы →</button></div><div className="clubGrid">{clubs.map((club) => <article key={club.name}><div className="clubLogo" style={{ background: club.color }}>{club.initials}</div><div><h4>{club.name}</h4><p>{club.tag}</p><span>{club.members} участников</span></div><button onClick={() => flash(`Вы подписались на ${club.name}`)}>+</button></article>)}</div></section>
      <section className="sectionCard ratingPanel"><div className="sectionHead"><div><span>ТОП СТУДЕНТОВ</span><h3>Лидерборд</h3></div><button onClick={() => go("leaderboard")}>Рейтинг →</button></div>{leaders.map((leader) => <div className="leader" key={leader.rank}><strong className={`rank r${leader.rank}`}>{leader.rank}</strong><Avatar text={leader.badge} small/><div><b>{leader.name}</b><span>{leader.group} · {leader.level}</span></div><em>{leader.xp.toLocaleString("ru-RU")} XP</em></div>)}<div className="leader me"><strong className="rank">—</strong><Avatar text={identity.initials} small/><div><b>{identity.firstName} <i>Вы</i></b><span>{identity.groupName} · {identity.levelName}</span></div><em>{identity.xp.toLocaleString("ru-RU")} XP</em></div></section>
    </div>

    <section className="pulseStrip"><div><span>DOSTEAM PULSE</span><h3>Студенческая жизнь в цифрах</h3></div><div className="pulseStats"><p><strong>2 847</strong><span>студентов</span></p><i/><p><strong>34</strong><span>активных клуба</span></p><i/><p><strong>126</strong><span>событий за семестр</span></p><i/><p><strong>78%</strong><span>средняя посещаемость</span></p></div></section>
  </div>;
}

function SearchModal({ close, go }: { close: () => void; go: (view: View) => void }) {
  return <div className="modalLayer" onMouseDown={close}><div className="searchModal" onMouseDown={(e) => e.stopPropagation()}><div className="searchInput"><span>⌕</span><input autoFocus placeholder="Поиск студентов, клубов, событий..."/><kbd>ESC</kbd></div><p>БЫСТРЫЙ ПОИСК</p><button onClick={() => { close(); go("clubs"); }}><span className="searchGlyph">◎</span><div><b>EAGI Running</b><small>Клуб · 214 участников</small></div><em>→</em></button><button onClick={() => { close(); go("events"); }}><span className="searchGlyph yellow">◇</span><div><b>EAGI Welcome Day</b><small>Мероприятие · 24 августа</small></div><em>→</em></button><button onClick={() => { close(); go("rooms"); }}><span className="searchGlyph grey">▦</span><div><b>Конференц-зал</b><small>Помещение · 100 мест</small></div><em>→</em></button></div></div>;
}
