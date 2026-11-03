#!/usr/bin/env python3
"""
Flag timeline scenes where character dialogue merely repeats the narration.
Adds 'redundant:true' to scene objects so the frontend can render them in red.

Usage: python3 content/flag_redundant.py
"""
import json, re, os

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')
STOPWORDS = {'the','a','an','is','are','was','were','be','been','being',
             'have','has','had','do','does','did','will','would','could',
             'should','may','might','shall','can','to','of','in','for',
             'on','with','at','by','from','as','into','through','during',
             'before','after','above','below','between','out','off','over',
             'under','again','further','then','once','here','there','when',
             'where','why','how','all','each','every','both','few','more',
             'most','other','some','such','no','nor','not','only','own',
             'same','so','than','too','very','just','because','and','but',
             'or','if','while','that','this','these','those','it','its',
             'he','him','his','she','her','they','them','their','we','us',
             'our','you','your','i','me','my','myself'}

def split_entries(text):
    """Split a JS array string into individual top-level entries.
    Strips the array brackets and any trailing boundary text."""
    inner = text
    prefix = ''
    if inner.startswith('a1=['):
        prefix = 'a1='
        inner = inner[3:]
    elif inner.startswith('F4=['):
        prefix = 'F4='
        inner = inner[3:]

    # Find the array boundaries: outer [ ... ]
    # The array starts at first '[' and ends at matching ']'
    if not inner.startswith('['):
        return []
    bracket_depth = 0
    array_end = -1
    for i, ch in enumerate(inner):
        if ch == '[':
            bracket_depth += 1
        elif ch == ']':
            bracket_depth -= 1
            if bracket_depth == 0:
                array_end = i
                break

    if array_end == -1:
        return []

    # Content inside the array
    content = inner[1:array_end]
    # Suffix after the array closing bracket (e.g. ",a")
    suffix = inner[array_end+1:]

    entries = []
    depth = 0
    current = ''
    for ch in content:
        if ch == '{':
            depth += 1
            current += ch
        elif ch == '}':
            depth -= 1
            current += ch
            if depth == 0 and current.strip():
                entries.append(current.strip())
                current = ''
        elif ch == ',' and depth == 0:
            pass
        else:
            current += ch

    return prefix, entries, suffix

def get_entry_keywords(text):
    """Extract meaningful words from text."""
    words = re.findall(r"\b[a-z']+\b", text.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 2}

def is_redundant(narration, scene_text):
    """Check if scene text merely repeats the narration."""
    n_words = get_entry_keywords(narration)
    s_words = get_entry_keywords(scene_text)
    if not s_words:
        return False
    intersection = n_words & s_words
    containment = len(intersection) / len(s_words)
    jaccard = len(intersection) / len(n_words | s_words) if (n_words | s_words) else 0
    return containment > 0.5 or (containment > 0.35 and jaccard > 0.12)

def flag_redundant_in_string(js_str):
    """Process a JS array string, adding redundant:true to repetitive scenes."""
    prefix, entries, suffix = split_entries(js_str)
    modified = []
    for entry in entries:
        n = re.search(r'narration:"((?:[^"\\]|\\.)*)"', entry)
        t = re.search(r'text:"((?:[^"\\]|\\.)*)"', entry)
        if n and t:
            narration = n.group(1)
            scene_text = t.group(1)
            if is_redundant(narration, scene_text):
                entry = entry.replace(
                    ',position:{x:0,y:0}}]',
                    ',position:{x:0,y:0},redundant:true}]'
                )
        modified.append(entry)
    return prefix + '[' + ','.join(modified) + ']' + suffix

def main():
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)

    a1_src = data['a1']
    f4_src = data['f4']

    a1_count_before = a1_src.count('redundant:true')
    f4_count_before = f4_src.count('redundant:true')

    data['a1'] = flag_redundant_in_string(a1_src)
    data['f4'] = flag_redundant_in_string(f4_src)

    a1_flags = data['a1'].count('redundant:true') - a1_count_before
    f4_flags = data['f4'].count('redundant:true') - f4_count_before

    # Verify structure
    for key in ('a1', 'f4'):
        val = data[key]
        if not val.startswith('a1=[' if key == 'a1' else 'F4=['):
            print(f"WARNING: {key} does not start with correct prefix!")
        bracket_depth = 0
        for i, ch in enumerate(val):
            if ch == '[':
                bracket_depth += 1
            elif ch == ']':
                bracket_depth -= 1
                if bracket_depth == 0:
                    # Check that after this, we have valid suffix
                    break

    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Flagged {a1_flags} redundant scenes in a1 (main timeline)")
    print(f"Flagged {f4_flags} redundant scenes in F4 (cinematic timeline)")
    total = data['a1'].count('year:"')
    print(f"Total timeline entries: {total}")

if __name__ == '__main__':
    main()
