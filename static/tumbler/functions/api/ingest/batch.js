function json(body,status=200){return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});}
async function digest(value){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
function isAllowedStatement(sql){
 return /^\s*(?:DELETE\s+FROM\s+tumbler_chunks_fts|INSERT\s+INTO\s+tumbler_documents|INSERT\s+INTO\s+tumbler_chunks_fts|INSERT\s+INTO\s+tumbler_index_runs|UPDATE\s+tumbler_index_runs)\b/i.test(sql);
}
export async function onRequestPost({request,env}){
 if(!env.CORPUS_DB)return json({error:"Corpus database binding unavailable."},503);
 const match=(request.headers.get("authorization")||"").match(/^Bearer\s+([a-f0-9]{64})$/i);
 if(!match)return json({error:"A short-lived corpus-ingest session is required."},401);
 const bodyText=await request.text();
 if(bodyText.length>1500000)return json({error:"Payload exceeds the 1.5 MB batch limit."},413);
 let body;try{body=JSON.parse(bodyText);}catch{return json({error:"Expected JSON."},400);}
 const tokenHash=await digest(match[1]);
 const now=Math.floor(Date.now()/1000);
 let session;
 try{session=await env.CORPUS_DB.prepare("SELECT token_hash FROM tumbler_ingest_sessions WHERE token_hash=? AND scope='corpus-write' AND expires_at>?").bind(tokenHash,String(now)).first();}
 catch(error){return json({error:"Could not validate the ingest session.",detail:String(error.message||error).slice(0,180)},500);}
 if(!session)return json({error:"Ingest session is invalid or expired."},401);
 const statements=Array.isArray(body.batch)?body.batch:[body];
 if(!statements.length||statements.length>85)return json({error:"Batch must contain between 1 and 85 statements."},400);
 for(const item of statements){
  if(!item||typeof item.sql!=="string"||item.sql.length>2400||!isAllowedStatement(item.sql))
   return json({error:"Statement rejected: ingestion is restricted to approved tumbler corpus tables and write operations."},400);
  if(item.params!==undefined&&(!Array.isArray(item.params)||item.params.length>25||item.params.some(v=>v!==null&&typeof v!=="string"&&typeof v!=="number")))
   return json({error:"Invalid SQL parameter list."},400);
 }
 try{
  const prepared=statements.map(item=>env.CORPUS_DB.prepare(item.sql).bind(...(item.params||[])));
  const results=await env.CORPUS_DB.batch(prepared);
  const failed=(results||[]).find(x=>x&&x.success===false);
  if(failed)return json({error:"A corpus statement failed.",detail:String(failed.error||"D1 statement failed").slice(0,220)},500);
  return json({ok:true,statements:(results||[]).length});
 }catch(error){
  return json({error:"D1 corpus write failed.",detail:String(error.message||error).slice(0,240)},500);
 }
}
