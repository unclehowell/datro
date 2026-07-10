export async function onRequest(): Promise<Response> {
  return new Response(JSON.stringify({
    version: "0.5.0.04",
    branch: "financecheque",
    release: "financecheque-v0.5.0.04",
  }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
}
