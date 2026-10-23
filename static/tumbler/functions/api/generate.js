function json(body,status=410){return Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"}})}
export async function onRequestPost(){
  return json({
    ok:false,
    error:"The prompt-only endpoint has been retired. Tumbler now uses a fixed all-branch corpus and produces reviewable draft pull requests instead of accepting a free-text task.",
    replacement:"POST /api/contribute",
    corpusInput:"All current repository branch heads and the registered indexed public sources",
    refresh:"POST /api/refresh"
  },410);
}