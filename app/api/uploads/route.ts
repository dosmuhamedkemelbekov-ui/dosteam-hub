import { apiJson, cleanText, hubEnv, requireHubUser } from "../_lib";

export const dynamic = "force-dynamic";
const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif","video/mp4"]);
const purposes = new Set(["avatar","club_logo","club_cover","event_cover","post_media"]);

export async function POST(request: Request) {
  const ctx=await requireHubUser(); if("error" in ctx)return ctx.error;
  if(!hubEnv.BUCKET)return apiJson({error:"Хранилище файлов не подключено"},503);
  const form=await request.formData(); const file=form.get("file"); const purpose=cleanText(form.get("purpose"),30);
  if(!(file instanceof File))return apiJson({error:"Выберите файл"},400);
  if(!allowed.has(file.type))return apiJson({error:"Поддерживаются JPG, PNG, WebP, GIF и MP4"},400);
  if(!purposes.has(purpose))return apiJson({error:"Некорректное назначение файла"},400);
  const max=file.type==="video/mp4"?25*1024*1024:8*1024*1024; if(file.size>max)return apiJson({error:`Файл больше ${Math.round(max/1024/1024)} МБ`},400);
  const id=crypto.randomUUID(); const ext=(file.name.split(".").pop()||"bin").replace(/[^a-z0-9]/gi,"").slice(0,6); const key=`hub/${ctx.user.id}/${id}.${ext}`;
  await hubEnv.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type,cacheControl:"public, max-age=31536000, immutable"}});
  await ctx.db.prepare("INSERT INTO uploads (id,owner_id,object_key,file_name,content_type,size_bytes,purpose,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(id,ctx.user.id,key,file.name,file.type,file.size,purpose,Date.now()).run();
  return apiJson({ok:true,id,url:`/api/media/${id}`,fileName:file.name,contentType:file.type});
}
