import { hubEnv } from "../runtime";
import ResetClient from "./reset-client";

export const dynamic = "force-dynamic";
export default function ResetPage(){return <ResetClient url={String(hubEnv.NEXT_PUBLIC_SUPABASE_URL||"")} publishableKey={String(hubEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"")}/>}

