// Cloudflare Pages Function
// File location: static/pcp2/functions/api/submit-claim.ts

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, API-KEY",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: any) {
  try {
    const req = context.request;

    console.log("INCOMING REQUEST: method=POST, url=", req.url || "(unknown)");
    const incomingHeaders: any = {};
    ["user-agent", "content-type", "referer", "origin", "cf-connecting-ip"].forEach(h => {
      incomingHeaders[h] = req.headers.get(h) || "";
    });
    console.log("INCOMING HEADERS:", JSON.stringify(incomingHeaders));

    // ── Parse incoming request (supports both FormData and JSON) ──
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }

    console.log("RECEIVED FIELDS:", Object.keys(body));

    // ── Helpers ──────────────────────────────────────────────────
    const formatDOB = (input: string): string => {
      if (!input) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      if (input.includes("/")) {
        const [day, month, year] = input.split("/");
        if (!day || !month || !year) return input;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return input;
    };

    const formatPostcode = (pc: string): string => {
      const clean = String(pc || "").replace(/\s+/g, "").toUpperCase();
      if (clean.length >= 5) return clean.slice(0, -3) + " " + clean.slice(-3);
      return clean;
    };

    const formatPhone = (p: string): string => {
      const clean = String(p || "").replace(/\s+/g, "");
      if (clean.startsWith("0")) return "+44" + clean.slice(1);
      return clean;
    };

    const toTitleCase = (s: string): string =>
      String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1).toLowerCase();

    // ── Extract and format fields ─────────────────────────────────
    const title             = String(body.title || "").trim();
    const first_name        = toTitleCase(String(body.first_name || "").trim());
    const last_name         = toTitleCase(String(body.last_name || "").trim());
    const email             = String(body.email || "").trim();
    const phone             = formatPhone(String(body.phone || "").trim());
    const date_of_birth     = formatDOB(String(body.date_of_birth || "").trim());
    const buildingNumber    = String(body.buildingNumber || "").trim();
    const thoroughfare      = String(body.thoroughfare || "").trim();
    const townOrCity        = String(body.townOrCity || "").trim();
    const postcode_formatted = formatPostcode(String(body.postcode || "").trim());
    const session_id        = body.session_id || crypto.randomUUID();
    const device_session_id = body.device_session_id || crypto.randomUUID();

    console.log("ADDRESS FIELDS:", {
      buildingNumber: !!buildingNumber,
      thoroughfare: !!thoroughfare,
      townOrCity: !!townOrCity,
      postcode: !!postcode_formatted
    });

    // ── Signature: Full base64 from notes/example.png ─────────────────────────────────
    // ⚠️ R2R API SPEC: signature field MUST be prefixed with "data:image/png;base64,"
    // CORRECT:  `signature: "data:image/png;base64," + SIG`  ← FIXED in payload (line 121)
    // WRONG:    `signature: SIG`  (what it would look like without the prefix)
    // See: API_GUIDE.md "SIGNATURE FORMAT" and R2R PDF schema for verification.
    const SIG = 'iVBORw0KGgoAAAANSUhEUgAAAlAAAADACAYAAADLG10vAAAQAElEQVR4AezdCdwkRX0+8BrvA3U1EVGJLl4Yjfd9RBcVD+ItxgOPxSMST4wnGpNFBU08st6JGoUoXjFqTDyIqEtEDSCCoqLIsQKSYBRQSDgk+t9v86+X3uE95n1n5n17Zp79bL3dXV1dXf1UT9dTv6uu8Nv8CwJBIAgEgSAQBIJAEFgWAlco+RcEgkAQCAJBYOIQSIODwNoiEAK1tvjn7kEgCASBIBAEgsAEIhACNYGdliYHgS4gkDYEgSAQBGYZgRCoWe79PHsQCAJBIAgEgSCwIgRCoFYEWxcuShuCQBAIAkEgCASBtUIgBGqtkM99g0AQCAJBIAjMIgJT8swhUFPSkXmMIBAEgkAQCAJBYPUQCIFaPaxzpyAQBIJAFxBIG4JAEBgBAiFQIwAxVQSBIBAEgkAQCAKzhUAI1Gz1d562CwikDUEgCASBIDDxCIRATXwX5gGCQBAIAkEgCASB1UZgFgnUamOc+wWBIBAEgkAQCAJThkAI1JR1aB4nCASBIBAEphWBPFeXEAiB6lJvpC1BIAgEgSAQBILARCAQAjUR3ZRGBoEg0AUE0oYgEASCQEUgBKoikW0QCAJBIAgEgSAQBAZEIARqQKBSrAsIpA1BIAgEgSAQBLqBQAhUN/ohrQgCQSAIBIFtCGzdurWcfPLJ2/byPwh0G4FlEahuP0paFwSCQBAIApOKwKc//enyvOc9r+yyyy7lFre4RbnDHe5Qfv7zn0/q46TdM4BACNQMdHIeMQgEgSDQZQSe85znlMc+9rHl3e9+91wzv/vd75aXv/zlc8dD7uTyIDByBEKgRg5pKgwCQSAIBIGlEKCqe/Ob31x6vV5573vf2xS/9a1vXd7whjc0+/6ccMIJNklBoJMIhEB1slvSqCAwZQjkcYJAC4H999+/7LPPPuVlL3vZXO6mTZsKwvTKV76y3PKWt2zyv/e97zXb/AkCXUQgBKqLvZI2BYEgEASmEIFDDjmk3PzmNy/I0qGHHlrWr1/f7J9++unlL//yL+ee+La3vW2zf/7555df/OIXzX7+BIGuIRAC1bUeGU97UmsQCAJBYE0QOPPMM8vmzZvLTW5yk/KUpzylnHLKKU07NmzYUE499dSGOO28885NXv2zww471N3yq1/9am4/O0GgSwiEQHWpN9KWIBAEgsAUIUDitO+++5YXv/jFhZTp8Y9/fHnPe95TfvrTn5avfvWrZaF/be+7K17xigsVS/5MINDdhwyB6m7fpGVBIAgEgYlEgI3THnvs0UictmzZUvbaa6/yiU98oklsn250oxst+lxnnXVWc37dunVlp512avbzJwh0DYEQqK71SNoTBIJAEOgQAstpykknnVSQp02bNpUvfOEL5cADDywHH3xw+fCHP1xInwap64ILLijf//73m6LXuc51ylWucpVmP3+CQNcQCIHqWo+kPUEgCASBCUPgtNNOa6RNu+++e0Ge2Dcdc8wxZb/99isPe9jDlvU0Rx99dLn44ouba3bbbbdmmz9BoIsIhEB1sVfSpiAwh0B2gkC3ERDD6Ta3uU054ogjyrptKje2TdKd73znFTX885///Nx1K61jroLsBIExIhACNUZwU3UQCAJBYFoROPzww8uDH/zgIor43e52t/K2t72tHHvssYX0aaXP/Nvf/rZ85CMfmbtc/XMH2QkCHUMgBGqJDsnpIBAEgkAQuAyB73znO+W+971vQ5SEKOBV99GPfrQ86lGPuqzQCve++MUvNt56Lrce3q677mo3KQh0EoEQqE52SxoVBIJAEOgWAoy7n/nMZ5Y73vGO5cgjj2xCE3zta19rIoqPylPurW99a/PQQhdkHbwGimH+5NoxIxACNWaAU30QCAJBYNIRECX8Gte4Rvn4xz/eLL9y9tlnF2Tnute97sgeTVDNww47rKnvmte8ZvnjP/7jZj9/gkBXEQiB6mrPpF1BIAhMNgJT0Prjjz++3PWudy0HHHBAecQjHlEc//Vf/3W51rWuNfKne/3rXz9XJ3WgEAZzGdkJAh1EIASqg52SJgWBIBAE1hIB689ZduX2t79941n3la98pXz2s58tu+yyy1iaJfL4Jz/5yabuq1/96uXJT35ys58/QaDLCIRAdbl30rZhEMi1QSAILBOBCy+8sDz/+c8vv/u7v1u+9KUvlX/+538uhx56aLnf/e63zJqWV1wohLrm3Q1veMPygAc8YHkVpHQQWAMEQqDWAPTcMggEgSDQNQRImHi+fehDHyqvetWrygknnFAe+chHFgbd42wr4vTmN7957hZPfepTE318Do3sdBmB8RGoLj912hYEgkAQCAINAmIvvfrVr27CEIjnZBkVNk/Xu971mvPj/nPQQQeVc845Z+42D3nIQ+b2sxMEuoxACFSXeydtCwJBIAiMEYFvfetbjbruLW95S7PQ76c//emy8847j/GO21d9ySWXNEu/1FwE7l73ulc9XLNtbhwEBkEgBGoQlFImCASBIDBFCPzyl78svN4Qlic96UnlrLPOGnix31HC8I//+I/bSZ/e+MY3jrL61BUExopACNRY4U3lQSAILB+BXDFOBET73nPPPYsI4pZjeec731nWKmSAe9dnZX91//vfvx5mGwQ6j0AIVOe7KA0MAkEgCAyPwNatW8sTnvCEZq05kqef/vSnY/euW6zVRx99dPnGN74xV+Rxj3vc2A3W526WnSAwAgRCoEYA4rRVkecJAkFg/AicdtpphQH1+O9UCs+6O9/5zuV//ud/yktf+tJy4IEHrsZtF73H5s2b587vsMMO29lCzZ3IThDoMAIhUB3unDQtCASB6URg7733Lje96U2L7ThJ1CmnnFKe/vSnN/cRQZyRuOCYa43qySef3EjCajte+MIXlqtd7Wr1MNsgsFIEVvW6EKhVhTs3CwJBYNYRYDjdJk3skMaBiSCYt7rVrcoPf/jD8qMf/ag861nPKle+8pXHcatl1/mmN71p7hpt+tM//dO54+wEgUlBIARqUnoq7QwCQWDiEbBESXuR3Fve8pbFQr2jfLCTTjqp3Pve9y777LNPedvb3la++c1vlpvf/OajvMXCdQ1wxjIxbQK5cePGVQ2dMEATUyQIDIRACNRAMKVQEAgCQWDlCCAMlkf56Ec/OlfJzW52s3LiiSeW9evXz+UNuyM0AVImeviWLVvK8573vHKFK3TrM//+97+/XHTRRXOPuu+++87tZycITBIC3fplTRJyaWsQ6B4CaVEHEWB79IIXvKCQvNTmPehBD2rWmKvHw27/+7//u9z3vvctr3nNa8o73vGO8rWvfa3suuuuw1Y78usZsWtfrfgRj3hEuc1tblMPs10GAnDcbbfdinTeeect48oUHRUCVxhVRaknCASBIBAELkNg69atRWyjV7ziFeX888+fO/HgBz+4Uds5N5c5xA4V3Y477lgMotavsxjwENWN9VKxp4RPqDdBLOt+toMhsP/++5c73elOheE9KaN0zDHHDHZxSo0UgRCoUcKZuoJAEAgC2xA45JBDyu677154m207nPu/bt26wuaHtGguc4U7F1xw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';
    
    // ── Addresses ─────────────────────────────────────────────────────────────────────
    // ⚠️ R2R API SPEC: addresses MUST be an ARRAY of objects: Address[]
    // WRONG:    `addresses: { buildingNumber, thoroughfare, ... }`  ← old code
    // CORRECT:  `addresses: [{ buildingNumber, thoroughfare, ... }]` ← FIXED: wrapped in []
    // Full field schema per PDF: line1, line2, line3, line4, buildingName, buildingNumber,
    // thoroughfare, townOrCity, district, postcode
    // See: API_GUIDE.md payload example and R2R PDF schema.
    const addresses = [{
      line1:          null,
      line2:          null,
      line3:          null,
      line4:          null,
      buildingName:   null,
      buildingNumber: buildingNumber || null,
      thoroughfare:   thoroughfare || null,
      townOrCity:     townOrCity || null,
      district:       null,
      postcode:       postcode_formatted || null,
    }];

    // ── Final payload ─────────────────────────────────────────────
    const payload: any = {
      title,
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      client_ip:            req.headers.get("cf-connecting-ip") || "",
      user_agent:           req.headers.get("user-agent") || "",
      session_id,
      device_session_id,
      account_creation_url: "https://car.financecheque.uk/claim",
      addresses,
      opt_in:               true,
      // ⚠️ signature MUST include "data:image/png;base64," prefix per R2R API spec
      signature:            "data:image/png;base64," + SIG,
      signature_image:      "data:image/png;base64," + SIG,
    };

    console.log("FINAL PAYLOAD KEYS:", Object.keys(payload));

    // ── Send to R2R ───────────────────────────────────────────────
    const affiliateId = context.env.VITE_AFFILIATE_ID || "a4429cda-e36a-472a-8291-ae01a49349d8";
    const apiKey       = context.env.VITE_API_KEY;

    if (!apiKey) {
      console.error("MISSING ENV: VITE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing API key' }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    const url = `https://r2r.theclaimsystem.co.uk/api/v1/affiliate/${affiliateId}`;

    const upstreamHeaders: any = {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "API-KEY":       apiKey,
      "User-Agent":    req.headers.get('user-agent') || 'Cloudflare-Function',
    };

    console.log("SENDING TO UPSTREAM:", url);
    console.log("UPSTREAM HEADERS:", Object.keys(upstreamHeaders));

    const res = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("R2R STATUS:", res.status);
    console.log("R2R BODY (truncated):", text ? text.slice(0, 200) : "(empty)");

    const responseHeaders = { "Content-Type": "application/json", ...CORS_HEADERS };
    return new Response(text, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (err: any) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }
}
