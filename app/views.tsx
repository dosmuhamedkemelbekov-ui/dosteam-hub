"use client";

import { useEffect, useState } from "react";
import { Avatar, type View } from "./hub";

type Go = (view: View) => void;

const eventCatalog = [
  { id: 1, title: "EAGI Welcome Day", category: "Комьюнити", day: "24", month: "авг", time: "16:00", place: "Конференц-зал", club: "DOSTEAM Community", free: 38, total: 120, reward: "+40 XP · +10 DC", color: "eventYellow" },
  { id: 2, title: "Open Run: 5K", category: "Спорт", day: "26", month: "авг", time: "18:30", place: "Триатлон парк", club: "EAGI Running", free: 14, total: 60, reward: "+35 XP · +10 DC", color: "eventBlue" },
  { id: 3, title: "От идеи к MVP", category: "Бизнес", day: "29", month: "авг", time: "17:00", place: "Аудитория 305", club: "Business Club", free: 22, total: 80, reward: "+50 XP · +10 DC", color: "eventOrange" },
  { id: 4, title: "Movie Night: Interstellar", category: "Культура", day: "02", month: "сен", time: "18:00", place: "Актовый зал", club: "Movie Club", free: 71, total: 150, reward: "+25 XP · +10 DC", color: "eventPurple" },
  { id: 5, title: "Debate Open Cup", category: "Образование", day: "05", month: "сен", time: "14:00", place: "Аудитория 201", club: "Debate Club", free: 16, total: 64, reward: "+80 XP · +20 DC", color: "eventRed" },
  { id: 6, title: "Volunteer Day", category: "Волонтёрство", day: "09", month: "сен", time: "10:00", place: "Сбор у ЕАГИ", club: "Qamqor", free: 45, total: 90, reward: "+100 XP · +30 DC", color: "eventGreen" },
];

const clubCatalog = [
  { name: "DOSTEAM Community", type: "Студенческое сообщество", followers: "1.2K", members: 486, posts: 92, letters: "DS", color: "#111", trend: "+12%" },
  { name: "EAGI Running", type: "Спорт и здоровье", followers: 824, members: 214, posts: 64, letters: "ER", color: "#2672ff", trend: "+18%" },
  { name: "Debate Club", type: "Дебаты и soft skills", followers: 532, members: 178, posts: 47, letters: "DC", color: "#7442d6", trend: "+7%" },
  { name: "Business Club", type: "Предпринимательство", followers: 445, members: 162, posts: 39, letters: "BC", color: "#e78b27", trend: "+21%" },
  { name: "Media Club", type: "Медиа и творчество", followers: 730, members: 96, posts: 108, letters: "MC", color: "#e04465", trend: "+9%" },
  { name: "Qamqor", type: "Волонтёрство", followers: 381, members: 128, posts: 55, letters: "Q", color: "#16956c", trend: "+14%" },
];

const leaderData = [
  [1,"Аружан Сәрсен","ЮТК-23","Амбассадор",8420,31,"AS"],[2,"Нұрдәулет Әли","ФК-24","Амбассадор",7980,28,"NA"],[3,"Айша Қанат","ПДР-23","Лидер",7650,26,"AQ"],
  [4,"Мирас Омар","ЭК-24","Лидер",6940,24,"MO"],[5,"Әмина Жақсы","ЮТК-24","Лидер",6310,22,"AJ"],[6,"Санжар Бек","ФК-23","Активист",5890,19,"SB"],
];

type CatalogEvent = { id:string|number; date:string; month:string; title:string; time:string; place:string; club:string; seats:number; total:number; reward:string; category:string; color:string; ticketCode?:string };
type ClubCard = { id?:string; name:string; type:string; followers:string|number; members:number; posts:number; letters:string; color:string; trend:string };

