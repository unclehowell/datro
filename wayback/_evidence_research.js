const https = require('https');
const fs = require('fs');
const path = require('path');

const PROXY_URL = process.env.PARENT_PROXY_URL || 'https://www.financecheque.uk';
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const REPO = 'unclehowell/datro';
const BRANCH = 'wayback';

// The four wayback categories
const CATEGORIES = ['text', 'images', 'pdf', 'video'];
const WAYBACK_DIR = path.resolve(__dirname, 'wayback');

/**
 * Call the AI proxy (same one the flywheel uses)
 */
async function brainstorm(system, prompt, timeoutMs = 30000) {
  const url = `${PROXY_URL}/api/proxy?action=chat`;
  const payload = {
    message: `${system}\n\n${prompt}`,
    chat_only: true,
    model: process.env.AI_MODEL || 'openrouter/anthropic/claude-sonnet'
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Chat-Only': 'true' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error(`AI API error: ${resp.status} ${text.slice(0, 200)}`);
      return null;
    }
    const data = await resp.json();
    return data.reply || data.choices?.[0]?.message?.content || null;
  } catch (err) {
    clearTimeout(timer);
    console.error(`AI query failed: ${err.message}`);
    return null;
  }
}

/**
 * Load existing treeview entries for a category.
 */
function loadTreeview(category) {
  const tvPath = path.join(WAYBACK_DIR, category, '_treeview.json');
  if (!fs.existsSync(tvPath)) return [];
  const raw = fs.readFileSync(tvPath, 'utf8');
  try { return JSON.parse(raw); } catch (e) { return []; }
}

/**
 * Save treeview entries for a category.
 */
function saveTreeview(category, entries) {
  const tvPath = path.join(WAYBACK_DIR, category, '_treeview.json');
  fs.mkdirSync(path.dirname(tvPath), { recursive: true });
  fs.writeFileSync(tvPath, JSON.stringify(entries, null, 2));
  console.log(`Updated ${tvPath}: ${entries.length} entries`);
}

/**
 * Generate a standardised filename: YYYY-MM-DD_cat-tag_description_en_vX.X.X
 */
function generateFilename(date, category, tag, description, version) {
  const d = date || '0000-00-00';
  const safeDesc = description.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return `${d}_${category}-${tag}_${safeDesc}_en_v${version}`;
}

/**
 * Check if a proposed name already exists across all treeviews.
 */
function isDuplicate(allEntries, proposedName) {
  for (const cat of CATEGORIES) {
    const entries = allEntries[cat] || [];
    if (entries.some(e => e.name === proposedName)) return true;
  }
  return false;
}

/**
 * Build a manifest of existing evidence so the AI can find gaps.
 */
function buildExistingEvidenceManifest(allEntries) {
  const manifest = {};
  for (const cat of CATEGORIES) {
    manifest[cat] = (allEntries[cat] || []).map(e => ({
      name: e.name,
      path: e.path,
      tags: e.tags || []
    }));
  }
  return manifest;
}

/**
 * Write a new text content file in the wayback/text/ directory.
 */
function writeTextContent(filename, content, sourceAttribution) {
  const filePath = path.join(WAYBACK_DIR, 'text', filename + '.txt');
  const full = `${sourceAttribution}\n${'='.repeat(60)}\n\n${content}`;
  fs.writeFileSync(filePath, full);
  console.log(`Created: ${filePath}`);
  return { path: `text/${filename}.txt`, name: filename + '.txt' };
}

