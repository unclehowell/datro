// Cloudflare Pages Function
// File location: static/carfinancecheque/functions/api/products.ts
// GET /api/products?type=pcp|hp|loan&page=1&limit=10

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, API-KEY",
};

const PRODUCTS = [
  {
    id: "pcp-eligibility-check",
    type: "pcp",
    name: "PCP Eligibility Check",
    description: "Free eligibility check for mis-sold PCP car finance agreements taken out between 2007 and 2021.",
    feeModel: "Free",
    price: 0,
    averageRefund: 1100,
    representativeApr: "2.9% - 19.9%",
    features: ["Instant online check", "No obligation", "FCA regulated process"],
  },
  {
    id: "pcp-claims-management",
    type: "pcp",
    name: "PCP Claims Management",
    description: "Managed claim for mis-sold PCP finance with discretionary commission arrangements (DCAs).",
    feeModel: "No Win No Fee",
    price: 0,
    averageRefund: 1100,
    representativeApr: "2.9% - 19.9%",
    features: ["Dedicated claims handler", "No Win No Fee terms", "Follow-up to finalisation"],
  },
  {
    id: "hp-claims-management",
    type: "hp",
    name: "HP Claims Management",
    description: "Managed claim for mis-sold Hire Purchase (HP) car finance agreements.",
    feeModel: "No Win No Fee",
    price: 0,
    averageRefund: 1100,
    representativeApr: "3.9% - 17.9%",
    features: ["Dedicated claims handler", "No Win No Fee terms", "Follow-up to finalisation"],
  },
  {
    id: "car-finance-repayment-plan",
    type: "loan",
    name: "Car Finance Repayment Illustration",
    description: "Illustrative repayment estimate for car finance agreements used to explain typical PCP/HP monthly costs.",
    feeModel: "Free",
    price: 0,
    representativeApr: "11.9% representative",
    features: ["Instant estimate", "Illustrative only", "Subject to funder approval"],
  },
];

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: any) {
  try {
    const url = new URL(context.request.url);
    const typeParam = url.searchParams.get("type");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const validTypes = ["pcp", "hp", "loan"];
    if (typeParam && !validTypes.includes(typeParam)) {
      return new Response(
        JSON.stringify({ error: `Invalid type filter '${typeParam}'. Allowed values: ${validTypes.join(", ")}` }),
        { status: 422, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || "10", 10) || 10));

    let filtered = PRODUCTS;
    if (typeParam) {
      filtered = PRODUCTS.filter((p) => p.type === typeParam);
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return new Response(
      JSON.stringify({
        data,
        pagination: { page, limit, total, totalPages },
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