interface Env {
  STRIPE_SECRET_KEY?: string;
}

async function stripeRequest(path: string, body: Record<string, string>, secretKey: string) {
  const params = new URLSearchParams(body);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  return res.json() as Promise<any>;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const secretKey = env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const origin = request.headers.get('origin') || 'https://financecheque.uk';

  if (action === 'checkout') {
    const body = await request.json() as any;
    const packageId = body.packageId || 'basic';
    const packagePrices: Record<string, { amount: number; name: string; credits: number }> = {
      basic:      { amount: 999,  name: 'Basic (100 credits)',       credits: 100  },
      pro:        { amount: 2999, name: 'Pro (500 credits)',          credits: 500  },
      enterprise: { amount: 9999, name: 'Enterprise (2000 credits)', credits: 2000 },
    };
    const pkg = packagePrices[packageId] || packagePrices.basic;

    const session = await stripeRequest('/checkout/sessions', {
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'gbp',
      'line_items[0][price_data][product_data][name]': pkg.name,
      'line_items[0][price_data][unit_amount]': String(pkg.amount),
      'line_items[0][quantity]': '1',
      mode: 'payment',
      success_url: `${origin}/?payment=success&credits=${pkg.credits}`,
      cancel_url: `${origin}/?payment=cancelled`,
    }, secretKey);

    return new Response(JSON.stringify({ id: session.id, error: session.error?.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'portal') {
    const body = await request.json() as any;
    if (!body.customerId) {
      return new Response(JSON.stringify({ error: 'customerId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const session = await stripeRequest('/billing_portal/sessions', {
      customer: body.customerId,
      return_url: `${origin}/`,
    }, secretKey);

    return new Response(JSON.stringify({ url: session.url, error: session.error?.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
