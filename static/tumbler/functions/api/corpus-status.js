function json(body,status=200) {
  return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
}
export async function onRequestGet({env}) {
  if(!env.CORPUS_DB) return json({ok:false,service:"tumbler",indexReady:false,error:"Corpus database binding is not configured."},503);
  try {
    const [run,counts]=await Promise.all([
      env.CORPUS_DB.prepare("SELECT id,started_at,finished_at,status,source_count,document_count,chunk_count,branch_count,host_count,errors_json,coverage_json FROM tumbler_index_runs ORDER BY started_at DESC LIMIT 1").first(),
      env.CORPUS_DB.prepare("SELECT COUNT(*) AS documents,COALESCE(SUM(char_count),0) AS characters,COUNT(DISTINCT source_host) AS hosts FROM tumbler_documents WHERE visibility='public'").first()
    ]);
    let coverage={};let errors=[];
    try{coverage=JSON.parse(run?.coverage_json||"{}");}catch{}
    try{errors=JSON.parse(run?.errors_json||"[]");}catch{}
    return json({
      ok:true,service:"tumbler",
      indexReady:Boolean(run&&(run.status==="complete"||run.status==="partial")),
      corpus:{documents:counts?.documents||0,characters:counts?.characters||0,hosts:counts?.hosts||0},
      latestRun:run?{id:run.id,startedAt:run.started_at,finishedAt:run.finished_at,status:run.status,sourceCount:run.source_count,documents:run.document_count,chunks:run.chunk_count,branches:run.branch_count,hosts:run.host_count,errors,coverage}:null,
      exhaustiveWholeEstateIndex:false,
      note:"A corpus run may be partial. Private service endpoints and binary PDF contents are not indexed by the current crawler, and page limits are reported."
    });
  }catch(error){return json({ok:false,service:"tumbler",error:"Index status query failed.",detail:String(error.message||error).slice(0,240)},500);}
}
