import { requireDosteamUser } from "../dosteam-auth";
import MemberClient from "./member-client";

export const dynamic = "force-dynamic";
export default async function JoinPage(){const user=await requireDosteamUser("/join");return <MemberClient authName={user.displayName} authEmail={user.email}/>}