type LiveData = { events: Record<string, unknown>[]; clubs: Record<string, unknown>[]; rooms: Record<string, unknown>[]; summary: Record<string, unknown> };
function useLiveData() {
  const [data,setData]=useState<LiveData|null>(null);
  useEffect(()=>{fetch("/api/public").then(r=>r.json()).then(setData).catch(()=>setData({events:[],clubs:[],rooms:[],summary:{}}))},[]);
  return data;
}

export default function RoutedView({ view, go, flash }: { view: View; go: Go; flash: (message: string) => void }) {
  if (view === "events") return <EventsView flash={flash} />;
  if (view === "clubs") return <ClubsView flash={flash} />;
  if (view === "feed") return <FeedView flash={flash} />;
  if (view === "leaderboard") return <LeaderboardView />;
  if (view === "rooms") return <RoomsView flash={flash} />;
  if (view === "rewards") return <RewardsView flash={flash} />;
  if (view === "profile") return <ProfileView go={go} />;
  if (view === "admin") return <AdminView flash={flash} />;
  return null;
}

function PageIntro({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return <div className="pageIntro"><div><span>{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{action}</div>;
}

function EventsView({ flash }: { flash: (message: string) => void }) {
  const live=useLiveData(); const [filter,setFilter]=useState("Все"); const [ticket,setTicket]=useState<CatalogEvent|null>(null);
  const source=(live?.events||[]).map((e,i)=>{const d=new Date(Number(e.starts_at));return{id:String(e.id),date:String(d.getDate()).padStart(2,"0"),month:d.toLocaleString("ru-RU",{month:"short"}).replace(".",""),title:String(e.title),time:d.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"}),place:String(e.place_text||"ЕАГИ"),club:String(e.club_name||"DOSTEAM"),seats:Math.max(0,Number(e.capacity)-Number(e.registered||0)),total:Number(e.capacity),reward:`+${Number(e.xp_reward||0)} XP · +${Number(e.coin_reward||0)} DC`,category:String(e.category||"Другое"),color:["eventYellow","eventBlue","eventOrange","eventPurple"][i%4]}});
  const filtered=filter==="Все"?source:source.filter(e=>e.category===filter);
  const register=async(event:CatalogEvent)=>{const r=await fetch("/api/member",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"registerEvent",eventId:event.id,source:"hub"})});const result=await r.json();if(r.status===401||result.onboarding){window.location.assign("/join");return}if(!r.ok){flash(result.error||"Не удалось зарегистрироваться");return}setTicket({...event,ticketCode:result.ticketCode})};
  return <div className="pageContent"><PageIntro eyebrow="УЧАСТВУЙ И РАЗВИВАЙСЯ" title="Мероприятия" text="Выбирай активность, регистрируйся и получай XP и DC Coins." action={<button className="darkButton" onClick={()=>flash("Календарь добавлен в план")}>Мой календарь</button>}/>
    <div className="filterBar">{["Все","Спорт","Бизнес","Образование","Культура","Волонтёрство"].map(x=><button key={x} className={filter===x?"active":""} onClick={()=>setFilter(x)}>{x}</button>)}<div className="filterSearch">⌕ <input placeholder="Поиск событий"/></div></div>
    {!live?<LiveLoading/>:filtered.length?<div className="eventCatalog">{filtered.map((event)=><article className="eventTile" key={event.id}><div className={`eventPoster ${event.color}`}><span>{event.category}</span><div className="posterDate"><b>{event.date}</b><small>{event.month}</small></div><em>DOSTEAM<br/>HUB</em></div><div className="eventTileBody"><span>{event.club}</span><h3>{event.title}</h3><p>◷ {event.time} &nbsp; · &nbsp; ⌖ {event.place}</p><div className="capacity"><div><i style={{width:`${100-event.seats/event.total*100}%`}}/></div><small>{event.seats} свободно из {event.total}</small></div><div className="eventTileFoot"><b>{event.reward}</b><button onClick={()=>register(event)}>Зарегистрироваться</button></div></div></article>)}</div>:<LiveEmpty title="Пока нет опубликованных мероприятий" text="Как только организатор создаст событие, оно появится здесь."/>}
    {ticket&&<div className="modalLayer" onMouseDown={()=>setTicket(null)}><div className="ticketModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setTicket(null)}>×</button><div className="ticketBrand">DOSTEAM <span>HUB</span></div><p>ЭЛЕКТРОННЫЙ БИЛЕТ</p><h3>{ticket.title}</h3><div className="ticketMeta"><span><small>ДАТА И ВРЕМЯ</small>{ticket.date} {ticket.month}, {ticket.time}</span><span><small>МЕСТО</small>{ticket.place}</span><span><small>СТАТУС</small><b>REGISTERED</b></span><span><small>КОД</small>{ticket.ticketCode}</span></div>{ticket.ticketCode&&<img className="realQr" src={`/api/ticket/${ticket.ticketCode}`} alt="QR-код билета"/>}<small className="ticketCode">{ticket.ticketCode}</small><button className="primary wide" onClick={()=>window.location.assign("/join")}>Открыть мои билеты</button></div></div>}
  </div>;
}

function ClubsView({ flash }: { flash: (message: string) => void }) {
  const live=useLiveData(); const [following,setFollowing]=useState<string[]>([]); const [selected,setSelected]=useState<ClubCard|null>(null);
  const source=(live?.clubs||[]).map((c,i)=>({id:String(c.id),name:String(c.name),type:String(c.direction||"Сообщество"),followers:Number(c.followers||0),members:Number(c.members||0),posts:0,letters:String(c.name).split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase(),color:["#111","#2672ff","#7442d6","#e78b27","#16956c"][i%5],trend:"NEW"}));
  const memberAction=async(club:ClubCard,action:"followClub"|"joinClub")=>{const r=await fetch("/api/member",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,clubId:club.id})});const result=await r.json();if(r.status===401||result.onboarding){window.location.assign("/join");return}if(!r.ok){flash(result.error||"Не удалось выполнить действие");return}if(action==="followClub")setFollowing(x=>result.following?[...x.filter(n=>n!==club.name),club.name]:x.filter(n=>n!==club.name));else flash("Заявка отправлена — на рассмотрении")};
  return <div className="pageContent"><PageIntro eyebrow="НАЙДИ СВОИХ" title="Студенческие клубы" text="Подписывайся на новости или становись частью команды." action={<button className="primary" onClick={()=>flash("Форма нового клуба открыта")}>+ Создать клуб</button>}/>
    {source[0]&&<div className="clubHero"><div><span>НОВОЕ СООБЩЕСТВО</span><h3>{source[0].name}</h3><p>{source[0].type}. Следи за новостями и становись частью команды.</p><button onClick={()=>setSelected(source[0])}>Открыть клуб →</button></div><strong>JOIN<br/><i>THE</i><br/>TEAM.</strong></div>}
    <div className="catalogHead"><h3>Все клубы <span>{source.length}</span></h3><div className="filterSearch">⌕ <input placeholder="Найти клуб"/></div></div>
    {!live?<LiveLoading/>:source.length?<div className="clubCatalog">{source.map(club=><article key={club.name}><div className="clubCover" style={{background:club.color}}><span>{club.letters}</span><em>{club.trend}</em></div><div className="clubBody"><h3>{club.name}</h3><p>{club.type}</p><div className="clubNumbers"><span><b>{club.followers}</b> подписчиков</span><span><b>{club.members}</b> участников</span><span><b>{club.posts}</b> постов</span></div><div className="clubActions"><button className={following.includes(club.name)?"following":""} onClick={()=>memberAction(club,"followClub")}>{following.includes(club.name)?"✓ Подписан":"Подписаться"}</button><button onClick={()=>setSelected(club)}>Вступить</button></div></div></article>)}</div>:<LiveEmpty title="Клубов пока нет" text="После создания первого клуба в Admin Panel он появится здесь."/>}
    {selected&&<div className="modalLayer" onMouseDown={()=>setSelected(null)}><div className="clubProfileModal" onMouseDown={e=>e.stopPropagation()}><button className="modalClose" onClick={()=>setSelected(null)}>×</button><div className="clubProfileTop" style={{background:selected.color}}><div className="bigClubLogo">{selected.letters}</div><span>{selected.type}</span></div><h2>{selected.name}</h2><p>Открытое сообщество студентов ЕАГИ, где идеи превращаются в проекты, а знакомства — в сильные команды.</p><div className="clubProfileStats"><span><b>{selected.followers}</b>Подписчиков</span><span><b>{selected.members}</b>Участников</span><span><b>{selected.posts}</b>Постов</span></div><div className="tabs"><button className="active">Посты</button><button>Мероприятия</button><button>Участники</button><button>О клубе</button></div><div className="miniPost"><b>📢 Открыт набор в команду!</b><p>Расскажи о себе и выбери направление, в котором хочешь развиваться.</p></div><button className="primary wide" onClick={()=>{void memberAction(selected,"joinClub");setSelected(null)}}>Отправить заявку на вступление</button></div></div>}
  </div>;
}

