import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || "42a4a8d7bfb96321118ada213638d050";
const DB_ID = process.env.TUMBLER_D1_DATABASE_ID || "3ca02c2d-bb78-424d-8574-a653d33f5c05";
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const API = "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT + "/d1/database/" + DB_ID + "/query";
const RUN_ID = new Date().toISOString().replace(/[^0-9TZ]/g, "-");
const STARTED = new Date().toISOString();
const MAX_TEXT_BYTES = 512 * 1024;
const MAX_PAGES_PER_HOST = Number(process.env.TUMBLER_MAX_PAGES_PER_HOST || 350);
const MAX_TOTAL_WEB_PAGES = Number(process.env.TUMBLER_MAX_TOTAL_WEB_PAGES || 12000);
const CHUNK_SIZE = 2600;
const CHUNK_OVERLAP = 220;
const MAX_SQL_BATCH = 85;

if (!API_TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is required.");

const inventory = JSON.parse(await readFile(new URL("../static/tumbler/sources.json", import.meta.url), "utf8"));
const counts = { branches: 0, gitFiles: 0, webPages: 0, researchItems: 0, qaItems: 0, chunks: 0, skippedPrivateHosts: 0, failedHosts: [], errors: [] };
let sqlOps = [];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
function stmt(sql, params = []) {
  return { sql, params: params.map(v => v === null || v === undefined ? "" : String(v)) };
}
async function postQuery(body) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "authorization": "Bearer " + API_TOKEN, "content-type": "application/json", "accept": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success !== true) {
    throw new Error("D1 API HTTP " + res.status + ": " + JSON.stringify(data.errors || data).slice(0, 700));
  }
  const results = Array.isArray(data.result) ? data.result : [];
  const failed = results.find(x => x && x.success === false);
  if (failed) throw new Error("D1 query failed: " + JSON.stringify(failed).slice(0, 700));
  return data;
}
async function flushOps() {
  if (!sqlOps.length) return;
  const batch = sqlOps;
  sqlOps = [];
  await postQuery({ batch });
}
async function pushOp(op) {
  sqlOps.push(op);
  if (sqlOps.length >= MAX_SQL_BATCH) await flushOps();
}
function chunkText(text) {
  const out = [];
  const cleaned = String(text || "").replace(/\u0000/g, "").trim();
  for (let start = 0; start < cleaned.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const part = cleaned.slice(start, start + CHUNK_SIZE).trim();
    if (part.length >= 30) out.push(part);
  }
  return out;
}
function normalText(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|canvas|template|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(nav|footer|header)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n) || 32))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16) || 32))
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/[ \t\r\f]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function htmlTitle(html, fallback) {
  const title = String(html || "").match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = String(html || "").match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return normalText(title?.[1] || h1?.[1] || fallback || "").slice(0, 280);
}
function skipGitPath(path) {
  const p = "/" + path.toLowerCase() + "/";
  if (/(^|\/)(node_modules|vendor|dist|build|coverage|\.git|\.next|\.cache|__pycache__|site-packages|playwright-report|test-results)(\/|$)/i.test(path)) return true;
  if (/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|\.dev\.vars|\.env|id_rsa|id_ed25519)(\/|$)/i.test(path)) return true;
  if (/\.(min\.js|min\.css|map|lock|png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|eot|mp[34]|mov|zip|gz|7z|rar|sqlite|db|wasm|exe|dll|so|dylib|pdf|psd|ai|sketch|blend)$/i.test(path)) return true;
  return !(/\.(md|mdx|txt|rst|adoc|html?|js|mjs|cjs|ts|tsx|jsx|css|scss|sass|less|json|jsonc|ya?ml|toml|xml|svg|sql|py|sh|bash|graphql|gql|csv|tsv|vue|svelte|astro|php|go|rs|java|kt|swift|c|h|cc|cpp|hpp|rb|pl|r|ipynb|prisma|ini|conf|properties|graphqls|gitattributes|gitignore|editorconfig|Dockerfile|Makefile|Caddyfile|wrangler|example)$/i.test(path) && !/(^|\/)(README|LICENSE|NOTICE|CHANGELOG|CONTRIBUTING|CODE_OF_CONDUCT|Dockerfile|Makefile)(\.|$)/i.test(path));
}
async function indexDocument(doc) {
  const text = String(doc.text || "").replace(/\u0000/g, "").trim();
  if (text.length < 30) return;
  const chunks = chunkText(text);
  const contentHash = hash(text);
  const id = doc.id || hash(doc.source_host + "\u0000" + doc.source_url);
  const indexedAt = STARTED;
  await pushOp(stmt("DELETE FROM tumbler_chunks_fts WHERE document_id = ?", [id]));
  await pushOp(stmt(
    "INSERT INTO tumbler_documents (id,source_host,source_kind,source_url,title,branch_name,commit_sha,path,content_hash,modified_at,indexed_at,visibility,char_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_host=excluded.source_host,source_kind=excluded.source_kind,source_url=excluded.source_url,title=excluded.title,branch_name=excluded.branch_name,commit_sha=excluded.commit_sha,path=excluded.path,content_hash=excluded.content_hash,modified_at=excluded.modified_at,indexed_at=excluded.indexed_at,visibility=excluded.visibility,char_count=excluded.char_count",
    [id,doc.source_host,doc.source_kind,doc.source_url,doc.title || "",doc.branch_name || "",doc.commit_sha || "",doc.path || "",contentHash,doc.modified_at || "",indexedAt,"public",text.length]
  ));
  for (let i=0;i<chunks.length;i++) {
    const chunkId = hash(id + "\u0000" + i + "\u0000" + chunks[i]).slice(0, 48);
    await pushOp(stmt("INSERT INTO tumbler_chunks_fts (id,document_id,text) VALUES (?,?,?)", [chunkId,id,chunks[i]]));
    counts.chunks += 1;
  }
}
async function fetchResponse(url, timeoutMs = 12000) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "TumblerCorpusIndexer/0.1 (public-source indexing; contact site owner)", "accept": "text/html,application/xhtml+xml,application/xml,application/json,text/plain,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") || "";
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 5 * 1024 * 1024) return null;
    const text = await response.text();
    if (text.length > 5 * 1024 * 1024) return null;
    return { url: response.url || url, type, text };
  } catch {
    return null;
  }
}
function sitemapLocs(xml) {
  const out = [];
  for (const m of String(xml || "").matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)) {
    out.push(m[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
  }
  return out;
}
function pageLinks(html, base, allowedHost) {
  const out = [];
  for (const match of String(html || "").matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1].replace(/&amp;/g, "&"), base);
      if (!["http:", "https:"].includes(url.protocol)) continue;
      if (url.hostname !== allowedHost && url.hostname !== "www." + allowedHost && "www." + url.hostname !== allowedHost) continue;
      if (url.pathname.match(/\.(pdf|png|jpe?g|gif|webp|avif|zip|gz|mp[34]|mov|woff2?|ttf|xml|json|css|js)(?:$|\/)/i)) continue;
      if (url.pathname.startsWith("/wp-json/") || url.pathname.startsWith("/api/") || url.pathname.startsWith("/graphql")) continue;
      url.hash = "";
      if (url.search && !/(\?|&)(page|paged|p)=\d+/i.test(url.search)) url.search = "";
      out.push(url.toString());
    } catch {}
  }
  return [...new Set(out)];
}
async function getSitemapUrls(host, root) {
  const candidates = [
    "https://" + host + "/sitemap.xml",
    "https://" + host + "/sitemap_index.xml",
    "https://" + host + "/wp-sitemap.xml"
  ];
  const visitedMaps = new Set(), urls = new Set();
  const queue = [...candidates];
  while (queue.length && visitedMaps.size < 12 && urls.size < MAX_PAGES_PER_HOST * 3) {
    const sitemap = queue.shift();
    if (visitedMaps.has(sitemap)) continue;
    visitedMaps.add(sitemap);
    const response = await fetchResponse(sitemap, 10000);
    if (!response || !/xml|text\/plain/i.test(response.type) && !/<(?:urlset|sitemapindex)\b/i.test(response.text.slice(0,1000))) continue;
    const locs = sitemapLocs(response.text);
    for (const loc of locs) {
      try {
        const u = new URL(loc);
        if (u.hostname !== host && u.hostname !== "www." + host && "www." + u.hostname !== host) continue;
        if (/\.xml(?:$|\?)/i.test(u.pathname) && /sitemap/i.test(u.pathname)) queue.push(u.toString());
        else if (/^https?:$/.test(u.protocol)) urls.add(u.toString());
      } catch {}
      if (urls.size >= MAX_PAGES_PER_HOST * 3) break;
    }
  }
  if (!urls.size) urls.add(root);
  return [...urls].slice(0, MAX_PAGES_PER_HOST * 3);
}
async function crawlHost(source, pageBudget) {
  const host = source.host;
  const root = source.url;
  const seeded = await getSitemapUrls(host, root);
  const queue = [...seeded];
  const seen = new Set();
  let successCount = 0;
  while (queue.length && seen.size < pageBudget && counts.webPages < MAX_TOTAL_WEB_PAGES) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const response = await fetchResponse(url);
    if (!response) continue;
    if (!/text\/html|application\/xhtml\+xml/i.test(response.type) && !/<html\b/i.test(response.text.slice(0,1200))) continue;
    const text = normalText(response.text);
    if (text.length >= 80) {
      const finalUrl = response.url;
      const id = hash("web\u0000" + finalUrl);
      await indexDocument({
        id, source_host: host, source_kind: "website",
        source_url: finalUrl, title: htmlTitle(response.text, finalUrl),
        path: new URL(finalUrl).pathname, text
      });
      successCount += 1; counts.webPages += 1;
    }
    for (const link of pageLinks(response.text, response.url, host)) {
      if (!seen.has(link) && queue.length < pageBudget * 4) queue.push(link);
    }
  }
  if (queue.length && seen.size >= pageBudget) counts.errors.push("Page limit reached for " + host + " (" + pageBudget + ").");
  return {host, pages: successCount, visited: seen.size, remaining: queue.length};
}
function gitRefs() {
  const refs = execFileSync("git", ["for-each-ref", "--format=%(refname:short)", "refs/remotes/origin"], {encoding:"utf8", maxBuffer:16*1024*1024})
    .split(/\r?\n/).map(x=>x.trim()).filter(x=>x.startsWith("origin/") && !x.endsWith("/HEAD"));
  return [...new Set(refs)];
}
function eligibleGitFile(path) {
  if (!path || skipGitPath(path)) return false;
  if (path.length > 500) return false;
  return true;
}
async function indexGitBranches() {
  const refs = gitRefs();
  if (!refs.length) throw new Error("No origin branch refs found.");
  counts.branches = refs.length;
  const records = new Map();
  const heads = new Map();
  for (const ref of refs) {
    const branch = ref.slice("origin/".length);
    const head = execFileSync("git", ["rev-parse", ref], {encoding:"utf8"}).trim();
    heads.set(branch, head);
    let output;
    try {
      output = execFileSync("git", ["ls-tree","-r","-z","--full-tree",ref], {encoding:"utf8",maxBuffer:512*1024*1024});
    } catch (error) {
      counts.errors.push("Could not list tree for branch " + branch + ": " + String(error.message || error).slice(0,160));
      continue;
    }
    for (const raw of output.split("\u0000")) {
      if (!raw) continue;
      const tab = raw.indexOf("\t");
      if (tab < 0) continue;
      const [mode,type,sha] = raw.slice(0,tab).split(" ");
      const path = raw.slice(tab+1);
      if (type !== "blob" || mode === "120000" || !eligibleGitFile(path)) continue;
      const key = path + "\u0000" + sha;
      let item = records.get(key);
      if (!item) {
        item = {path,sha,branches:[],heads:[]};
        records.set(key,item);
      }
      item.branches.push(branch);
      item.heads.push(head);
    }
  }
  const sizeMeta = new Map();
  const blobIds = [...new Set([...records.values()].map(x=>x.sha))];
  for (let i=0;i<blobIds.length;i+=800) {
    const batch = blobIds.slice(i,i+800);
    const result = spawnSync("git", ["cat-file","--batch-check=%(objectname) %(objecttype) %(objectsize)"], {
      input:batch.join("\n")+"\n", encoding:"utf8", maxBuffer:64*1024*1024
    });
    if (result.status !== 0) throw new Error("git cat-file size check failed: " + String(result.stderr || "").slice(0,500));
    for (const line of result.stdout.split(/\r?\n/)) {
      const parts=line.trim().split(" ");
      if(parts.length===3 && parts[1]==="blob") sizeMeta.set(parts[0],Number(parts[2]));
    }
  }
  const eligible = [...records.values()].filter(x => sizeMeta.has(x.sha) && sizeMeta.get(x.sha) <= MAX_TEXT_BYTES);
  const skippedLarge = records.size - eligible.length;
  counts.errors.push("Git branch tree inventory: " + records.size + " unique path/blob combinations; skipped " + skippedLarge + " files without readable-size metadata or over " + MAX_TEXT_BYTES + " bytes.");
  const needed = [...new Set(eligible.map(x=>x.sha))];
  const contentBySha = new Map();
  for (let i=0;i<needed.length;i+=60) {
    const batch = needed.slice(i,i+60);
    const result = spawnSync("git",["cat-file","--batch"],{input:batch.join("\n")+"\n",encoding:null,maxBuffer:32*1024*1024});
    if(result.status!==0) { counts.errors.push("git cat-file batch failed at offset "+i); continue; }
    const buf = result.stdout;
    let offset=0;
    while(offset<buf.length) {
      const nl=buf.indexOf(10,offset); if(nl<0) break;
      const header=buf.slice(offset,nl).toString("utf8").trim().split(" ");
      if(header.length<3 || header[1]!=="blob") break;
      const sha=header[0], size=Number(header[2]), start=nl+1, end=start+size;
      if(!Number.isFinite(size) || end>buf.length) break;
      contentBySha.set(sha,buf.slice(start,end));
      offset=end+1;
    }
  }
  for (const item of eligible) {
    const buf=contentBySha.get(item.sha);
    if(!buf || buf.includes(0)) continue;
    let text=buf.toString("utf8");
    if(text.includes("\uFFFD") && text.length<1000) continue;
    const branchList=[...new Set(item.branches)].sort();
    const commitList=[...new Set(item.heads)].sort();
    const branch=branchList[0] || "unknown";
    const url="https://github.com/unclehowell/datro/blob/"+branch.replace(/#/g,"%23")+"/"+item.path.split("/").map(encodeURIComponent).join("/");
    const id=hash("git\u0000"+item.path+"\u0000"+item.sha);
    await indexDocument({
      id, source_host:"github.com", source_kind:"git-file",
      source_url:url, title:item.path, path:item.path,
      branch_name:branchList.join(",").slice(0,1500),
      commit_sha:commitList.join(",").slice(0,1500),
      text
    });
    counts.gitFiles += 1;
  }
  return {branches:refs.length,files:counts.gitFiles,uniquePathBlobs:records.size};
}
async function crawlResearchMirror() {
  const base="https://research.bucklerfamily.estate";
  let page=1, total=0, pages=1, processed=0;
  while(page<=pages && page<=200) {
    const data=await fetchResponse(base+"/api/content?per_page=100&page="+page,15000);
    if(!data) {counts.errors.push("Research mirror index failed at page "+page);break;}
    let obj; try{obj=JSON.parse(data.text);}catch{counts.errors.push("Research mirror returned invalid JSON");break;}
    pages=Math.min(200,Math.max(1,Number(obj.total?Math.ceil(obj.total/100):1)));
    total=Number(obj.total||0);
    for(const item of obj.items||[]) {
      if(item.type==="media") {
        const meta=[item.title,item.excerpt,item.alt_text,item.caption,item.source_url].filter(Boolean).join("\n");
        if(meta.length>30) {
          await indexDocument({id:hash("research-media\u0000"+(item.source_url||item.url||item.path)),source_host:"research.bucklerfamily.estate",source_kind:"wiki-artifact-metadata",source_url:item.source_link||item.url||base+item.path,title:item.title||"Media artifact",path:item.path||"",text:meta});
          processed++;
        }
        continue;
      }
      const path=String(item.path||"").replace(/^\/+/,"");
      if(!path) continue;
      const encoded=path.split("/").map(encodeURIComponent).join("/");
      const content=await fetchResponse(base+"/api/content/"+encoded,12000);
      let extracted=item.excerpt||"";
      if(content) {
        try {
          const detail=JSON.parse(content.text);
          extracted=normalText(detail.content_html||detail.excerpt_html||extracted);
        } catch {}
      }
      if(extracted.length<30) continue;
      await indexDocument({
        id:hash("research\u0000"+(item.source_link||item.url||base+"/"+path)),
        source_host:"research.bucklerfamily.estate",
        source_kind:"wiki-content",
        source_url:item.source_link||item.url||base+"/"+path,
        title:normalText(item.title||path).slice(0,250),
        path:item.path||path, modified_at:item.modified||"",
        text:extracted
      });
      processed++;
    }
    page++;
  }
  counts.researchItems=processed;
  return {total,processed,pages};
}
async function crawlQaGraph() {
  const url="https://qa.bucklerfamily.estate/api/qa.json";
  const response=await fetchResponse(url,25000);
  if(!response) {counts.errors.push("QA graph export unavailable.");return {items:0};}
  try {
    const data=JSON.parse(response.text);
    const items=Array.isArray(data)?data:(data.qa||[]);
    for(const item of items) {
      const text=[
        "Question: "+(item.question||""),
        "Answer: "+(item.answer||""),
        "Body: "+(item.party_name||item.party||""),
        "Status/kind: "+(item.kind||item.status||""),
        "Reference: "+(item.ref||""),
        "Asked: "+(item.asked||"")+" Answered: "+(item.answered||"")
      ].join("\n");
      if(text.length<50) continue;
      await indexDocument({
        id:hash("qa\u0000"+(item.id||item.url||text.slice(0,120))),
        source_host:"qa.bucklerfamily.estate",source_kind:"foi-eir-record",
        source_url:item.url||url,title:(item.question||item.subject||"FOI/EIR correspondence").slice(0,250),
        path:item.id||"",modified_at:item.answered||item.asked||"",text
      });
      counts.qaItems++;
    }
    return {items:counts.qaItems};
  } catch(error) {
    counts.errors.push("QA graph JSON parse failed: "+String(error.message||error).slice(0,200));
    return {items:0};
  }
}
async function main() {
  await postQuery({sql:"INSERT INTO tumbler_index_runs (id,started_at,status,source_count,document_count,chunk_count,branch_count,host_count,errors_json,coverage_json) VALUES (?,?, 'running',0,0,0,0,0,'[]','{}')",params:[RUN_ID,STARTED]});
  // Fetch each current branch tip with a shallow history; this is for indexing branch heads, not historical commits.
  const fetch=spawnSync("git",["fetch","--no-tags","--depth=1","origin","+refs/heads/*:refs/remotes/origin/*"],{encoding:"utf8",maxBuffer:128*1024*1024});
  if(fetch.status!==0) throw new Error("Could not fetch all branch heads: "+String(fetch.stderr||"").slice(0,800));
  const git=await indexGitBranches();
  await flushOps();
  await crawlResearchMirror();
  await flushOps();
  await crawlQaGraph();
  await flushOps();
  const websiteSources=inventory.sources.filter(x=>x.kind==="website"||x.kind==="wordpress");
  const specialHosts=inventory.sources.filter(x=>x.kind==="private-api");
  counts.skippedPrivateHosts=specialHosts.length;
  let remaining=MAX_TOTAL_WEB_PAGES-counts.webPages;
  for(let i=0;i<websiteSources.length && remaining>0;i+=4) {
    const group=websiteSources.slice(i,i+4);
    const results=await Promise.all(group.map(s=>crawlHost(s,Math.min(MAX_PAGES_PER_HOST,Math.max(1,Math.floor(remaining/group.length))))));
    remaining=MAX_TOTAL_WEB_PAGES-counts.webPages;
    for(const r of results) {
      if(!r.pages) counts.failedHosts.push(r.host);
    }
    await flushOps();
  }
  await flushOps();
  counts.errors=[...new Set(counts.errors)];
  const coverage={
    branchesSeen:counts.branches,
    gitFilesIndexed:counts.gitFiles,
    webPagesIndexed:counts.webPages,
    researchItemsIndexed:counts.researchItems,
    qaItemsIndexed:counts.qaItems,
    chunksIndexed:counts.chunks,
    registeredHosts:inventory.sources.length,
    privateHostsExcluded:specialHosts.map(s=>s.host),
    failedHosts:counts.failedHosts,
    limits:{maxPagesPerHost:MAX_PAGES_PER_HOST,maxTotalWebPages:MAX_TOTAL_WEB_PAGES,maxGitTextFileBytes:MAX_TEXT_BYTES},
    note:"A complete run indexes current branch heads and reachable published HTML/text pages from public website hosts. Private API services are excluded. Binary document contents (including PDFs) are not extracted in this version. Hosts that fail or hit crawl limits are listed."
  };
  const finished=new Date().toISOString();
  const status=counts.failedHosts.length===0 && counts.branches>0 ? "complete" : "partial";
  await postQuery({sql:"UPDATE tumbler_index_runs SET finished_at=?,status=?,source_count=?,document_count=?,chunk_count=?,branch_count=?,host_count=?,errors_json=?,coverage_json=? WHERE id=?",params:[finished,status,counts.gitFiles+counts.webPages+counts.researchItems+counts.qaItems,counts.gitFiles+counts.webPages+counts.researchItems+counts.qaItems,counts.chunks,counts.branches,websiteSources.length-counts.failedHosts.length,JSON.stringify(counts.errors).slice(0,100000),JSON.stringify(coverage).slice(0,100000),RUN_ID]});
  console.log(JSON.stringify({runId:RUN_ID,status,git,counts,coverage},null,2));
  if(status!=="complete") process.exitCode=2;
}
try {
  await main();
} catch(error) {
  try {
    await flushOps();
    await postQuery({sql:"UPDATE tumbler_index_runs SET finished_at=?,status='failed',errors_json=?,coverage_json=? WHERE id=?",params:[new Date().toISOString(),JSON.stringify([String(error.message||error)]),JSON.stringify(counts),RUN_ID]});
  } catch {}
  throw error;
}
