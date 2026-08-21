import { hubEnv } from "../../_lib";

export async function GET(_request: Request,{params}:{params:Promise<{id:string}>}) {
  if(!hubEnv.DB||!hubEnv.BUCKET)return new Response("Not found",{status:404});
  const {id}=await params; const meta=await hubEnv.DB.prepare("SELECT object_key,content_type FROM uploads WHERE id=? AND deleted_at IS NULL").bind(id).first<{object_key:string;content_type:string}>(); if(!meta)return new Response("Not found",{status:404});
  const object=await hubEnv.BUCKET.get(meta.object_key); if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"content-type":meta.content_type,"cache-control":"public, max-age=31536000, immutable","etag":object.httpEtag}});
}
