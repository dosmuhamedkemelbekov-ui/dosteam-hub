"use client";
import { FormEvent, useState } from "react";

type Mode = "login" | "register" | "recover" | "mfa";
type Mfa = { setup:boolean;factorId:string;challengeId:string;qrCode?:string|null;secret?:string|null };

export default function AuthClient({ confirmed, returnTo }:{confirmed:boolean;returnTo:string}) {
  const [mode,setMode]=useState<Mode>("login");
  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [code,setCode]=useState("");
  const [mfa,setMfa]=useState<Mfa|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState(confirmed?"Gmail подтверждён. Теперь войдите в аккаунт.":"");
  const [error,setError]=useState("");

  async function submit(event:FormEvent) {
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try {
      const endpoint=mode==="register"?"register":mode==="recover"?"recover":mode==="mfa"?"mfa":"login";
      const payload=mode==="mfa"?{code,factorId:mfa?.factorId,challengeId:mfa?.challengeId}:mode==="register"?{fullName,email,password}:{email,password,returnTo};
      const response=await fetch(`/api/auth/${endpoint}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json() as Record<string,unknown>;
      if(!response.ok)throw new Error(String(data.error||"Не удалось выполнить действие"));
      if(mode==="register") {setMode("login");setPassword("");setConfirm("");setMessage("Аккаунт создан. Проверьте Gmail и подтвердите адрес по ссылке в письме.");return;}
      if(mode==="recover") {setMode("login");setMessage("Ссылка для смены пароля отправлена на Gmail.");return;}
      if(data.mfaRequired) {setMfa({setup:Boolean(data.setup),factorId:String(data.factorId),challengeId:String(data.challengeId),qrCode:data.qrCode as string|null,secret:data.secret as string|null});setMode("mfa");return;}
      window.location.assign(String(data.returnTo||"/join"));
    } catch (caught) {setError(caught instanceof Error?caught.message:"Произошла ошибка");}
    finally {setBusy(false);}
  }

  const title=mode==="register"?"Создать аккаунт":mode==="recover"?"Восстановить пароль":mode==="mfa"?"Код администратора":"Вход в личный кабинет";
  return <main className="authPage">
    <section className="authBrand"><a className="brand" href="/auth"><span className="brandMark"><b>D</b></span><b>DOSTEAM</b><small>STUDENT HUB · ЕАГИ</small></a><div><span>ЕДИНАЯ ЦИФРОВАЯ ЭКОСИСТЕМА</span><h1>Твоя студенческая<br/>жизнь — <em>здесь.</em></h1><p>Мероприятия, клубы, билеты, достижения, XP и DC Coins в одном защищённом личном кабинете.</p><div className="authStats"><span><b>01</b>Создай аккаунт</span><span><b>02</b>Заполни профиль</span><span><b>03</b>Открой HUB</span></div></div><small>© 2026 DOSTEAM · ЕАГИ</small></section>
    <section className="authCard">
      <div className="mobileAuthLogo"><a className="brand" href="/auth"><span className="brandMark"><b>D</b></span><b>DOSTEAM</b><small>STUDENT HUB</small></a></div>
      <span>{mode==="mfa"?"ЗАЩИЩЁННЫЙ ДОСТУП":"ЛИЧНЫЙ КАБИНЕТ"}</span><h2>{title}</h2>
      <p>{mode==="register"?"Используйте свой Gmail и придумайте пароль для DOSTEAM.":mode==="recover"?"Мы отправим защищённую ссылку на Gmail.":mode==="mfa"?(mfa?.setup?"Подключите приложение-аутентификатор и введите код.":"Введите одноразовый код из приложения-аутентификатора."):"Сначала войдите — затем откроется ваш персональный HUB."}</p>
      {message&&<div className="authNotice success">{message}</div>}{error&&<div className="authNotice error">{error}</div>}
      <form onSubmit={submit}>
        {mode==="register"&&<><label>ИМЯ И ФАМИЛИЯ<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" required placeholder="Досмухамед Кемелбеков"/></label></>}
        {mode!=="mfa"&&<label>GMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="student@gmail.com"/></label>}
        {(mode==="login"||mode==="register")&&<label>ПАРОЛЬ<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} autoComplete={mode==="register"?"new-password":"current-password"} required placeholder="Не менее 8 символов"/></label>}
        {mode==="register"&&<label>ПОВТОРИТЕ ПАРОЛЬ<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8} autoComplete="new-password" required placeholder="Повторите пароль"/></label>}
        {mode==="mfa"&&mfa?.setup&&<div className="mfaSetup">{mfa.qrCode&&<img src={mfa.qrCode} alt="QR-код настройки двухэтапной защиты"/>}<p>Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator или 1Password.</p>{mfa.secret&&<details><summary>Ввести ключ вручную</summary><code>{mfa.secret}</code></details>}</div>}
        {mode==="mfa"&&<label>ОДНОРАЗОВЫЙ КОД<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} autoComplete="one-time-code" required placeholder="000000"/></label>}
        <button className="primary" disabled={busy||Boolean(mode==="register"&&password!==confirm)}>{busy?"Проверяем…":mode==="register"?"Зарегистрироваться":mode==="recover"?"Отправить ссылку":mode==="mfa"?"Подтвердить код":"Войти"}</button>
      </form>
      {mode==="login"&&<button className="textButton" onClick={()=>{setMode("recover");setError("");setMessage("")}}>Забыли пароль?</button>}
      {mode!=="mfa"&&<div className="authSwitch">{mode==="login"?<>Нет аккаунта? <button onClick={()=>{setMode("register");setError("");setMessage("")}}>Создать</button></>:<>Уже есть аккаунт? <button onClick={()=>{setMode("login");setError("");setMessage("")}}>Войти</button></>}</div>}
      {mode==="mfa"&&<button className="textButton" onClick={()=>{setMode("login");setMfa(null);setCode("")}}>Начать вход заново</button>}
      <small>Пароль относится только к DOSTEAM HUB. Пароль от вашей почты Gmail вводить не нужно.</small>
    </section>
  </main>;
}

