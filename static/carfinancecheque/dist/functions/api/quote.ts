// Cloudflare Pages Function
// File location: static/carfinancecheque/functions/api/quote.ts
// POST /api/quote  { principal, termMonths, annualRatePct?, financeType? }

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, API-KEY",
};

const DISCLAIMER =
  "Illustrative estimate only. Rates and terms are subject to broker, lender and funder approval. This is not a credit offer.";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calculateMonthlyPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (annualRatePct === 0) {
    return principal / termMonths;
  }
  const monthlyRate = annualRatePct / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: any) {
  try {
    const req = context.request;
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Content-Type must be application/json" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Request body must be a JSON object" }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const principal = Number(body.principal);
    const termMonths = Number(body.termMonths);
    const annualRatePct = body.annualRatePct !== undefined ? Number(body.annualRatePct) : 11.9;
    const financeType = String(body.financeType || "loan");

    const errors: Record<string, string> = {};
    if (!Number.isFinite(principal) || principal < 500 || principal > 100000) {
      errors.principal = "principal must be a number between 500 and 100000";
    }
    if (!Number.isInteger(termMonths) || termMonths < 12 || termMonths > 84) {
      errors.termMonths = "termMonths must be an integer between 12 and 84";
    }
    if (!Number.isFinite(annualRatePct) || annualRatePct < 0 || annualRatePct > 50) {
      errors.annualRatePct = "annualRatePct must be a number between 0 and 50";
    }
    if (!["pcp", "hp", "loan"].includes(financeType)) {
      errors.financeType = "financeType must be one of: pcp, hp, loan";
    }

    if (Object.keys(errors).length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed.", errors }),
        { status: 422, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const monthlyPayment = round2(calculateMonthlyPayment(principal, annualRatePct, termMonths));
    const totalPayable = round2(monthlyPayment * termMonths);
    const totalInterest = round2(totalPayable - principal);

    return new Response(
      JSON.stringify({
        data: {
          principal,
          termMonths,
          annualRatePct,
          monthlyPayment,
          totalInterest,
          totalPayable,
          estimate: true,
          disclaimer: DISCLAIMER,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}