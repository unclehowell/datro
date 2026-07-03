#!/usr/bin/env node
/**
 * Phone Proxy Detector — Routes LLM calls via phone compute when available
 * Reduces load on laptop CPU/memory
 */

import 'dotenv/config';

const PHONE_URL = process.env.PHONE_PROXY_URL || 'https://phone-proxy.financecheque.uk';
const LOCAL_FALLBACK = process.env.LOCAL_FALLBACK !== 'false';
const TIMEOUT_MS = 5000;

// Check phone proxy health
async function isPhoneOnline() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const resp = await fetch(`${PHONE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await resp.json();
    return data?.ok && data?.activeJobs < 10; // Phone responsive and not overloaded
  } catch {
    return false;
  }
}

// Route chat through phone proxy if available
async function chatViaPhone(messages, model = 'proxy-router') {
  const online = await isPhoneOnline();
  if (!online && !LOCAL_FALLBACK) {
    throw new Error('Phone proxy unavailable and no fallback allowed');
  }
  
  if (online) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const resp = await fetch(`${PHONE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: 1024 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await resp.json();
      if (data?.choices?.[0]?.message?.content) {
        return { content: data.choices[0].message.content, routedTo: 'phone' };
      }
    } catch (e) {
      console.log(`Phone proxy fallback: ${e.message}`);
    }
  }
  
  // Fallback to local
  if (LOCAL_FALLBACK) {
    return chatViaLocal(messages, model);
  }
  throw new Error('No compute endpoint available');
}

async function chatViaLocal(messages, model) {
  try {
    const resp = await fetch('http://localhost:6000/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 1024 })
    });
    const data = await resp.json();
    return { content: data?.choices?.[0]?.message?.content || 'No response', routedTo: 'local' };
  } catch {
    return { content: 'Local proxy unavailable', routedTo: 'none' };
  }
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const online = await isPhoneOnline();
  console.log(`Phone proxy status: ${online ? 'online' : 'offline'}`);
  if (process.argv[2]) {
    const result = await chatViaPhone([{ role: 'user', content: process.argv[2] }]);
    console.log(`[${result.routedTo}] ${result.content}`);
  }
}

export { isPhoneOnline, chatViaPhone, chatViaLocal };