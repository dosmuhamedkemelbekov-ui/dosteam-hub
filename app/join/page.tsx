import { requireDosteamUser } from "../dosteam-auth";
import MemberClient from "./member-client";

export const dynamic = "force-dynamic";
export default async function JoinPage(){const user=await requireDosteamUser("/join");const suggestedName=user.displayName.includes("@")?"":user.displayName;return <MemberClient authName={suggestedName} authEmail={user.email}/>}
