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
  if (normalized.includes("invalid login")) return "Неверный Gmail или пароль";
  if (normalized.includes("email not confirmed")) return "Сначала подтвердите Gmail по ссылке в письме";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) return "Этот Gmail уже зарегистрирован";
  if (normalized.includes("password")) return "Пароль должен содержать не менее 8 символов";
  if (normalized.includes("rate limit")) return "Слишком много попыток. Подождите немного";
  return "Не удалось выполнить вход. Проверьте данные и повторите";
}