async function run() {
  console.log('=== Wayback Evidence Discovery ===');
  console.log(`Proxy: ${PROXY_URL}`);
  console.log(`Branch: ${BRANCH}`);

  // 1. Load ALL existing entries across all categories
  const allEntries = {};
  let totalExisting = 0;
  for (const cat of CATEGORIES) {
    allEntries[cat] = loadTreeview(cat);
    totalExisting += allEntries[cat].length;
  }
  console.log(`Total existing entries: ${totalExisting}`);

  // 2. Build the manifest for the AI
  const manifest = buildExistingEvidenceManifest(allEntries);

  // 3. Determine the next version number
  let maxVersion = 0;
  for (const cat of CATEGORIES) {
    for (const entry of allEntries[cat]) {
      const name = entry.name || '';
      const vMatch = name.match(/v(\d+)\.(\d+)\.(\d+)/);
      if (vMatch) {
        const vNum = parseInt(vMatch[1]);
        if (vNum > maxVersion) maxVersion = vNum;
      }
    }
  }
  const nextVersion = `${maxVersion + 1}.0.0`;

  // 4. Ask the AI to find NEW unique evidence
  const systemPrompt = `You are an expert historical and legal researcher specializing in Welsh land records. You are helping build a digital archive of evidence about Great House Farm, Llandough (near Penarth, Vale of Glamorgan, CF64 — NOT the Llandough near Cowbridge, NOT Landow/Llandow).`;

  const userPrompt = `Here is the current manifest of evidence already in the wayback library:

${JSON.stringify(manifest, null, 2)}

Your task is to propose ONE new piece of unique, original evidence about Great House Farm, Llandough (nr. Penarth) that is NOT already in the manifest above. This must be REAL evidence — a genuine historical record, citation, document, or source.

Evidence types to consider:
- Land Registry entries (title numbers WA231076, WA240304)
- Manor of Llandough court rolls and manorial documents
- Ordnance Survey maps showing Great House Farm
- Tithe maps and apportionments for Llandough parish
- Census records (1841-1911) for Great House Farm occupants
- Bute Estate records mentioning the farm or Ty Mawr
- Court records (BP v Buckler 1987)
- Planning applications for Church View Close
- Archaeological reports (Cotswold Archaeology Llandough 1994)
- Newspaper articles mentioning the farm or family
- Historical photographs or descriptions
- Any other primary source about this specific property

Respond in this strict JSON format ONLY:
{
  "date": "YYYY-MM-DD or 0000-00-00",
  "category": "text|images|pdf|video",
  "contentType": "a short hyphenated tag like 'land-registry' or 'census' or 'map' or 'court-record' or 'newspaper' or 'archaeology' or 'estate-record' or 'planning' or 'photograph'",
  "description": "brief unique description (max 60 chars, lowercase, hyphenated)",
  "sourceAttribution": "Full archive/source name and reference number",
  "content": "The text content of the evidence (a transcript, citation, or detailed description). If this is a known record, describe what it contains and its significance. If specific details are unavailable from memory, provide the most accurate known reference with a note about what to verify.",
  "significance": "Why this is important evidence for Great House Farm"
}`;

  const reply = await brainstorm(systemPrompt, userPrompt);
  if (!reply) {
    console.log('No AI response received, cannot generate evidence');
    process.exit(1);
  }

  // 5. Parse the JSON response
  let proposal;
  try {
    const startBrace = reply.indexOf('{');
    const endBrace = reply.lastIndexOf('}');
    if (startBrace === -1 || endBrace === -1) throw new Error('No JSON found');
    proposal = JSON.parse(reply.slice(startBrace, endBrace + 1));
  } catch (e) {
    console.error(`Failed to parse AI response as JSON: ${e.message}`);
    console.error('Raw response:', reply.slice(0, 500));
    process.exit(1);
  }

  console.log('AI Proposed Evidence:');
  console.log(JSON.stringify(proposal, null, 2));

  // 6. Check it's not a duplicate
  const proposedName = generateFilename(
    proposal.date,
    proposal.category,
    proposal.contentType,
    proposal.description,
    nextVersion
  );

  if (isDuplicate(allEntries, proposedName)) {
    console.log('Proposed evidence appears to be a duplicate. Skipping.');
    process.exit(0);
  }

  // 7. Write the content file and update treeview
  let fileInfo;
  if (proposal.category === 'text') {
    fileInfo = writeTextContent(proposedName, proposal.content, proposal.sourceAttribution);
  } else {
    // For non-text categories, just add the citation as a text file with a note
    fileInfo = writeTextContent(
      proposedName,
      proposal.content,
      proposal.sourceAttribution
    );
    // Override to text category since we're creating a text file
    proposal.category = 'text';
  }

  // 8. Add to treeview
  const treeviewEntry = {
    name: fileInfo.name,
    path: fileInfo.path,
    tags: [
      proposal.contentType,
      'great-house-farm',
      'llandough',
      'penarth',
      'vale-of-glamorgan',
      ...(proposal.date !== '0000-00-00' ? [proposal.date] : [])
    ]
  };

  allEntries[proposal.category].push(treeviewEntry);
  saveTreeview(proposal.category, allEntries[proposal.category]);

  console.log('=== Successfully added new evidence ===');
  console.log(`Name: ${fileInfo.name}`);
  console.log(`Path: ${fileInfo.path}`);
  console.log(`Category: ${proposal.category}`);
  console.log(`Tags: ${treeviewEntry.tags.join(', ')}`);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
