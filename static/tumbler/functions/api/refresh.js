const REPO="unclehowell/datro";
async function digest(value){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function reply(body,status=200){return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}})}
export async function onRequestPost({request,env}){
 if(!env.TUMBLER_GITHUB_TOKEN)return reply({ok:false,configurationRequired:true,error:"Refresh is not configured. Store a scoped GitHub token as the Cloudflare Pages secret TUMBLER_GITHUB_TOKEN."},503);
 if(!env.CORPUS_DB)return reply({ok:false,error:"Corpus database is not configured."},503);
 try{
  const ip=request.headers.get("cf-connecting-ip")||"unknown",window=Math.floor(Date.now()/1800000),bucket="refresh-"+(await digest(ip+"|"+window)).slice(0,44);
  const expiry=String((window+1)*1800+120),globalDay=Math.floor(Date.now()/86400000),globalBucket="refresh-global-"+globalDay;
  await env.CORPUS_DB.prepare("INSERT INTO tumbler_generation_limits (bucket_id,requests,expires_at) VALUES (?,1,?) ON CONFLICT(bucket_id) DO UPDATE SET requests=requests+1,expires_at=excluded.expires_at").bind(bucket,expiry).run();
  await env.CORPUS_DB.prepare("INSERT INTO tumbler_generation_limits (bucket_id,requests,expires_at) VALUES (?,1,?) ON CONFLICT(bucket_id) DO UPDATE SET requests=requests+1,expires_at=excluded.expires_at").bind(globalBucket,String((globalDay+1)*86400+120)).run();
  const row=await env.CORPUS_DB.prepare("SELECT requests FROM tumbler_generation_limits WHERE bucket_id=?").bind(bucket).first();
  const globalRow=await env.CORPUS_DB.prepare("SELECT requests FROM tumbler_generation_limits WHERE bucket_id=?").bind(globalBucket).first();
  if(Number(row?.requests||0)>1)return reply({ok:false,error:"A collection refresh has already been requested from this connection during the current 30-minute window."},429);
  if(Number(globalRow?.requests||0)>4)return reply({ok:false,error:"The daily refresh safety limit has been reached. The scheduled index will continue to run."},429);
 }catch{return reply({ok:false,error:"The refresh safety limiter is unavailable; refresh has been stopped."},503)}
 try{
  const response=await fetch("https://api.github.com/repos/"+REPO+"/actions/workflows/index-tumbler-corpus.yml/dispatches",{
   method:"POST",
   headers:{"authorization":"Bearer "+env.TUMBLER_GITHUB_TOKEN,"accept":"application/vnd.github+json","x-github-api-version":"2022-11-28","user-agent":"Tumbler-Corpus-Refresh/1.0","content-type":"application/json"},
   body:JSON.stringify({ref:"tumbler"}),
   signal:AbortSignal.timeout(20000)
  });
  if(response.status!==204){const text=await response.text();return reply({ok:false,error:"GitHub did not queue the index workflow (HTTP "+response.status+"). Check Actions permission on TUMBLER_GITHUB_TOKEN. "+text.slice(0,160)},response.status===403?403:502)}
  return reply({ok:true,queued:true,message:"A fresh index of the latest repository branches and registered public sources has been queued. Indexing can take time; wait for the run to finish, then generate the pull request.",workflowUrl:"https://github.com/unclehowell/datro/actions/workflows/index-tumbler-corpus.yml",branch:"tumbler"});
 }catch(e){return reply({ok:false,error:"Could not queue the collection refresh: "+String(e?.message||e).slice(0,180)},502)}
}