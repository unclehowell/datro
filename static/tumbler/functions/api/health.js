export async function onRequestGet({ env }) {
  return Response.json({
    ok: true,
    service: "tumbler",
    aiBindingConfigured: Boolean(env.AI),
    corpusMode: "live excerpt retrieval",
    exhaustiveWholeEstateIndex: false
  }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
