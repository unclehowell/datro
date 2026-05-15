import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory stores (replace with DB in production)
const users: Record<string, { credits: number; stripeCustomerId?: string }> = {};
const jobs: Array<{ id: string; userId: string; url: string; leadAmount: number; quantity: number; creditCost: number; status: string; createdAt: number }> = [];
const childProxies: Record<string, { url: string; lastSeen: number; load: number }> = {};

const TOPUP_PACKAGES: Record<string, { credits: number; price: number; label: string }> = {
  starter:    { credits: 100,  price: 999,   label: "Starter — 100 Credits" },
  pro:        { credits: 350,  price: 2999,  label: "Pro — 350 Credits" },
  enterprise: { credits: 1500, price: 9999,  label: "Enterprise — 1500 Credits" },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  let stripe: Stripe | null = null;
  const getStripe = () => {
    if (!stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
      stripe = new Stripe(key);
    }
    return stripe;
  };

  // Raw body for Stripe webhook
  app.use("/api/stripe-webhook", express.raw({ type: "application/json" }));
  app.use(express.json());

  // ── Auth helpers ──────────────────────────────────────────────────────────
  function getOrCreateUser(userId: string) {
    if (!users[userId]) users[userId] = { credits: 0 };
    return users[userId];
  }

  // ── Credits ───────────────────────────────────────────────────────────────
  app.get("/api/credits", (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = getOrCreateUser(userId);
    res.json({ credits: user.credits });
  });

  // ── Submit Job ────────────────────────────────────────────────────────────
  app.post("/api/submit-job", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { url, leadAmount, quantity, creditCost } = req.body;
    if (!url || !leadAmount || !quantity || !creditCost) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = getOrCreateUser(userId);
    if (user.credits < creditCost) {
      return res.status(402).json({ error: "Insufficient credits" });
    }

    // Deduct credits
    user.credits -= creditCost;

    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      url,
      leadAmount,
      quantity,
      creditCost,
      status: "queued",
      createdAt: Date.now(),
    };
    jobs.push(job);

    // Dispatch to parent proxy (self) → child proxies
    dispatchToChildProxy(job);

    res.json({ jobId: job.id, creditsRemaining: user.credits });
  });

  // ── Parent Proxy: Child Registration & Routing ──────────────────────────
  app.all("/api/proxy", async (req, res) => {
    const action = req.query.action || (req.method === 'POST' ? 'register' : 'children');
    const body = req.body;

    if (action === 'register') {
      const { childId, url } = body;
      if (!childId || !url) return res.status(400).json({ error: "childId and url required" });
      childProxies[childId] = { url, lastSeen: Date.now(), load: 0 };
      return res.json({ ok: true });
    }

    if (action === 'heartbeat') {
      const { childId, load } = body;
      if (childProxies[childId]) {
        childProxies[childId].lastSeen = Date.now();
        childProxies[childId].load = load ?? 0;
      }
      return res.json({ ok: true });
    }

    if (action === 'children') {
      const alive = Object.entries(childProxies)
        .filter(([, c]) => Date.now() - c.lastSeen < 60_000)
        .map(([id, c]) => ({ id, ...c }));
      return res.json(alive);
    }

    if (action === 'chat') {
      const { message, sessionId } = body;
      if (!message) return res.status(400).json({ error: "message is required" });

      const alive = Object.entries(childProxies)
        .filter(([, c]) => Date.now() - c.lastSeen < 60_000)
        .sort(([, a], [ , b]) => a.load - b.load);

      if (alive.length === 0) {
        return res.status(503).json({ ok: false, error: "No child proxies online" });
      }

      const [childId, child] = alive[0];
      try {
        const resp = await fetch(`${child.url}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, sessionId }),
        });
        const data = await resp.json() as any;
        return res.json({ ok: true, routedTo: childId, ...data });
      } catch (err: any) {
        return res.status(502).json({ ok: false, error: err.message });
      }
    }

    res.status(400).json({ error: "Unknown action" });
  });

  // ── Topup Checkout ────────────────────────────────────────────────────────
  app.post("/api/create-topup-session", async (req, res) => {
    try {
      const { packageId } = req.body;
      const pkg = TOPUP_PACKAGES[packageId];
      if (!pkg) return res.status(400).json({ error: "Invalid package" });

      const stripeInstance = getStripe();
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "gbp",
            product_data: { name: pkg.label, description: `${pkg.credits} credits for financecheque.uk` },
            unit_amount: pkg.price,
          },
          quantity: 1,
        }],
        mode: "payment",
        metadata: { packageId, credits: String(pkg.credits), userId: req.headers["x-user-id"] as string || "" },
        success_url: `${req.headers.origin}/?topup=success&credits=${pkg.credits}`,
        cancel_url: `${req.headers.origin}/?topup=cancelled`,
      });

      res.json({ id: session.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Stripe Webhook ────────────────────────────────────────────────────────
  app.post("/api/stripe-webhook", (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = JSON.parse(req.body.toString());
      }
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const credits = Number(session.metadata?.credits || 0);
      if (userId && credits > 0) {
        const user = getOrCreateUser(userId);
        user.credits += credits;
      }
    }

    // Subscription tier → credits mapping
    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const userId = Object.entries(users).find(([, u]) => u.stripeCustomerId === customerId)?.[0];
      if (userId) {
        const priceId = sub.items.data[0]?.price?.id;
        const tierCredits: Record<string, number> = {
          [process.env.STRIPE_PRICE_STARTER || "price_starter"]: 100,
          [process.env.STRIPE_PRICE_PRO || "price_pro"]: 350,
          [process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise"]: 1500,
        };
        const credits = tierCredits[priceId] ?? 0;
        if (credits > 0) {
          users[userId].credits += credits;
        }
      }
    }

    res.json({ received: true });
  });

    // ── Tatum Wallet System ────────────────────────────────────────────────────
  const WALLETS: Record<string, { balance: number; credited: boolean }> = {};
  const AGENT_WALLET_ID = 'agent-network-wallet';
  if (!WALLETS[AGENT_WALLET_ID]) WALLETS[AGENT_WALLET_ID] = { balance: 0, credited: true };

  const TATUM_API_KEY = process.env.TATUM_API_KEY;
  const TATUM_BASE = 'https://api.tatum.io/v3';

  async function tatumCreateAccount(sessionId: string): Promise<string | null> {
    if (!TATUM_API_KEY) return null;
    try {
      const res = await fetch(`${TATUM_BASE}/ledger/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': TATUM_API_KEY },
        body: JSON.stringify({
          currency: 'FCUK',
          accountCode: sessionId,
          accountingCurrency: 'GBP',
          xpub: '',
        }),
      });
      const data = await res.json() as any;
      return data.id || null;
    } catch { return null; }
  }

  async function tatumTransfer(senderId: string, recipientId: string, amount: string, code: string): Promise<boolean> {
    if (!TATUM_API_KEY) return false;
    try {
      const res = await fetch(`${TATUM_BASE}/ledger/transaction/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': TATUM_API_KEY },
        body: JSON.stringify({
          senderAccountId: senderId,
          recipientAccountId: recipientId,
          amount,
          anonymous: false,
          transactionCode: code,
        }),
      });
      return res.ok;
    } catch { return false; }
  }

  // Create / get session wallet
  app.post("/api/wallet/create", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    const exists = !!WALLETS[sessionId];
    if (!WALLETS[sessionId]) WALLETS[sessionId] = { balance: 0, credited: false };

    // Try Tatum real account creation
    const tatumId = await tatumCreateAccount(sessionId);

    res.json({
      walletId: sessionId,
      tatumId,
      balance: WALLETS[sessionId].balance,
      currency: 'FCUK',
      isNew: !exists,
    });
  });

  // Credit sign-up bonus (only once per session)
  app.post("/api/wallet/credit", async (req, res) => {
    const { sessionId, amount = 50 } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    if (!WALLETS[sessionId]) WALLETS[sessionId] = { balance: 0, credited: false };

    if (!WALLETS[sessionId].credited) {
      WALLETS[sessionId].balance += amount;
      WALLETS[sessionId].credited = true;

      // Optionally log to Tatum if accounts available
      // not critical for credit tracking
    }

    res.json({ walletId: sessionId, balance: WALLETS[sessionId].balance, currency: 'FCUK', credited: WALLETS[sessionId].credited });
  });

  // Get wallet balance
  app.get("/api/wallet/:sessionId", (req, res) => {
    const w = WALLETS[req.params.sessionId];
    if (!w) return res.status(404).json({ error: "Wallet not found" });
    res.json({ walletId: req.params.sessionId, balance: w.balance, currency: 'FCUK', credited: w.credited });
  });

  // Transfer from session wallet to agent network wallet
  app.post("/api/wallet/transfer", async (req, res) => {
    const { sessionId, amount } = req.body;
    if (!sessionId || !amount) return res.status(400).json({ error: "sessionId and amount required" });

    const wallet = WALLETS[sessionId];
    if (!wallet) return res.status(404).json({ error: "Session wallet not found" });
    if (wallet.balance < amount) return res.status(402).json({ error: "Insufficient balance" });

    wallet.balance -= amount;
    WALLETS[AGENT_WALLET_ID].balance += amount;

    // Try Tatum real transfer
    if (TATUM_API_KEY) {
      tatumTransfer(sessionId, AGENT_WALLET_ID, String(amount), 'ORDER_PAYMENT').catch(() => {});
    }

    res.json({
      senderWalletId: sessionId,
      receiverWalletId: AGENT_WALLET_ID,
      amount,
      senderBalance: wallet.balance,
      agentBalance: WALLETS[AGENT_WALLET_ID].balance,
      currency: 'FCUK',
    });
  });

  // Get agent network wallet
  app.get("/api/wallet/agent", (req, res) => {
    res.json({
      walletId: AGENT_WALLET_ID,
      balance: WALLETS[AGENT_WALLET_ID].balance,
      currency: 'FCUK',
    });
  });

  // ── Legacy: Checkout Session (spawn agent) ────────────────────────────────
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const stripeInstance = getStripe();
      const session = await stripeInstance.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: "Subordinate Agent Spawn", description: "Custom configuration for a subordinate AI agent." },
            unit_amount: 10000,
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${req.headers.origin}/?success=true`,
        cancel_url: `${req.headers.origin}/?canceled=true`,
      });
      res.json({ id: session.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-portal-session", async (req, res) => {
    try {
      const stripeInstance = getStripe();
      const { customerId } = req.body;
      if (!customerId) return res.status(400).json({ error: "Customer ID is required" });
      const session = await stripeInstance.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/`,
      });
      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Health / Node discovery ──────────────────────────────────────────────
  app.get("/api/health", (req, res) => {
    const alive = Object.entries(childProxies)
      .filter(([, c]) => Date.now() - c.lastSeen < 60_000)
      .map(([id, c]) => ({
        machine_id: id,
        machine_name: id,
        ip_address: c.url.replace(/^https?:\/\//, '').replace(/:\d+$/, ''),
        proxy_port: 6000,
        version: '1.0',
        last_seen: new Date(c.lastSeen).toISOString(),
      }));
    res.json({
      status: 'ok',
      nodes: alive,
      summary: { active_nodes: alive.length },
    });
  });

  // ── Vite / Static ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.error(`Server running on http://localhost:${PORT}`);
  });
}

// ── Dispatch job to least-loaded child proxy ──────────────────────────────
async function dispatchToChildProxy(job: any) {
  const alive = Object.entries(childProxies)
    .filter(([, c]) => Date.now() - c.lastSeen < 60_000)
    .sort(([, a], [, b]) => a.load - b.load);

  if (alive.length === 0) {
    return;
  }

  const [childId, child] = alive[0];
  try {
    const res = await fetch(`${child.url}/dispatch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    });
    if (res.ok) {
      job.status = "dispatched";
      childProxies[childId].load++;
    }
  } catch (err) {
    // Silently fail or implement retry
  }
}

startServer();
