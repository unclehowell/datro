const RAW_BASE = "https://raw.githubusercontent.com/unclehowell/datro/email-archive/apps/email";
const MANIFEST_URL = "https://raw.githubusercontent.com/unclehowell/datro/05e8d86e6e4838a225084341fe59ca457881173c/apps/email/data/mail-index.json";
const PAGE_URL = RAW_BASE + "/index.html";
const TEXT_HOST = "wayback.bucklerfamily.estate";

function headers(extra) {
  const h = new Headers(extra || {});
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "no-referrer");
  return h;
}
function json(data, status) {
  return new Response(JSON.stringify(data), {status:status || 200,headers:headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"})});
}
// The app fetches from GitHub and the public DATRO archive, which are outside
// this Worker hostname's cache zone. Use ordinary fetch here so a cross-zone
// Cache API failure can never prevent the page or message from being returned.
async function remoteFetch(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("upstream timeout"), timeoutMs || 15000);
  try {
    return await fetch(url, {
      headers: {"Accept":"*/*","User-Agent":"GreatHouseFarmPublicArchive/1.1"},
      signal: controller.signal,
      redirect: "follow"
    });
  } finally {
    clearTimeout(timer);
  }
}
async function loadManifest() {
  const r = await remoteFetch(MANIFEST_URL,12000);
  if (!r.ok) throw new Error("Catalogue fetch failed: " + r.status);
  const m = await r.json();
  if (!m || !Array.isArray(m.records)) throw new Error("Invalid catalogue format");
  return m;
}
async function loadRecordText(record) {
  const u = new URL(record.path);
  if (u.protocol !== "https:" || u.hostname !== TEXT_HOST || !u.pathname.startsWith("/text/")) {
    throw new Error("Rejected source URL");
  }
  const r = await remoteFetch(u.href,15000);
  if (!r.ok) throw new Error("Archive source returned " + r.status);
  return await r.text();
}
function corsSafe(request, response) { return response; }
export default {
 async fetch(request, env, ctx) {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") return json({error:"Read-only public archive. Only GET and HEAD are supported."},405);
  if (url.pathname === "/api/health") return json({status:"ok",service:"Great House Farm Mail Archive",worker:"email",manifestVersion:"1.0.1"});
  if (url.pathname === "/api/records") {
   try { const m=await loadManifest(); return json(m); }
   catch(e) { return json({error:"Could not load the public archive index",detail:String(e)},502); }
  }
  if (url.pathname === "/api/message") {
   const id=url.searchParams.get("id");
   if (!id || id.length>80) return json({error:"A record id is required"},400);
   try {
    const m=await loadManifest();
    const record=m.records.find(x=>x.id===id);
    if(!record) return json({error:"Record not found in the public catalogue"},404);
    const text=await loadRecordText(record);
    return json({id:record.id,name:record.name,subject:record.subject,date:record.date,evidenceVersion:record.evidenceVersion,text:text});
   } catch(e) { return json({error:"Could not load source text",detail:String(e)},502); }
  }
  if (url.pathname === "/api/search") {
   const q=(url.searchParams.get("q")||"").trim().toLowerCase();
   if(q.length<2) return json({threadKeys:[],matches:0,note:"Search term must contain at least two characters."});
   if(q.length>160) return json({error:"Search term too long"},400);
   try {
    const m=await loadManifest();
    const matches=new Set();
    let cursor=0;
    const workers=Array.from({length:6},async()=>{while(true){const i=cursor++;if(i>=m.records.length)break;const record=m.records[i];try{const body=(await loadRecordText(record)).toLowerCase();const meta=(record.subject+" "+record.name+" "+record.category).toLowerCase();if(body.includes(q)||meta.includes(q)){const key=(record.subject||record.name).toLowerCase().replace(/^(?:re\s*[:_\-]?\s*)+/i,"").replace(/\.(txt|eml|html?)$/i,"").replace(/[^a-z0-9]+/g," ").trim();matches.add(key);}}catch(e){/* Keep search moving if an archived source is unavailable. */}}});
    await Promise.all(workers);
    return json({threadKeys:Array.from(matches),matches:matches.size,recordsScanned:m.records.length,note:"Search covers indexed public archive records; inaccessible sources may be omitted."});
   } catch(e) { return json({error:"Full-text search failed",detail:String(e)},502); }
  }
  if (url.pathname === "/" || url.pathname === "/index.html" || /^\/thread\/[a-z0-9-]+\/?$/.test(url.pathname)) {
   const r=await remoteFetch(PAGE_URL,12000);
   if (!r.ok) return new Response("The archive interface could not be loaded from the repository branch.",{status:502,headers:headers({"Content-Type":"text/plain; charset=utf-8"})});
   return new Response(await r.text(),{status:200,headers:headers({"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store, max-age=0","Content-Security-Policy":"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; object-src 'none'; frame-ancestors 'self' https://greathousefarmwiki.wordpress.com https://*.wordpress.com; form-action 'none'"})});
  }
  if (url.pathname === "/robots.txt") return new Response("User-agent: *\nAllow: /\nDisallow: /api/",{headers:headers({"Content-Type":"text/plain; charset=utf-8"})});
  return new Response("Not found",{status:404,headers:headers({"Content-Type":"text/plain; charset=utf-8"})});
 }
};