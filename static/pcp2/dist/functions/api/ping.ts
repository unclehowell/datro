export async function onRequestGet() {
  return new Response(JSON.stringify({ status: "ok", message: "Functions are working!" }), {
    headers: { "Content-Type": "application/json" }
  });
}
