const ACCOUNT_ID="42a4a8d7bfb96321118ada213638d050";
function json(body,status=200){return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}});}
async function digest(value){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function onRequestPost({request,env}){
 if(!env.CORPUS_DB)return json({error:"Corpus database binding unavailable."},503);
 const auth=request.headers.get("authorization")||"";
 const match=auth.match(/^Bearer\s+(\S+)$/i);
 if(!match)return json({error:"A valid Cloudflare deployment token is required to start an ingestion session."},401);
 const cloudflareToken=match[1];
 try{
  const verify=await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify",{
   headers:{authorization:"Bearer "+cloudflareToken,accept:"application/json"},
   signal:AbortSignal.timeout(8000)
  });
  const v=await verify.json().catch(()=>({}));
  if(!verify.ok||v.success!==true||String(v.result?.status||"").toLowerCase()!=="active")
   return json({error:"Cloudflare token verification failed."},401);
  const project=await fetch("https://api.cloudflare.com/client/v4/accounts/"+ACCOUNT_ID+"/pages/projects/tumbler",{
   headers:{authorization:"Bearer "+cloudflareToken,accept:"application/json"},
   signal:AbortSignal.timeout(8000)
  });
  const p=await project.json().catch(()=>({}));
  if(!project.ok||p.success!==true||p.result?.name!=="tumbler")
   return json({error:"The verified token does not have access to this Tumbler Pages project."},403);
  const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,"0")).join("");
  const tokenHash=await digest(token);
  const now=Math.floor(Date.now()/1000);
  await env.CORPUS_DB.prepare("INSERT INTO tumbler_ingest_sessions (token_hash,created_at,expires_at,scope) VALUES (?,?,?,'corpus-write')").bind(tokenHash,String(now),String(now+4*60*60)).run();
  return json({ok:true,token,expiresAt:now+4*60*60,scope:"corpus-write"});
 }catch(error){
  return json({error:"Could not verify the Cloudflare token or open an ingest session.",detail:String(error.message||error).slice(0,180)},502);
 }
}
