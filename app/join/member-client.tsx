"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Row=Record<string,string|number|null>;
type Member={onboarding?:boolean;error?:string;profile?:Row;tickets?:Row[];memberships?:Row[];follows?:Row[];notifications?:Row[]};
const interestOptions=["Спорт","Бизнес","Дебаты","Медиа","Волонтёрство","Культура"];

function parseInterests(value:unknown){try{return JSON.parse(String(value||"[]")) as string[]}catch{return[]}}
function initials(name:unknown){return String(name||"S").split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase()||"S"}

export default function MemberClient({authName,authEmail}:{authName:string;authEmail:string}){
  const [data,setData]=useState<Member|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [ticket,setTicket]=useState<Row|null>(null);
  const [editing,setEditing]=useState(false);
  const load=useCallback(()=>fetch("/api/member").then(r=>r.json()).then(setData).catch(()=>setData({error:"Не удалось загрузить профиль"})),[]);
  useEffect(()=>{void load()},[load]);

  async function uploadAvatar(file:FormDataEntryValue|null){
    if(!(file instanceof File)||!file.size)return "";
    const up=new FormData();up.set("file",file);up.set("purpose","avatar");
    const response=await fetch("/api/uploads",{method:"POST",body:up});
    const result=await response.json() as {url?:string;error?:string};
    if(!response.ok)throw new Error(result.error||"Не удалось загрузить фотографию");
    return result.url||"";
  }

  async function submitProfile(event:FormEvent<HTMLFormElement>,action:"onboard"|"updateProfile"){
    event.preventDefault();setBusy(true);setMessage("");
    try{
      const fd=new FormData(event.currentTarget);
      const avatarUrl=await uploadAvatar(fd.get("avatar"));
      const payload:Record<string,unknown>={action,fullName:fd.get("fullName"),studentId:fd.get("studentId"),groupName:fd.get("groupName"),course:fd.get("course"),faculty:fd.get("faculty"),bio:fd.get("bio"),interests:fd.getAll("interests"),isPublic:fd.get("isPublic")==="on"};
      if(avatarUrl)payload.avatarUrl=avatarUrl;
      if(fd.get("removeAvatar")==="on")payload.avatarUrl="";
      const response=await fetch("/api/member",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||"Не удалось сохранить профиль");
      await load();setEditing(false);setMessage(action==="onboard"?"Профиль создан":"Изменения сохранены");
    }catch(error){setMessage(error instanceof Error?error.message:"Не удалось сохранить профиль")}
    finally{setBusy(false)}
  }

  if(!data)return <div className="memberLoading"><div className="brandMark"><span>D</span></div><p>Открываем твой HUB…</p></div>;
  if(data.onboarding)return <main className="onboardPage"><section><a href="/join" className="manageBrand"><div className="brandMark"><span>D</span></div><div><b>DOSTEAM</b><small>STUDENT HUB</small></div></a><div><span>ЦИФРОВОЙ STUDENT ID</span><h1>Создай свой профиль<br/>в DOSTEAM HUB.</h1><p>После регистрации ты сможешь вступать в клубы, получать QR-билеты, XP, DC Coins и достижения.</p></div><small>Вход подтверждён: {authEmail}</small></section><form onSubmit={e=>submitProfile(e,"onboard")}><span>РЕГИСТРАЦИЯ СТУДЕНТА</span><h2>Расскажи о себе</h2><p>Имя не подставляется из Gmail автоматически — укажи его так, как оно должно отображаться в HUB.</p><ProfileFields defaults={{full_name:authName,is_public:1}} email={authEmail}/>{message&&<p className="formError">{message}</p>}<button className="primary wide" disabled={busy}>{busy?"Создаём профиль…":"Создать мой HUB →"}</button></form></main>;

  const p=data.profile||{};
  return <main className="memberPage">
    <header><a href="/hub" className="manageBrand"><div className="brandMark"><span>D</span></div><div><b>DOSTEAM</b><small>MY HUB</small></div></a><nav><a className="memberHubLink" href="/hub">В HUB ↗</a><a href="#tickets">Билеты</a><a href="#clubs">Клубы</a><a href="/api/auth/logout">Выйти</a></nav></header>
    <section className="memberHero"><button className="memberAvatar avatarEdit" onClick={()=>setEditing(true)} aria-label="Изменить фотографию">{p.avatar_url?<img src={String(p.avatar_url)} alt="Фотография профиля"/>:initials(p.full_name)}<span>✎</span></button><div><span>ЦИФРОВОЙ ПРОФИЛЬ</span><h1>{p.full_name}</h1><p>{p.group_name} · {p.faculty||"ЕАГИ"} · {p.course||1} курс</p><div><b>Level · {p.level_name||"Новичок"}</b><b>{p.xp||0} XP</b><b>{p.coin_balance||0} DC</b></div><button className="editProfileButton" onClick={()=>setEditing(true)}>Редактировать профиль</button>{message&&<small className="profileSaved">{message}</small>}</div></section>
    <div className="memberGrid"><section id="tickets" className="memberCard wideCard"><header><div><span>МОИ СОБЫТИЯ</span><h2>Электронные билеты</h2></div><a href="/hub">Найти мероприятие →</a></header>{(data.tickets||[]).length?(data.tickets||[]).map(t=><button className="ticketRow" key={String(t.ticket_code)} onClick={()=>setTicket(t)}><div><b>{new Date(Number(t.starts_at)).getDate()}</b><span>{new Date(Number(t.starts_at)).toLocaleString("ru-RU",{month:"short"})}</span></div><p><b>{t.title}</b><span>{new Date(Number(t.starts_at)).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})} · {t.place_text||"ЕАГИ"}</span></p><em className={String(t.status)}>{t.status}</em><strong>QR →</strong></button>):<EmptyMini title="Билетов пока нет" text="Зарегистрируйся на первое мероприятие."/>}</section><section id="clubs" className="memberCard"><header><div><span>МОИ КЛУБЫ</span><h2>Участие</h2></div></header>{(data.memberships||[]).map(m=><div className="memberClub" key={String(m.id)}><span>◎</span><div><b>{m.name}</b><small>{m.direction}</small></div><em>{m.status}</em></div>)}{!(data.memberships||[]).length&&<EmptyMini title="Заявок пока нет" text="Выбери клуб и отправь заявку."/>}</section><section className="memberCard"><header><div><span>УВЕДОМЛЕНИЯ</span><h2>Последнее</h2></div></header>{(data.notifications||[]).slice(0,5).map(n=><div className="memberNotice" key={String(n.id)}><span>✦</span><div><b>{n.title}</b><small>{n.body}</small></div></div>)}{!(data.notifications||[]).length&&<EmptyMini title="Пока тихо" text="Здесь появятся важные обновления."/>}</section></div>
    {editing&&<div className="modalLayer" onMouseDown={()=>setEditing(false)}><form className="profileEditor" onSubmit={e=>submitProfile(e,"updateProfile")} onMouseDown={e=>e.stopPropagation()}><button type="button" className="editorClose" onClick={()=>setEditing(false)}>×</button><span>НАСТРОЙКИ ПРОФИЛЯ</span><h2>Редактировать данные</h2><p>Фотография, имя и остальные изменения сразу появятся в личном кабинете и рейтинге.</p><ProfileFields defaults={p} email={authEmail} editing/>{message&&<p className="formError">{message}</p>}<div className="editorActions"><button type="button" onClick={()=>setEditing(false)}>Отмена</button><button className="primary" disabled={busy}>{busy?"Сохраняем…":"Сохранить изменения"}</button></div></form></div>}
    {ticket&&<div className="modalLayer" onMouseDown={()=>setTicket(null)}><div className="realTicket" onMouseDown={e=>e.stopPropagation()}><button onClick={()=>setTicket(null)}>×</button><span>DOSTEAM HUB · E-TICKET</span><h2>{ticket.title}</h2><img src={`/api/ticket/${ticket.ticket_code}`} alt="QR-код билета"/><b>{ticket.ticket_code}</b><p>{p.full_name} · {p.group_name}</p><small>Покажите QR-код организатору при входе</small></div></div>}
  </main>;
}