function FeedView({ flash }: { flash: (message: string) => void }) {
  const [tab,setTab]=useState("Подписки"); const [posts,setPosts]=useState<Record<string,unknown>[]|null>(null); const [commentFor,setCommentFor]=useState(""); const [comment,setComment]=useState(""); const [commentRows,setCommentRows]=useState<Record<string,Record<string,unknown>[]>>({});
  const load=()=>fetch(`/api/social?feed=${tab==="Подписки"?"following":"for-you"}`).then(r=>r.json()).then(x=>setPosts(x.posts||[])).catch(()=>setPosts([]));
  useEffect(()=>{setPosts(null);void load()},[tab]);
  const act=async(payload:Record<string,unknown>)=>{const r=await fetch("/api/social",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await r.json();if(r.status===401||result.onboarding){window.location.assign("/join");return false}if(!r.ok){flash(result.error||"Не удалось выполнить действие");return false}await load();return true};
  const openComments=async(id:string)=>{if(commentFor===id){setCommentFor("");return}setCommentFor(id);const r=await fetch(`/api/social?postId=${encodeURIComponent(id)}`);const result=await r.json();setCommentRows(x=>({...x,[id]:result.comments||[]}))};
  return <div className="pageContent feedPage"><PageIntro eyebrow="ВСЁ ВАЖНОЕ — ЗДЕСЬ" title="Моя лента" text="Новости клубов, события и рекомендации на основе твоих интересов."/>
    <div className="feedTabs"><button className={tab==="Подписки"?"active":""} onClick={()=>setTab("Подписки")}>Подписки</button><button className={tab==="Для вас"?"active":""} onClick={()=>setTab("Для вас")}>Для вас</button></div>
    <div className="feedLayout"><div className="posts">{posts===null?<LiveLoading/>:posts.length?posts.map((post,i)=>{const media=firstMedia(post.media_json);const id=String(post.id);const color=["#111","#216df3","#7442d6","#d27d22"][i%4];return <article className="post" key={id}><header><div className="clubLogo" style={{background:color}}>{String(post.club_name).split(/\s+/).map(x=>x[0]).join("").slice(0,2)}</div><div><b>{String(post.club_name)}</b><span>{new Date(Number(post.published_at)).toLocaleString("ru-RU")}</span></div><button>•••</button></header><p>{String(post.body)}</p>{media?<div className="postMedia">{media.type.startsWith("video/")?<video src={media.url} controls/>:<img src={media.url} alt="Публикация клуба"/>}</div>:<div className="postVisual" style={{background:color}}><strong>{String(post.club_name).toUpperCase()}</strong><strong>DOSTEAM HUB</strong></div>}<footer><button className={Number(post.liked)?"liked":""} onClick={()=>act({action:"react",type:"like",postId:id})}>♥ {Number(post.likes||0)}</button><button onClick={()=>openComments(id)}>◯ {Number(post.comments||0)}</button><button onClick={()=>{void navigator.clipboard?.writeText(`${location.origin}/?post=${id}`);flash("Ссылка скопирована")}}>↗ Поделиться</button><button className="save" onClick={()=>act({action:"react",type:"save",postId:id})}>{Number(post.saved)?"▣":"▢"}</button></footer>{commentFor===id&&<div className="commentArea"><div className="commentList">{(commentRows[id]||[]).map(c=><div key={String(c.id)}><span>{String(c.full_name).split(" ").map(x=>x[0]).slice(0,2).join("")}</span><p><b>{String(c.full_name)}</b>{String(c.body)}</p></div>)}</div><div className="commentComposer"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Написать комментарий…"/><button onClick={async()=>{if(await act({action:"comment",postId:id,body:comment})){setComment("");await openComments(id);await openComments(id);flash("Комментарий опубликован")}}}>Отправить</button></div></div>}</article>}):<LiveEmpty title={tab==="Подписки"?"Лента подписок пока пустая":"Публикаций пока нет"} text="Создайте первую публикацию клуба в Admin Panel."/>}</div>
      <aside className="feedAside"><div className="asideCard"><span>ТВОЙ ПРОФИЛЬ</span><h3>Присоединяйся к HUB</h3><div className="suggestLogo">ID</div><b>Digital Student ID</b><p>Получай билеты, XP, Coins и достижения за реальную активность.</p><button onClick={()=>window.location.assign("/join")}>Открыть мой HUB</button></div><div className="asideCard compact"><span>ДЛЯ ОРГАНИЗАТОРОВ</span><h3>QR Scanner</h3><p>Фиксируй посещаемость в один клик.</p><button onClick={()=>window.location.assign("/scan")}>Открыть →</button></div></aside>
    </div>
  </div>;
}

function LeaderboardView() {
  const [period,setPeriod]=useState("Семестр");
  return <div className="pageContent"><PageIntro eyebrow="АКТИВНОСТЬ, КОТОРАЯ ВИДНА" title="Рейтинг студентов" text="Рейтинг строится на XP, заработанном за реальное участие в жизни ЕАГИ."/>
    <div className="rankFilters"><div>{["Общий","Факультет","Группа","Клуб"].map(x=><button className={x==="Общий"?"active":""} key={x}>{x}</button>)}</div><select value={period} onChange={e=>setPeriod(e.target.value)}><option>Месяц</option><option>Семестр</option><option>Учебный год</option></select></div>
    <div className="podium"><div className="podiumPerson second"><Avatar text="NA"/><i>2</i><b>Нұрдәулет Әли</b><span>7 980 XP</span></div><div className="podiumPerson first"><div className="crown">♛</div><Avatar text="AS"/><i>1</i><b>Аружан Сәрсен</b><span>8 420 XP</span></div><div className="podiumPerson third"><Avatar text="AQ"/><i>3</i><b>Айша Қанат</b><span>7 650 XP</span></div></div>
    <section className="rankTable"><header><span>МЕСТО</span><span>СТУДЕНТ</span><span>УРОВЕНЬ</span><span>ДОСТИЖЕНИЯ</span><span>XP</span></header>{leaderData.map(r=><div key={r[0]}><strong>{r[0]}</strong><span className="rankStudent"><Avatar text={String(r[6])} small/><b>{r[1]}<small>{r[2]}</small></b></span><span><em>{r[3]}</em></span><span>{r[5]}</span><b>{Number(r[4]).toLocaleString("ru-RU")}</b></div>)}<div className="myRank"><strong>12</strong><span className="rankStudent"><Avatar text="DK" small/><b>Досмухамед <i>ВЫ</i><small>ЮТК-25</small></b></span><span><em>Лидер</em></span><span>14</span><b>2 450</b></div></section>
  </div>;
}

function RoomsView({ flash }: { flash: (message: string) => void }) {
  const live=useLiveData(); const rooms=(live?.rooms||[]).map(r=>({name:String(r.name),cap:Number(r.capacity),equip:(()=>{try{return(JSON.parse(String(r.equipment_json)) as string[]).join(" · ")}catch{return""}})(),busy:0})); const [selected,setSelected]=useState(""); const current=selected||rooms[0]?.name||"Помещение";
  return <div className="pageContent"><PageIntro eyebrow="ПЛАНИРУЙ БЕЗ НАКЛАДОК" title="Бронирование помещений" text="Выбери свободное время и отправь заявку администратору." action={<button className="primary" onClick={()=>flash("Заявка создана — заполните детали")}>+ Новая заявка</button>}/>
    {!live?<LiveLoading/>:rooms.length?<div className="roomLayout"><div className="roomList">{rooms.map(r=><button className={current===r.name?"active":""} onClick={()=>setSelected(r.name)} key={r.name}><div className="roomIcon">▦</div><div><b>{r.name}</b><span>До {r.cap} человек · {r.equip||"Без оборудования"}</span></div><em>Доступно</em></button>)}</div><section className="scheduleCard"><header><div><span>РАСПИСАНИЕ</span><h3>{current}</h3></div><input type="date" defaultValue="2026-08-24"/></header><div className="timeGrid">{["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t=><button key={t} className="free"><b>{t}</b><span>Свободно</span></button>)}</div><div className="scheduleLegend"><span><i className="free"/>Свободно</span><span><i className="busy"/>Занято</span></div></section></div>:<LiveEmpty title="Помещения не добавлены" text="Администратор добавит аудитории и конференц-залы — после этого откроется расписание."/>}
  </div>;
}

function firstMedia(value:unknown){try{const list=JSON.parse(String(value||"[]")) as (string|{url:string;type:string})[];const first=list[0];return typeof first==="string"?{url:first,type:"image/jpeg"}:first||null}catch{return null}}
function LiveLoading(){return <div className="liveState"><i>···</i><p>Загружаем данные HUB</p></div>}
function LiveEmpty({title,text}:{title:string;text:string}){return <div className="liveState"><i>＋</i><h3>{title}</h3><p>{text}</p><a href="/manage">Открыть Admin Panel →</a></div>}

function RewardsView({ flash }: { flash: (message: string) => void }) {
  const transactions=[['+30','Волонтёрство на EAGI CUP','18 авг','plus'],['-250','Худи DOSTEAM','15 авг','minus'],['+10','Участие в Debate Night','12 авг','plus'],['+50','Организация Movie Night','08 авг','plus']];
  return <div className="pageContent"><PageIntro eyebrow="ТВОЯ АКТИВНОСТЬ — ТВОЯ ВАЛЮТА" title="DC Coins & Rewards" text="Coins можно тратить. XP остаётся с тобой и определяет уровень."/>
    <div className="walletHero"><div><span>ТЕКУЩИЙ БАЛАНС</span><h2>1 280 <small>DC</small></h2><p>+90 DC в этом месяце</p></div><div className="coinBig">D</div><button onClick={()=>flash("QR-карта участника открыта")}>Моя карта →</button></div>
    <div className="rewardLayout"><section className="sectionCard"><div className="sectionHead"><div><span>ИСТОРИЯ</span><h3>Операции</h3></div><button>Все операции →</button></div>{transactions.map((t,i)=><div className="transaction" key={i}><span className={t[3]}>{t[0]}</span><div><b>{t[1]}</b><small>{t[2]} 2026 · Подтверждено</small></div><em>DC</em></div>)}</section><section className="sectionCard earning"><div className="sectionHead"><div><span>КАК ЗАРАБОТАТЬ</span><h3>Активности</h3></div></div><div><span>◇<b>Участие</b><em>+10 DC</em></span><span>♡<b>Волонтёрство</b><em>+30 DC</em></span><span>✦<b>Организация</b><em>+50 DC</em></span><span>♛<b>Победа</b><em>+100 DC</em></span></div></section></div>
    <div className="catalogHead"><h3>Магазин наград</h3><button>Все награды →</button></div><div className="rewardCatalog">{[['Худи DOSTEAM','750','hoodie'],['Шоппер HUB','350','bag'],['Закрытая встреча','500','access'],['Приоритетная бронь','300','room']].map((r,i)=><article key={r[0]}><div className={`rewardArt ${r[2]}`}>{i===0?'D':i===1?'DOSTEAM':i===2?'VIP':'▦'}</div><h3>{r[0]}</h3><p>{i<2?'Лимитированный мерч':'Специальная привилегия'}</p><button onClick={()=>flash(`${r[0]} добавлен в заявку`)}>{r[1]} DC</button></article>)}</div>
  </div>;
}

function ProfileView({ go }: { go: Go }) {
  const badges=[['★','Сила команды','gold'],['10','10 мероприятий','violet'],['♡','Волонтёр','green'],['↗','Лидер клуба','blue'],['⚡','Спортивный активист','orange'],['?','Амбассадор ЕАГИ','locked']];
  return <div className="pageContent"><div className="profileHero"><div className="profileAvatar">DK<span>✓</span></div><div><span>ЦИФРОВОЙ ПРОФИЛЬ СТУДЕНТА</span><h2>Досмухамед Кемелбеков</h2><p>ЮТК-25 · Юриспруденция · 3 курс</p><div className="profileChips"><b>Level 7 · Leader</b><b>#12 в рейтинге</b><b>23 события</b></div></div><button>Поделиться профилем ↗</button></div>
    <div className="profileGrid"><section className="sectionCard profileLevel"><div className="levelTop light"><span>ПРОГРЕСС УРОВНЯ</span><b>72%</b></div><h3>2 450 <small>XP</small></h3><div className="progress light"><i style={{width:'72%'}}/></div><p>Ещё 550 XP до уровня «Амбассадор»</p><div className="levelPath"><span className="done">✓<b>Активист</b></span><i/><span className="current">7<b>Лидер</b></span><i/><span>8<b>Амбассадор</b></span></div></section><section className="sectionCard profileCoin"><span>БАЛАНС</span><h3>1 280 <small>DC Coins</small></h3><p>За всё время заработано 2 640 DC</p><button onClick={()=>go('rewards')}>Открыть Rewards →</button></section></div>
    <section className="sectionCard badgeSection"><div className="sectionHead"><div><span>ЦИФРОВАЯ КОЛЛЕКЦИЯ</span><h3>Достижения <i>14</i></h3></div><button>Смотреть все →</button></div><div className="badgeGrid">{badges.map(b=><div className={b[2]} key={b[1]}><span>{b[0]}</span><b>{b[1]}</b><small>{b[2]==='locked'?'Ещё не открыто':'Получено'}</small></div>)}</div></section>
    <div className="profileColumns"><section className="sectionCard"><div className="sectionHead"><div><span>МОИ СООБЩЕСТВА</span><h3>Мой HUB</h3></div></div><div className="myClubRow"><div className="clubLogo">DS</div><div><b>DOSTEAM Community</b><span>Участник · Организатор</span></div><em>Участник</em></div><div className="myClubRow"><div className="clubLogo blueBg">ER</div><div><b>EAGI Running</b><span>Участник</span></div><em>Участник</em></div><div className="myClubRow"><div className="clubLogo purpleBg">DC</div><div><b>Debate Club</b><span>Подписка на новости</span></div><em>Подписан</em></div><div className="myClubRow"><div className="clubLogo pinkBg">MC</div><div><b>Media Club</b><span>Заявка отправлена 20 августа</span></div><em className="pending">На рассмотрении</em></div></section><section className="sectionCard activityTimeline"><div className="sectionHead"><div><span>ПОРТФОЛИО</span><h3>Последняя активность</h3></div></div>{[['18 авг','Волонтёр · EAGI CUP','+120 XP · +30 DC'],['12 авг','Участник · Debate Night','+35 XP · +10 DC'],['08 авг','Организатор · Movie Night','+150 XP · +50 DC'],['02 авг','Участник · Open Run','+40 XP · +10 DC']].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><em>{x[2]}</em></div>)}</section></div>
  </div>;
}

function AdminView({ flash }: { flash: (message: string) => void }) {
  const [section,setSection]=useState('Обзор'); const adminNav=['Обзор','Студенты','Мероприятия','Клубы','Помещения','Coins','Достижения','Аналитика','Настройки'];
  const bars=[42,58,51,76,63,82,74,91,86,96,88,100];
  return <div className="pageContent adminPage"><PageIntro eyebrow="DOSTEAM CONTROL CENTER" title="Панель администратора" text="Единая картина студенческой активности в реальном времени." action={<div className="livePill"><i/> Данные обновлены сейчас</div>}/>
    <div className="adminNav">{adminNav.map(x=><button key={x} className={section===x?'active':''} onClick={()=>setSection(x)}>{x}</button>)}</div>
    <div className="adminMetrics">{[['2 847','Студентов','+124 за месяц','students'],['126','Мероприятий','18 предстоящих','events'],['34','Активных клуба','5 заявок','clubs'],['78%','Посещаемость','+6.4% к семестру','rate'],['42.8K','DC Coins выдано','18.2K потрачено','coins'],['67%','Загрузка помещений','24 бронирования','rooms']].map(x=><article key={x[1]}><span className={x[3]}>◇</span><div><small>{x[1]}</small><b>{x[0]}</b><p>{x[2]}</p></div></article>)}</div>
    <div className="analyticsGrid"><section className="sectionCard chartCard"><div className="sectionHead"><div><span>ENGAGEMENT</span><h3>Активность студентов</h3></div><select><option>Последние 30 дней</option></select></div><div className="chartLegend"><span><i className="yellowDot"/>Регистрации</span><span><i className="darkDot"/>Посещения</span></div><div className="barChart">{bars.map((b,i)=><div key={i}><i style={{height:`${b}%`}}/><em style={{height:`${b*.72}%`}}/><small>{i%2===0?`${i+1} авг`:''}</small></div>)}</div></section><section className="sectionCard attendanceCard"><div className="sectionHead"><div><span>КОНВЕРСИЯ</span><h3>Посещаемость</h3></div></div><div className="attendanceDonut"><div><b>78%</b><span>Attendance rate</span></div></div><div className="attendRows"><span><i className="reg"/>Registered <b>3 842</b></span><span><i className="att"/>Attended <b>2 997</b></span><span><i className="no"/>No-show <b>845</b></span></div></section></div>
    <div className="adminBottom"><section className="sectionCard"><div className="sectionHead"><div><span>ТРЕБУЮТ РЕШЕНИЯ</span><h3>Новые заявки</h3></div><button>Все заявки →</button></div>{[['Новый клуб','EAGI Tech Club','Сегодня, 14:20'],['Бронирование','Актовый зал · 27 августа','Сегодня, 12:05'],['Новый клуб','Photography Club','Вчера, 18:40']].map((x,i)=><div className="requestRow" key={x[1]}><span>{i===1?'▦':'◎'}</span><div><small>{x[0]}</small><b>{x[1]}</b><em>{x[2]}</em></div><button onClick={()=>flash(`${x[1]} — одобрено`)}>Одобрить</button><button onClick={()=>flash(`${x[1]} — отклонено`)}>×</button></div>)}</section><section className="sectionCard"><div className="sectionHead"><div><span>БЛИЖАЙШЕЕ</span><h3>События сегодня</h3></div></div>{[['16:00','Welcome Day','87 / 120'],['17:30','Club Leaders Meetup','24 / 30'],['18:30','Open Run','46 / 60']].map(x=><div className="adminEvent" key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><em>{x[2]}</em></div>)}</section></div>
  </div>;
}
