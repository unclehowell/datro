export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allows requests from your main site
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { password } = await request.json();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (password === env.PASSPHRASE) {
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        ...corsHeaders,
        'Set-Cookie': 'datro_login=true; Path=/; Domain=.financecheque.uk; Max-Age=604800; SameSite=Lax; Secure',
      }
    });
  }

  return new Response(JSON.stringify({ success: false }), { 
    status: 401,
    headers: corsHeaders 
  });
}
