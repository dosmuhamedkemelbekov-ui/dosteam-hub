import { redirect } from "next/navigation";
import { getDosteamUser } from "./dosteam-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getDosteamUser();
  if (!user) redirect("/auth");
  redirect("/join");
}
