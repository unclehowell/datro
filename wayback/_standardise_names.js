const fs = require('fs');
const path = require('path');

const categories = ['text', 'images', 'pdf', 'video'];
const langCodes = ['en', 'cy', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'ru'];
const stopWords = new Set(['to', 'is', 'at', 'in', 'it', 'on', 'of', 'as', 'by', 'my', 'no', 'up', 'we', 'he', 'or', 'an', 'if', 'hi', 'go', 'do', 'be', 'us', 'id', 'ok', 'tv', 'uk', 'vs', 'rd', 'st', 'nd', 'th', 'dr', 'mr', 'ms', 'co', 'cc', 'll', 'ff', 'pp', 'tt', 'ss', 'dd', 'bb', 'pr', 'hr', 'tr', 'gr', 'cr', 'nc', 'sc', 'nt', 'ny', 'lg', 'kh', 'mc', 'ct', 'ad', 'ed', 'ex', 're', 'un', 'ab', 'lo', 'li', 'la', 'lu', 'lv', 'lb', 'lt', 'ls']);

function extractVersion(name) {
  const matches = name.match(/v[\d.-]+/gi);
  if (!matches) return null;
  let v = matches[matches.length - 1].toLowerCase().replace(/^v/, '').replace(/-/g, '.').replace(/\.{2,}/g, '.');
  if (v.endsWith('.')) v = v.slice(0, -1);
  const parts = v.split('.').filter(p => p.length > 0);
  if (parts.length > 3) parts.length = 3;
  return 'v' + parts.join('.');
}

function detectLang(name) {
  if (name.includes(' - ')) {
    for (const part of name.split(' - ')) {
      const p = part.trim().toLowerCase();
      if (langCodes.includes(p)) return p;
    }
    return 'en';
  }
  const parts = name.split('_');
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase();
    if (langCodes.includes(p) && !stopWords.has(p)) {
      // Found a lang candidate - verify it's not part of the description
      // It should be near the version (last segment)
      if (i >= parts.length - 3) return p;
    }
  }
  return 'en';
}

function removeLangFromDesc(desc, lang) {
  if (!desc) return '';
  const segments = desc.split(/[-_]/);
  return segments.filter(s => s.toLowerCase() !== lang).join('-');
}

function cleanStdName(name) {
  name = name.trim();
  if (name === 'DELETED') return name;
  const lang = detectLang(name);

  let date, catTag, desc, version;

  if (name.includes(' - ')) {
    const parts = name.split(' - ').map(s => s.trim());
    const dateMatch = parts[0].match(/^(\d{4}-\d{2}-\d{2})/);
    date = dateMatch ? dateMatch[1] : '0000-00-00';
    let rest = parts.slice(1);
    version = extractVersion(name);
    if (version) rest = rest.filter(p => !/^v[\d.]/i.test(p));
    rest = rest.filter(p => p.toLowerCase() !== lang && p.toLowerCase() !== lang.toUpperCase());
    desc = rest.join('-').toLowerCase();
    desc = desc.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
    catTag = '';
  } else {
    const parts = name.split('_').filter(p => p.length > 0);
    if (parts.length < 2) return name;
    const dateMatch = parts[0].match(/^(\d{4}-\d{2}-\d{2})/);
    date = dateMatch ? dateMatch[1] : '0000-00-00';
    version = extractVersion(name);
    if (!version) return name;

    let langIdx = -1;
    let verIdx = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i].toLowerCase();
      if (p === lang) { langIdx = i; break; }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].toLowerCase().startsWith('v') && parts[i].match(/^v[\d.]/i)) { verIdx = i; break; }
    }

    const endIdx = langIdx > 0 ? langIdx : (verIdx > 0 ? verIdx : parts.length);
    let middle = parts.slice(1, endIdx);
    if (middle.length === 0) { desc = ''; catTag = ''; }
    else if (middle.length === 1) { desc = middle[0]; catTag = ''; }
    else { catTag = middle[0]; desc = middle.slice(1).join('-'); }
  }

  if (catTag && desc) {
    const catParts = catTag.split('-').filter(Boolean);
    const descParts = desc.split('-').filter(Boolean);
    let matchLen = 0;
    for (let i = 0; i < Math.min(catParts.length, descParts.length); i++) {
      if (catParts[i].toLowerCase() === descParts[i].toLowerCase()) matchLen++;
      else break;
    }
    if (matchLen > 0) desc = descParts.slice(matchLen).join('-');
  }

  desc = removeLangFromDesc(desc || '', lang);

  if (desc) {
    desc = desc.toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }
  if (catTag) {
    catTag = catTag.replace(/[-_]\d{3,}$/, '');
    catTag = catTag.toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');
  }

  let newName = date;
  if (catTag) newName += '_' + catTag;
  if (desc) newName += '_' + desc;
  if (!version) version = 'v0.0.0';
  newName += '_' + lang + '_' + version;

  newName = newName.replace(/__+/g, '_').replace(/_-_/g, '-').replace(/_+-_/g, '-');
  newName = newName.replace(/_+/g, '_').replace(/-+/g, '-');
  newName = newName.replace(/_([a-z])/g, (_, c) => '_' + c);
  newName = newName.replace(/-([a-z])/g, (_, c) => '-' + c);

  return newName;
}

for (const category of categories) {
  const filePath = path.join(__dirname, 'wayback', category, '_treeview.json');
  let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changes = 0;

  for (const item of data) {
    const oldName = item.name;
    if (!oldName || oldName === 'DELETED') continue;
    const newName = cleanStdName(oldName);
    if (newName !== oldName) {
      item.name = newName;
      changes++;
      const prefix = oldName.length > 70 ? '...' + oldName.slice(-67) : oldName;
      const suffix = newName.length > 70 ? '...' + newName.slice(-67) : newName;
      console.log(`  ${prefix}  ->  ${suffix}`);
    }
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
  console.log(`[${category}] ${changes} changes`);
}
