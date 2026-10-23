function json(body,status=200) {
  return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
}
function termsOf(value) {
  return [...new Set((String(value||"").toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]).slice(0,12))];
}
function ftsOf(value) {
  return termsOf(value).map(t=>'"'+t.replace(/"/g,"")+'"').join(" OR ");
}
export async function onRequestGet({request,env}) {
  if(!env.CORPUS_DB) return json({error:"Corpus database binding is not configured."},503);
  const url=new URL(request.url);
  const q=String(url.searchParams.get("q")||"").trim().slice(0,700);
  if(q.length<2) return json({error:"Supply q with at least two characters."},400);
  const limit=Math.max(1,Math.min(30,Number(url.searchParams.get("limit")||12)));
  const branch=String(url.searchParams.get("branch")||"").slice(0,180);
  const query=ftsOf(q);
  if(!query) return json({q,results:[],count:0});
  try {
    const run=await env.CORPUS_DB.prepare("SELECT id,started_at,finished_at,status,source_count,document_count,chunk_count,branch_count,host_count,coverage_json FROM tumbler_index_runs WHERE status IN ('complete','partial') ORDER BY started_at DESC LIMIT 1").first();
    if(!run) return json({q,results:[],count:0,indexReady:false,note:"No completed corpus index run exists yet. Run the Tumbler corpus indexing workflow first."});
    let sql="SELECT d.id AS document_id,d.source_host,d.source_kind,d.source_url,d.title,d.branch_name,d.commit_sha,d.path,d.modified_at,d.indexed_at,substr(f.text,1,1800) AS excerpt,bm25(tumbler_chunks_fts) AS relevance FROM tumbler_chunks_fts f JOIN tumbler_documents d ON d.id=f.document_id WHERE tumbler_chunks_fts MATCH ?1 AND d.indexed_at >= ?2 AND d.visibility='public'";
    const params=[query,run.started_at];
    if(branch) { sql+=" AND instr(','||d.branch_name||',', ','||?"+(params.length+1)+"||',')>0"; params.push(branch); }
    sql+=" ORDER BY relevance ASC LIMIT ?"+(params.length+1);
    params.push(String(limit));
    const result=await env.CORPUS_DB.prepare(sql).bind(...params).all();
    let coverage={};
    try {coverage=JSON.parse(run.coverage_json||"{}");}catch{}
    const results=(result.results||[]).map(x=>({
      source:x.source_host,
      kind:x.source_kind,
      title:x.title,
      url:x.source_url,
      path:x.path,
      branches:x.branch_name,
      commit:x.commit_sha,
      modified:x.modified_at,
      excerpt:x.excerpt,
      relevance:x.relevance
    }));
    return json({q,count:results.length,results,indexReady:true,indexRun:{id:run.id,status:run.status,startedAt:run.started_at,finishedAt:run.finished_at,documents:run.document_count,chunks:run.chunk_count,branches:run.branch_count,hosts:run.host_count},coverage,exhaustiveWholeEstateIndex:false});
  } catch(error) {
    return json({error:"Corpus search failed.",detail:String(error.message||error).slice(0,240)},500);
  }
}
