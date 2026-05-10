interface Env {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  DB?: D1Database;
}

const PACKAGES: Record<string, { amount: number; name: string; credits: number }> = {
  starter:    { amount: 999,  name: 'Starter — 100 Credits',       credits: 100  },
  pro:        { amount: 2999, name: 'Pro — 350 Credits',            credits: 350  },
  enterprise: { amount: 9999, name: 'Enterprise — 1500 Credits',    credits: 1500 },
  // legacy aliases
  basic:      { amount: 999,  name: 'Basic (100 credits)',          credits: 100  },
};

async function stripeRequest(path: string, body: Record<string, string>, secretKey: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json() as Promise<any>;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const origin = request.headers.get('origin') || 'https://financecheque.uk';

  // ── Stripe Webhook ────────────────────────────────────────────────────────
  if (action === 'webhook') {
    const rawBody = await request.text();
    const sig = request.headers.get('stripe-signature') || '';
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    let event: any;
    if (webhookSecret) {
      // Verify signature (CF Workers compatible HMAC)
      const verified = await verifyStripeSignature(rawBody, sig, webhookSecret);
      if (!verified) return json({ error: 'Invalid signature' }, 400);
    }
    event = JSON.parse(rawBody);

    if (event.type === 'checkout.session.completed' && env.DB) {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const credits = Number(session.metadata?.credits || 0);
      if (userId && credits > 0) {
        await env.DB.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?')
          .bind(credits, userId).run();
      }
    }

    return json({ received: true });
  }

  const secretKey = env.STRIPE_SECRET_KEY;
  if (!secretKey) return json({ error: 'Stripe not configured' }, 500);

  // ── Topup / Checkout ──────────────────────────────────────────────────────
  if (action === 'checkout' || action === 'topup') {
    const body = await request.json() as any;
    const pkg = PACKAGES[body.packageId] || PACKAGES.starter;
    const userId = body.userId || '';

    const session = await stripeRequest('/checkout/sessions', {
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'gbp',
      'line_items[0][price_data][product_data][name]': pkg.name,
      'line_items[0][price_data][unit_amount]': String(pkg.amount),
      'line_items[0][quantity]': '1',
      mode: 'payment',
      'metadata[userId]': userId,
      'metadata[credits]': String(pkg.credits),
      success_url: `${origin}/?payment=success&credits=${pkg.credits}`,
      cancel_url: `${origin}/?payment=cancelled`,
    }, secretKey);

    return json({ id: session.id, error: session.error?.message });
  }

  // ── Billing Portal ────────────────────────────────────────────────────────
  if (action === 'portal') {
    const body = await request.json() as any;
    if (!body.customerId) return json({ error: 'customerId required' }, 400);
    const session = await stripeRequest('/billing_portal/sessions', {
      customer: body.customerId,
      return_url: `${origin}/`,
    }, secretKey);
    return json({ url: session.url, error: session.error?.message });
  }

  return json({ error: 'Unknown action' }, 400);
}

// CF Workers compatible Stripe signature verification
async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  try {
    const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
    const timestamp = parts['t'];
    const sig = parts['v1'];
    const signed = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
    const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
    return expected === sig;
  } catch { return false; }
}
