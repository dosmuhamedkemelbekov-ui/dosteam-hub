import QRCode from "qrcode";
import { requireHubUser } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(request:Request,{params}:{params:Promise<{code:string}>}) {
  const ctx=await requireHubUser(); if("error" in ctx)return ctx.error; const {code}=await params;
  const ticket=await ctx.db.prepare("SELECT r.ticket_code,r.user_id,e.organizer_id FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.ticket_code=?").bind(code).first<{ticket_code:string;user_id:string;organizer_id:string}>(); if(!ticket)return new Response("Not found",{status:404});
  if(ticket.user_id!==ctx.user.id&&ticket.organizer_id!==ctx.user.id&&ctx.user.role!=="admin")return new Response("Forbidden",{status:403});
  const origin=new URL(request.url).origin; const svg=await QRCode.toString(`${origin}/scan?code=${encodeURIComponent(code)}`,{type:"svg",errorCorrectionLevel:"M",margin:2,width:360,color:{dark:"#111111",light:"#ffffff"}});
  return new Response(svg,{headers:{"content-type":"image/svg+xml; charset=utf-8","cache-control":"private, no-store"}});
}
