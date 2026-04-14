#!/usr/bin/env node
// process-intray.js — classifies MD files in _intray/ and moves them to the right path
// Called by build.js before the main build

import { readdirSync, readFileSync, renameSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';

const ROOT = new URL('.', import.meta.url).pathname;
const INTRAY = join(ROOT, '_intray');
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const CATEGORIES = {
  'agent_soul': 'Identity, values, personality, soul, purpose of the agent',
  'agent_memory': 'Memory systems, Honcho, Mem0, recall, persistence',
  'agent_skills_autonomous': 'Autonomous agents, self-directed tasks, planning, delegation',
  'agent_skills_communication': 'Communication tools: email, messaging, Apple, MCP, social media',
  'agent_skills_creative': 'Creative work: design, media, video, music, art, web templates',
  'agent_skills_devops': 'DevOps, GitHub, software development, infrastructure, domain',
  'agent_skills_lifestyle': 'Lifestyle: gaming, productivity, smart home, note-taking',
  'agent_skills_research': 'Research, ML, data science, papers, models, training',
  'memory_longterm': 'Long-term memory providers: Honcho, Mem0 integration details',
};

async function classifyFile(filename, content) {
  if (!GROQ_API_KEY) {
    console.log(`[intray] No GROQ_API_KEY — skipping classification, using agent_memory as default`);
    return 'agent_memory';
  }

  const prompt = `You are classifying a markdown document into one of these categories for an AI agent knowledge base:

${Object.entries(CATEGORIES).map(([k,v]) => `- ${k}: ${v}`).join('\n')}

Filename: ${filename}
Content preview: ${content.slice(0, 500)}

Reply with ONLY the category key (e.g. agent_skills_devops). Nothing else.`;

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20,
      temperature: 0
    })
  });

  const data = await resp.json();
  const category = data.choices?.[0]?.message?.content?.trim().replace(/[^a-z_]/g, '');
  return CATEGORIES[category] ? category : 'agent_memory';
}

async function processIntray() {
  if (!existsSync(INTRAY)) {
    console.log('[intray] No _intray directory, skipping');
    return;
  }

  const files = readdirSync(INTRAY).filter(f => f.endsWith('.md'));
  if (!files.length) {
    console.log('[intray] No files to process');
    return;
  }

  console.log(`[intray] Processing ${files.length} file(s)...`);

  for (const file of files) {
    const src = join(INTRAY, file);
    const content = readFileSync(src, 'utf8');
    const category = await classifyFile(file, content);
    const dest = join(ROOT, category, 'latest', 'source', file);

    mkdirSync(join(ROOT, category, 'latest', 'source'), { recursive: true });
    renameSync(src, dest);
    console.log(`[intray] ${file} → ${category}/latest/source/${file}`);
  }
}

async function checkWayback(category) {
  try {
    const resp = await fetch(
      `https://wayback.financecheque.xyz/wayback/`,
      { headers: { 'X-API-Key': 'wayback-readonly-key-unclehowell-2026' } }
    );
    // Look for PDFs matching this category
    const text = await resp.text();
    const matches = [...text.matchAll(new RegExp(`(${category}[^"'<>]+\\.pdf)`, 'gi'))];
    return matches.map(m => m[1]);
  } catch { return []; }
}

export { processIntray, checkWayback };
