#!/usr/bin/env node
// build.js — builds each agent section's MD sources into HTML (VitePress) + PDF (md-to-pdf)

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, relative, basename } from 'path';
import { mdToPdf } from 'md-to-pdf';

const ROOT = new URL('.', import.meta.url).pathname;

// Discover all */latest/source directories
function findSourceDirs() {
  const dirs = [];
  for (const entry of readdirSync(ROOT)) {
    if (entry.startsWith('_') || entry.startsWith('.')) continue;
    const latestSrc = join(ROOT, entry, 'latest', 'source');
    if (existsSync(latestSrc) && statSync(latestSrc).isDirectory()) {
      dirs.push({ section: entry, src: latestSrc, base: join(ROOT, entry, 'latest') });
    }
  }
  return dirs;
}

// Collect all .md files recursively, sorted
function collectMd(dir) {
  const files = [];
  function walk(d) {
    for (const f of readdirSync(d).sort()) {
      const full = join(d, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.md')) files.push(full);
    }
  }
  walk(dir);
  return files;
}

// Build VitePress HTML for a section
function buildHtml(section, src, htmlOut) {
  mkdirSync(htmlOut, { recursive: true });

  // Generate .vitepress/config.js dynamically
  const vpDir = join(src, '.vitepress');
  mkdirSync(vpDir, { recursive: true });

  const mdFiles = collectMd(src);
  const sidebarItems = mdFiles.map(f => {
    const rel = '/' + relative(src, f).replace(/\\/g, '/');
    const name = basename(f, '.md');
    return `{ text: '${name}', link: '${rel.replace(/\.md$/, '')}' }`;
  });

  writeFileSync(join(vpDir, 'config.js'), `
import { defineConfig } from 'vitepress'
export default defineConfig({
  title: '${section.replace(/_/g, ' ')}',
  outDir: '${htmlOut}',
  base: '/llmwiki/${section}/latest/build/html/en/',
  themeConfig: {
    sidebar: [{ items: [${sidebarItems.join(',')}] }]
  }
})
`);

  execSync(`npx vitepress build "${src}"`, { stdio: 'inherit', cwd: ROOT });
}

// Build PDF for a section — concatenate all MD then convert
async function buildPdf(section, src, pdfOut) {
  mkdirSync(pdfOut, { recursive: true });
  const mdFiles = collectMd(src);
  const combined = mdFiles.map(f => readFileSync(f, 'utf8')).join('\n\n---\n\n');
  const tmpMd = join(pdfOut, '_combined.md');
  writeFileSync(tmpMd, combined);

  const pdfPath = join(pdfOut, `${section}.pdf`);
  await mdToPdf({ path: tmpMd }, { dest: pdfPath, launch_options: { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] } });
  console.log(`PDF: ${pdfPath}`);
}

// Main
const sections = findSourceDirs();
console.log(`Building ${sections.length} sections...`);

for (const { section, src, base } of sections) {
  const htmlOut = join(base, 'build', 'html', 'en');
  const pdfOut  = join(base, 'build', 'latex', 'en');
  console.log(`\n=== ${section} ===`);
  try {
    buildHtml(section, src, htmlOut);
  } catch (e) {
    console.error(`HTML build failed for ${section}:`, e.message);
  }
  try {
    await buildPdf(section, src, pdfOut);
  } catch (e) {
    console.error(`PDF build failed for ${section}:`, e.message);
  }
}

console.log('\nDone.');
