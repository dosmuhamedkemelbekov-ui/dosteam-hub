import AuthClient from "./auth-client";

export const dynamic = "force-dynamic";
export default async function AuthPage({ searchParams }:{ searchParams:Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  return <AuthClient confirmed={params.confirmed === "1"} returnTo={typeof params.return_to === "string" ? params.return_to : "/join"}/>;
}