function ProfileFields({defaults,email,editing=false}:{defaults:Row;email:string;editing?:boolean}){
  const interests=parseInterests(defaults.interests_json);
  return <><label>Фотография<input type="file" name="avatar" accept="image/png,image/jpeg,image/webp"/></label>{editing&&defaults.avatar_url&&<label className="inlineCheck"><input type="checkbox" name="removeAvatar"/> Удалить текущую фотографию</label>}<div className="formPair"><label>Имя и фамилия<input name="fullName" defaultValue={String(defaults.full_name||"")} required placeholder="Досмухамед Кемелбеков"/></label><label>Студенческий ID<input name="studentId" defaultValue={String(defaults.student_id||"")} placeholder="EAGI-2026-001" required/></label><label>Группа<input name="groupName" defaultValue={String(defaults.group_name||"")} placeholder="ЮТК-25" required/></label><label>Курс<select name="course" defaultValue={String(defaults.course||1)}>{[1,2,3,4].map(x=><option key={x}>{x}</option>)}</select></label></div><label>Факультет<input name="faculty" defaultValue={String(defaults.faculty||"")} placeholder="Юридический факультет"/></label>{editing&&<label>Gmail<input value={email} readOnly disabled/><small>Gmail используется для входа и меняется отдельно.</small></label>}<label>Коротко о себе<textarea name="bio" defaultValue={String(defaults.bio||"")} placeholder="Интересы, проекты, цели…"/></label><fieldset><legend>Интересы</legend>{interestOptions.map(x=><label key={x}><input type="checkbox" name="interests" value={x} defaultChecked={interests.includes(x)}/>{x}</label>)}</fieldset><label className="inlineCheck"><input type="checkbox" name="isPublic" defaultChecked={Number(defaults.is_public??1)===1}/> Показывать профиль в рейтинге</label></>;
}

function EmptyMini({title,text}:{title:string;text:string}){return <div className="emptyMini"><i>＋</i><b>{title}</b><span>{text}</span></div>}
