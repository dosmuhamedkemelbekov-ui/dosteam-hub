import { createClient } from "@supabase/supabase-js";
import { hubEnv } from "./runtime";

export function supabaseAuthClient() {
  const url = String(hubEnv.NEXT_PUBLIC_SUPABASE_URL || "");
  const key = String(hubEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "");
  if (!url || !key) throw new Error("Supabase Auth не настроен");
  return createClient(url, key, { auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } });
}

export function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("supabase auth не настроен")) return "Авторизация не настроена на сервере. Проверьте обе переменные Supabase в Cloudflare и нажмите Deploy";
  if (normalized.includes("invalid api key") || normalized.includes("apikey") || normalized.includes("api key")) return "Неверный Publishable Key Supabase. Скопируйте ключ целиком без пробелов";
  if (normalized.includes("fetch failed") || normalized.includes("failed to fetch") || normalized.includes("network")) return "Сервер временно не может связаться с Supabase. Повторите через минуту";
  if (normalized.includes("invalid login")) return "Неверный Gmail или пароль";
  if (normalized.includes("email not confirmed")) return "Сначала подтвердите Gmail по ссылке в письме";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) return "Этот Gmail уже зарегистрирован";
  if (normalized.includes("email") && normalized.includes("invalid")) return "Проверьте правильность Gmail";
  if (normalized.includes("signup") && normalized.includes("disabled")) return "Регистрация отключена в настройках Supabase Auth";
  if (normalized.includes("database error") || normalized.includes("saving new user")) return "Supabase не смог сохранить пользователя. Проверьте журналы Auth в Supabase";
  if (normalized.includes("redirect") && normalized.includes("not allowed")) return "Новый адрес сайта не добавлен в Redirect URLs проекта Supabase";
  if (normalized.includes("password")) return "Пароль должен содержать не менее 8 символов";
  if (normalized.includes("rate limit")) return "Слишком много попыток. Подождите немного";
  return "Не удалось выполнить вход. Проверьте данные и повторите";
}
