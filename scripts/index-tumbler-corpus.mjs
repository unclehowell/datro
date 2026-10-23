import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = "https://api.github.com/repos/unclehowell/datro";
const SESSION_URL = "https://tumbler-6js.pages.dev/api/ingest/session";
const INGEST_URL = "https://tumbler-6js.pages.dev/api/ingest/batch";
// Use the stable Pages project hostname, not a short-lived deployment URL.
// The Pages Functions check that the source Cloudflare token is active and has project access,
// then store only a hash of the short-lived, scoped D1-ingest session.
let INGEST_SESSION = "";
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
const counts = { branches: 0, gitFiles: 0, webPages: 0, researchItems: 0, qaItems: 0, documentsIndexed: 0, chunks: 0, skippedGitFiles: 0, skippedPrivateHosts: 0, failedHosts: [], errors: [], phase: "starting" };
const indexedHosts = new Set();
let sqlOps = [];

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}
function stmt(sql, params = []) {
  return { sql, params: params.map(v => v === null || v === undefined ? "" : String(v)) };
}
async function openIngestSession() {
  const res = await fetch(SESSION_URL, {
    method: "POST",
    headers: { "authorization": "Bearer " + API_TOKEN, "content-type": "application/json", "accept": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(20000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok !== true || typeof data.token !== "string") {
    throw new Error("Tumbler ingest-session exchange failed (HTTP " + res.status + "): " + JSON.stringify(data).slice(0, 600));
  }
  INGEST_SESSION = data.token;
}
async function postQuery(body) {
  if (!INGEST_SESSION) throw new Error("No authenticated Tumbler ingest session.");
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: { "authorization": "Bearer " + INGEST_SESSION, "content-type": "application/json", "accept": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok !== true) {
    throw new Error("Tumbler corpus write HTTP " + res.status + ": " + JSON.stringify(data).slice(0, 700));
  }
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
  counts.documentsIndexed += 1;
  indexedHosts.add(doc.source_host);
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
  if (counts.webPages >= MAX_TOTAL_WEB_PAGES) counts.errors.push("Global public-page cap reached; later hosts may not have been crawled.");
  return {host, pages: successCount, visited: seen.size, remaining: queue.length};
}
function eligibleGitFile(path) {
  if (!path || skipGitPath(path) || path.length > 500) return false;
  return true;
}
function skipTreePath(path) {
  return /(^|\/)(node_modules|vendor|dist|build|coverage|\.git|\.next|\.cache|__pycache__|site-packages|playwright-report|test-results|\.venv)(\/|$)/i.test(path);
}
async function githubJson(path, attempt = 0) {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is required for branch/tree inventory.");
  const url = path.startsWith("https://") ? path : GITHUB_API + path;
  const response = await fetch(url, {
    headers: {
      "authorization": "Bearer " + GITHUB_TOKEN,
      "accept": "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "TumblerCorpusIndexer/0.2"
    },
    signal: AbortSignal.timeout(30000)
  });
  if ((response.status === 429 || response.status === 403 || response.status >= 500) && attempt < 5) {
    const retryHeader = Number(response.headers.get("retry-after") || 0);
    const delay = retryHeader > 0 ? Math.min(60000, retryHeader * 1000) : Math.min(30000, 800 * (2 ** attempt));
    await new Promise(resolve => setTimeout(resolve, delay));
    return githubJson(path, attempt + 1);
  }
  if (!response.ok) throw new Error("GitHub API " + response.status + " for " + url + ": " + (await response.text()).slice(0, 350));
  return response.json();
}
async function mapLimit(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      try { results[index] = await fn(items[index], index); }
      catch (error) { results[index] = {__error: String(error?.message || error)}; }
    }
  });
  await Promise.all(workers);
  return results;
}
async function listGitTreeForBranch(branch) {
  const commit = await githubJson("/git/commits/" + encodeURIComponent(branch.sha));
  const treeSha = commit?.tree?.sha;
  if (!treeSha) throw new Error("Commit response contains no root tree SHA.");
  const recursive = await githubJson("/git/trees/" + encodeURIComponent(treeSha) + "?recursive=1");
  if (!recursive.truncated) return recursive.tree || [];

  counts.errors.push("GitHub tree API marked branch " + branch.name + " truncated; walking individual subtrees.");
  const found = [];
  const queue = [{sha:treeSha,path:""}];
  const seen = new Set();
  while (queue.length) {
    const batch = queue.splice(0, 4);
    const responses = await Promise.all(batch.map(async dir => {
      const key = dir.sha + "\u0000" + dir.path;
      if (seen.has(key)) return {dir, tree:[]};
      seen.add(key);
      try {
        const data = await githubJson("/git/trees/" + encodeURIComponent(dir.sha));
        return {dir, tree:data.tree || []};
      } catch(error) {
        counts.errors.push("Could not list subtree " + (dir.path || "/") + " on " + branch.name + ": " + String(error.message || error).slice(0,180));
        return {dir, tree:[]};
      }
    }));
    for (const {dir,tree} of responses) {
      for (const entry of tree) {
        const path = dir.path ? dir.path + "/" + entry.path : entry.path;
        if (entry.type === "tree") {
          if (!skipTreePath(path)) queue.push({sha:entry.sha,path});
        } else if (entry.type === "blob" && entry.mode !== "120000" && eligibleGitFile(path)) {
          found.push({...entry,path});
        }
      }
    }
  }
  return found;
}
async function fetchRawBlob(commitSha, path) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const url = "https://raw.githubusercontent.com/unclehowell/datro/" + encodeURIComponent(commitSha) + "/" + encodedPath;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {"accept":"text/plain,application/octet-stream","user-agent":"TumblerCorpusIndexer/0.2"},
        signal: AbortSignal.timeout(20000)
      });
      if (response.status === 404 || response.status === 410) return null;
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 400 * (2 ** attempt)));
        continue;
      }
      if (!response.ok) return null;
      const text = await response.text();
      if (text.length > MAX_TEXT_BYTES || text.includes("\u0000")) return null;
      if (text.includes("\uFFFD") && text.length < 1000) return null;
      return text;
    } catch {
      if (attempt === 3) return null;
      await new Promise(resolve => setTimeout(resolve, 300 * (2 ** attempt)));
    }
  }
  return null;
}
async function updateProgress(status = "running", finishedAt = "") {
  const coverage = {
    branchHeadsSeen:counts.branches,
    gitFilesIndexed:counts.gitFiles,
    webPagesIndexed:counts.webPages,
    researchItemsIndexed:counts.researchItems,
    qaItemsIndexed:counts.qaItems,
    documentsIndexed:counts.documentsIndexed,
    chunksIndexed:counts.chunks,
    registeredHosts:inventory.sources.length,
    indexedHosts:[...indexedHosts],
    failedHosts:counts.failedHosts,
    skippedPrivateHosts:counts.skippedPrivateHosts,
    latestPhase:counts.phase || "starting",
    errors:counts.errors.slice(-40),
    note:"Index run progress snapshot. Private service endpoints and binary PDF bodies are not included by the current crawler."
  };
  await pushOp(stmt(
    "UPDATE tumbler_index_runs SET finished_at=?,status=?,source_count=?,document_count=?,chunk_count=?,branch_count=?,host_count=?,errors_json=?,coverage_json=? WHERE id=?",
    [finishedAt,status,String(counts.documentsIndexed),String(counts.documentsIndexed),String(counts.chunks),String(counts.branches),String(indexedHosts.size),JSON.stringify(counts.errors.slice(-100)).slice(0,100000),JSON.stringify(coverage).slice(0,100000),RUN_ID]
  ));
  await flushOps();
}
async function indexGitBranches() {
  counts.phase = "GitHub branch/tree inventory";
  const branches = [];
  for (let page = 1; page <= 10; page++) {
    const data = await githubJson("/branches?per_page=100&page=" + page);
    if (!Array.isArray(data)) throw new Error("GitHub branches endpoint returned a non-list response.");
    branches.push(...data.map(x => ({name:x.name, sha:x.commit?.sha || ""})).filter(x => x.name && x.sha));
    if (data.length < 100) break;
  }
  if (!branches.length) throw new Error("No repository branches returned by GitHub API.");
  counts.branches = branches.length;
  await updateProgress();

  const treeResults = await mapLimit(branches, 4, async branch => ({
    branch,
    tree: await listGitTreeForBranch(branch)
  }));
  const records = new Map();
  const blobGroup = new Map();

  for (const result of treeResults) {
    if (!result || result.__error || !result.branch) {
      counts.errors.push("Branch tree failed: " + String(result?.__error || "Unknown branch-tree error").slice(0,240));
      continue;
    }
    const {branch,tree} = result;
    for (const entry of tree) {
      const path = entry.path;
      const size = Number(entry.size);
      if (!eligibleGitFile(path)) continue;
      if (!Number.isFinite(size) || size < 0 || size > MAX_TEXT_BYTES) {
        counts.skippedGitFiles++;
        continue;
      }
      const key = path + "\u0000" + entry.sha;
      let record = records.get(key);
      const isNewRecord = !record;
      if (!record) {
        record = {path,sha:entry.sha,size,branches:[],heads:[]};
        records.set(key,record);
      }
      record.branches.push(branch.name);
      record.heads.push(branch.sha);
      let group = blobGroup.get(entry.sha);
      if (!group) {
        group = {sha:entry.sha,size,representative:{head:branch.sha,path},records:[]};
        blobGroup.set(entry.sha,group);
      }
      // One index document per unique path/blob pair, not one per branch occurrence.
      // The record retains every branch and head SHA separately.
      if (isNewRecord) group.records.push(record);
    }
  }

  counts.errors.push("GitHub branch inventory found " + records.size + " unique path/blob combinations and " + blobGroup.size + " distinct text blobs.");
  const blobs = [...blobGroup.values()];
  console.log("Tumbler: branches", branches.length, "unique path/blob records", records.size, "unique text blobs", blobs.length);

  const blobBatch = 4;
  for (let offset = 0; offset < blobs.length; offset += blobBatch) {
    const batch = blobs.slice(offset, offset + blobBatch);
    const content = await Promise.all(batch.map(async blob => ({blob, text:await fetchRawBlob(blob.representative.head,blob.representative.path)})));
    for (const item of content) {
      const blob = item.blob;
      if (item.text === null) {
        counts.skippedGitFiles += blob.records.length;
        counts.errors.push("Could not fetch text blob " + blob.sha + " (" + blob.records[0]?.path + ").");
        continue;
      }
      for (const record of blob.records) {
        const branchList = [...new Set(record.branches)].sort();
        const commitList = [...new Set(record.heads)].sort();
        const representativeBranch = branchList[0] || "unknown";
        const representativeHead = commitList[0] || "";
        const encodedPath = record.path.split("/").map(encodeURIComponent).join("/");
        const url = "https://github.com/unclehowell/datro/blob/" + representativeHead + "/" + encodedPath;
        const id = hash("git\u0000" + record.path + "\u0000" + record.sha);
        await indexDocument({
          id,source_host:"github.com",source_kind:"git-file",
          source_url:url,title:record.path,path:record.path,
          branch_name:branchList.join(",").slice(0,1500),
          commit_sha:commitList.join(",").slice(0,1500),
          text:item.text
        });
        counts.gitFiles++;
      }
    }
    if ((offset + blobBatch) % 100 === 0 || offset + blobBatch >= blobs.length) {
      await updateProgress();
      console.log("Tumbler: text blobs processed",Math.min(offset+blobBatch,blobs.length),"/",blobs.length,"indexed files",counts.gitFiles);
    }
  }

  const result={branches:branches.length,files:counts.gitFiles,uniquePathBlobs:records.size,uniqueTextBlobs:blobs.length,skippedTextFiles:counts.skippedGitFiles};
  await updateProgress();
  return result;
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
  await openIngestSession();
  await postQuery({sql:"UPDATE tumbler_index_runs SET finished_at=?,status='interrupted' WHERE status='running'",params:[STARTED]});
  await postQuery({sql:"INSERT INTO tumbler_index_runs (id,started_at,status,source_count,document_count,chunk_count,branch_count,host_count,errors_json,coverage_json) VALUES (?,?, 'running',0,0,0,0,0,'[]','{}')",params:[RUN_ID,STARTED]});

  const git = await indexGitBranches();
  await flushOps();
  counts.phase = "research mirror";
  await updateProgress();
  await crawlResearchMirror();
  await flushOps();
  counts.phase = "FOI/EIR Q&A graph";
  await updateProgress();
  await crawlQaGraph();
  await flushOps();

  const websiteSources = inventory.sources.filter(x => x.kind === "website" || x.kind === "wordpress");
  const specialHosts = inventory.sources.filter(x => x.kind === "private-api");
  counts.skippedPrivateHosts = specialHosts.length;
  counts.phase = "public website crawl";
  await updateProgress();

  let remaining = MAX_TOTAL_WEB_PAGES - counts.webPages;
  for (let i=0; i<websiteSources.length && remaining>0; i+=4) {
    const group = websiteSources.slice(i,i+4);
    const results = await Promise.all(group.map(s => crawlHost(s,Math.min(MAX_PAGES_PER_HOST,Math.max(1,Math.floor(remaining/group.length))))));
    remaining = MAX_TOTAL_WEB_PAGES - counts.webPages;
    for (const result of results) {
      if (!result.pages) counts.failedHosts.push(result.host);
      await updateProgress();
    }
    await flushOps();
  }
  await flushOps();

  counts.errors = [...new Set(counts.errors)];
  const coverage = {
    branchHeadsSeen:counts.branches,
    gitFilesIndexed:counts.gitFiles,
    webPagesIndexed:counts.webPages,
    researchItemsIndexed:counts.researchItems,
    qaItemsIndexed:counts.qaItems,
    chunksIndexed:counts.chunks,
    documentsIndexed:counts.documentsIndexed,
    registeredHosts:inventory.sources.length,
    indexedHosts:[...indexedHosts],
    failedHosts:counts.failedHosts,
    privateHostsExcluded:specialHosts.map(s=>s.host),
    limits:{maxPagesPerHost:MAX_PAGES_PER_HOST,maxTotalWebPages:MAX_TOTAL_WEB_PAGES,maxGitTextFileBytes:MAX_TEXT_BYTES},
    skippedTextFiles:counts.skippedGitFiles,
    note:"The index includes current Git branch-head text files under size/path filters, indexed published HTML reachable from public website hosts, the research mirror catalogue and available Q&A export. It does not cover historical Git commits, private API services, PDF binary contents, content behind login, unreachable pages or files outside crawl/size limits. Check errors and skipped counts before calling a review exhaustive."
  };
  const finished = new Date().toISOString();
  const incomplete = counts.failedHosts.length>0 || counts.skippedGitFiles>0 || counts.errors.some(e => /Could not list|failed|truncated|unavailable|limit reached|Global public-page cap|Could not fetch/i.test(e));
  const status = !incomplete && counts.branches>0 ? "complete" : "partial";
  await postQuery({
    sql:"UPDATE tumbler_index_runs SET finished_at=?,status=?,source_count=?,document_count=?,chunk_count=?,branch_count=?,host_count=?,errors_json=?,coverage_json=? WHERE id=?",
    params:[finished,status,String(counts.documentsIndexed),String(counts.documentsIndexed),String(counts.chunks),String(counts.branches),String(indexedHosts.size),JSON.stringify(counts.errors).slice(0,100000),JSON.stringify(coverage).slice(0,100000),RUN_ID]
  });
  console.log(JSON.stringify({runId:RUN_ID,status,git,counts,coverage},null,2));
  if (status!=="complete") process.exitCode=2;
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
