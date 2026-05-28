#!/usr/bin/env python3
"""
spec-verifier.py — Compare a branch's index.html against its SPEC.md goals
                     and return a compliance score.

Usage:
    python3 spec-verifier.py --branch cnei --html-dir /path/to/static/cnei
    python3 spec-verifier.py --branch main --html-dir /path/to/static/main \\
                             --headers-path /custom/path/_headers

Requires: Python 3.6+ (standard library only — no pip dependencies)
"""

import argparse
import json
import os
import re
import sys


# ==============================================================================
# Checker functions
# ==============================================================================

def _check_doctype(html_content):
    """Check for <!DOCTYPE html> declaration."""
    return bool(re.search(r'<!DOCTYPE\s+html', html_content, re.IGNORECASE))


def _check_charset(html_content):
    """Check for charset meta tag."""
    return bool(re.search(r'<meta[^>]*charset\s*=', html_content, re.IGNORECASE))


def _check_viewport(html_content):
    """Check for viewport meta tag."""
    return bool(re.search(
        r'<meta[^>]*name\s*=\s*["\']viewport["\']',
        html_content, re.IGNORECASE,
    ))


def _check_title(html_content):
    """Check for <title> tag."""
    return bool(re.search(r'<title[^>]*>', html_content, re.IGNORECASE))


def _check_lang(html_content):
    """Check for lang= attribute on <html>."""
    return bool(re.search(r'<html[^>]*\blang\s*=', html_content, re.IGNORECASE))


def _check_meta_description(html_content):
    """Check for <meta name="description"> tag."""
    return bool(re.search(
        r'<meta[^>]*name\s*=\s*["\']description["\']',
        html_content, re.IGNORECASE,
    ))


def _check_open_graph(html_content):
    """Check for og:title, og:description, and og:image meta tags."""
    patterns = [
        r'<meta[^>]*property\s*=\s*["\']og:title["\']',
        r'<meta[^>]*property\s*=\s*["\']og:description["\']',
        r'<meta[^>]*property\s*=\s*["\']og:image["\']',
    ]
    return all(
        re.search(p, html_content, re.IGNORECASE) for p in patterns
    )


def _check_canonical(html_content):
    """Check for <link rel="canonical"> tag."""
    return bool(re.search(
        r'<link[^>]*rel\s*=\s*["\']canonical["\']',
        html_content, re.IGNORECASE,
    ))


def _check_privacy_policy(html_dir):
    """Check that a privacy-policy related file exists."""
    candidates = [
        'privacy.html',
        'privacy-policy.html',
        'privacy/index.html',
        'legal/privacy.html',
    ]
    return any(os.path.isfile(os.path.join(html_dir, c)) for c in candidates)


def _check_terms_of_service(html_dir):
    """Check that a terms-of-service related file exists."""
    candidates = [
        'terms.html',
        'terms-of-service.html',
        'terms/index.html',
        'legal/terms.html',
    ]
    return any(os.path.isfile(os.path.join(html_dir, c)) for c in candidates)


def _check_contact(html_content, html_dir):
    """Check for a contact page (contact.html) or contact link/section."""
    if os.path.isfile(os.path.join(html_dir, 'contact.html')):
        return True
    if os.path.isdir(os.path.join(html_dir, 'contact')):
        return True
    # Look for contact links or sections in the HTML
    return bool(re.search(
        r'href\s*=\s*["\'][^"\']*contact',
        html_content, re.IGNORECASE,
    ))


def _check_blog(html_content, html_dir):
    """Check for a blog directory or blog links."""
    if os.path.isdir(os.path.join(html_dir, 'blog')):
        return True
    return bool(re.search(
        r'href\s*=\s*["\'][^"\']*blog',
        html_content, re.IGNORECASE,
    ))


def _check_sitemap(html_content, html_dir):
    """Check for sitemap.xml file or sitemap references."""
    if os.path.isfile(os.path.join(html_dir, 'sitemap.xml')):
        return True
    return bool(re.search(r'sitemap', html_content, re.IGNORECASE))


def _check_robots_txt(html_dir):
    """Check that robots.txt exists."""
    return os.path.isfile(os.path.join(html_dir, 'robots.txt'))


def _check_json_ld(html_content):
    """Check for JSON-LD structured data (application/ld+json)."""
    return bool(re.search(r'application/ld\+json', html_content, re.IGNORECASE))


def _check_favicon(html_content):
    """Check for a favicon link tag."""
    return bool(re.search(
        r'<link[^>]*rel\s*=\s*["\'](?:icon|shortcut\s+icon|apple-touch-icon)["\']',
        html_content, re.IGNORECASE,
    ))


def _check_headers_file(html_dir):
    """Check that a _headers file exists (Cloudflare Pages convention)."""
    return os.path.isfile(os.path.join(html_dir, '_headers'))


def _check_x_frame_options(headers_content):
    """Check for X-Frame-Options directive in _headers."""
    return bool(re.search(r'X-Frame-Options', headers_content, re.IGNORECASE))


def _check_csp(headers_content):
    """Check for Content-Security-Policy directive in _headers."""
    return bool(re.search(
        r'Content-Security-Policy',
        headers_content, re.IGNORECASE,
    ))


def _check_hsts(headers_content):
    """Check for Strict-Transport-Security directive in _headers."""
    return bool(re.search(
        r'Strict-Transport-Security',
        headers_content, re.IGNORECASE,
    ))


def _check_skip_link(html_content):
    """Check for a skip-to-content link or skip-navigation link."""
    return bool(re.search(
        r'skip\s*(?:to\s*)?(?:content|main|nav|navigation)',
        html_content, re.IGNORECASE,
    ))


def _check_focus_visible(html_content):
    """Check for :focus-visible CSS pseudo-class usage."""
    return bool(re.search(r':focus-visible', html_content))


def _check_image_dimensions(html_content):
    """Check that every <img> tag has a width or height attribute."""
    img_tags = re.findall(r'<img[^>]*>', html_content, re.IGNORECASE)
    if not img_tags:
        return True  # No images means nothing to fail
    for img in img_tags:
        if not re.search(r'\b(?:width|height)\s*=', img, re.IGNORECASE):
            return False
    return True


# ==============================================================================
# Goal / checker registry
# ==============================================================================
#
# Each entry: (keywords, checker_func, arg_type, description)
#   arg_type:
#     'html'    → checker(html_content)
#     'dir'     → checker(html_dir)
#     'both'    → checker(html_content, html_dir)
#     'headers' → checker(headers_content)

GOAL_CHECKERS = [
    (['doctype', '!doctype', 'document type'],
     _check_doctype, 'html', '<!DOCTYPE html>'),
    (['charset', 'character set', 'encoding'],
     _check_charset, 'html', 'charset'),
    (['viewport', 'responsive meta'],
     _check_viewport, 'html', 'viewport'),
    (['page title', '<title>', 'title tag'],
     _check_title, 'html', 'page title'),
    (['lang attribute', 'html lang', 'language attribute'],
     _check_lang, 'html', 'lang'),
    (['meta description', 'description meta'],
     _check_meta_description, 'html', 'meta description'),
    (['open graph', 'og:', 'og meta', 'og tags'],
     _check_open_graph, 'html', 'Open Graph'),
    (['canonical', 'canonical url', 'canonical link'],
     _check_canonical, 'html', 'canonical'),
    (['privacy policy', 'privacy page', 'privacy'],
     _check_privacy_policy, 'dir', 'privacy policy'),
    (['terms of service', 'terms page', 'terms'],
     _check_terms_of_service, 'dir', 'terms of service'),
    (['contact page', 'contact form', 'contact section'],
     _check_contact, 'both', 'contact page'),
    (['blog', 'blog section', 'blog page'],
     _check_blog, 'both', 'blog'),
    (['sitemap', 'sitemap.xml', 'site map'],
     _check_sitemap, 'both', 'sitemap'),
    (['robots.txt', 'robots file'],
     _check_robots_txt, 'dir', 'robots.txt'),
    (['json-ld', 'jsonld', 'structured data', 'ld+json'],
     _check_json_ld, 'html', 'JSON-LD'),
    (['favicon', 'shortcut icon', 'apple-touch-icon'],
     _check_favicon, 'html', 'favicon'),
    (['_headers', 'headers file', 'cloudflare headers'],
     _check_headers_file, 'dir', '_headers'),
    (['x-frame-options', 'frame options', 'clickjack', 'clickjacking'],
     _check_x_frame_options, 'headers', 'X-Frame-Options'),
    (['csp', 'content-security-policy'],
     _check_csp, 'headers', 'CSP'),
    (['hsts', 'strict-transport-security'],
     _check_hsts, 'headers', 'HSTS'),
    (['skip link', 'skip to content', 'skip navigation', 'skip-to'],
     _check_skip_link, 'html', 'skip link'),
    (['focus-visible', ':focus-visible', 'focus visible'],
     _check_focus_visible, 'html', 'focus-visible'),
    (['image dimensions', 'img dimensions', 'width and height',
      'image size', 'img size'],
     _check_image_dimensions, 'html', 'image dimensions'),
]


# ==============================================================================
# SPEC.md parsing
# ==============================================================================

def _parse_frontmatter_line(line):
    """Parse a single YAML-like frontmatter line into a key-value pair."""
    line = line.strip()
    if not line or line.startswith('#'):
        return None
    if ':' in line:
        key, _, value = line.partition(':')
        key = key.strip()
        value = value.strip()
        # Strip surrounding quotes from value
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        return key, value
    return None


def parse_spec(spec_path):
    """Parse SPEC.md and return (frontmatter_dict, list_of_goal_strings).

    Frontmatter is the YAML block between leading ``---`` markers.
    Goals are markdown checklist items of the form ``- [ ] description``.
    """
    with open(spec_path, 'r', encoding='utf-8') as f:
        content = f.read()

    frontmatter = {}
    body = content

    # Extract YAML frontmatter between --- markers (only at the very start)
    if content.startswith('---'):
        parts = content.split('---', 2)
        if len(parts) >= 3:
            yaml_text = parts[1]
            body = parts[2]
            for line in yaml_text.split('\n'):
                kv = _parse_frontmatter_line(line)
                if kv:
                    frontmatter[kv[0]] = kv[1]

    # Extract unchecked goals: lines matching list marker followed by [ ]
    goal_pattern = re.compile(
        r'^[\s]*[-*\d+.]\s+\[\s*\]\s+(.*)',
        re.MULTILINE,
    )
    goals = []
    for match in goal_pattern.finditer(body):
        raw_text = match.group(1).strip()
        # Strip common markdown formatting for a cleaner label
        clean = re.sub(r'\*\*(.+?)\*\*', r'\1', raw_text)
        clean = re.sub(r'\*(.+?)\*', r'\1', clean)
        clean = re.sub(r'`(.+?)`', r'\1', clean)
        clean = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', clean)  # [text](url) → text
        goals.append(clean)

    return frontmatter, goals


# ==============================================================================
# Checker dispatch
# ==============================================================================

def _match_checker(goal_text):
    """Return the best-matching (checker_func, arg_type, description) for a
    goal text, or ``None`` if no checker matches."""
    goal_lower = goal_text.lower()
    best = None
    best_score = 0

    for keywords, func, arg_type, description in GOAL_CHECKERS:
        score = 0
        for kw in keywords:
            if kw.lower() in goal_lower:
                score += len(kw.split())  # favour multi-word keywords
        if score > best_score:
            best_score = score
            best = (func, arg_type, description)

    return best


def _run_check(func, arg_type, html_content, html_dir, headers_content):
    """Dispatch a checker function with the right arguments."""
    if arg_type == 'html':
        return func(html_content)
    elif arg_type == 'dir':
        return func(html_dir)
    elif arg_type == 'both':
        return func(html_content, html_dir)
    elif arg_type == 'headers':
        if headers_content is None:
            return False
        return func(headers_content)
    return False


def _build_summary(branch, score, total, met, goal_details, unmet_goals):
    """Build a human-readable markdown summary suitable for release notes."""
    if total == 0:
        return (
            f"## Compliance: N/A\n\n"
            f"The **{branch}** branch has no specification goals defined in "
            f"SPEC.md."
        )

    lines = [
        f"## Compliance: {score}% ({met}/{total})",
        "",
        f"The **{branch}** branch achieves **{met}** of **{total}** "
        f"specification goals (**{score}%**).",
        "",
    ]

    # Met goals
    met_items = [gd for gd in goal_details if gd['status'] == 'met']
    if met_items:
        lines.append("### Met")
        for gd in met_items:
            lines.append(f"- {gd['goal']}")
        lines.append("")

    # Unmet goals
    if unmet_goals:
        lines.append("### Unmet")
        for g in unmet_goals:
            lines.append(f"- {g}")
        lines.append("")

    return "\n".join(lines)


# ==============================================================================
# Main
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Compare a branch's index.html against its SPEC.md goals "
                    "and return a compliance score.",
    )
    parser.add_argument(
        '--branch', required=True,
        help='Branch name (e.g. cnei, main)',
    )
    parser.add_argument(
        '--html-dir', required=True,
        help='Path to the static HTML directory for this branch',
    )
    parser.add_argument(
        '--headers-path',
        help='Path to _headers file (defaults to html-dir/_headers)',
    )
    args = parser.parse_args()

    html_dir = args.html_dir

    # ------------------------------------------------------------------
    # Validate paths
    # ------------------------------------------------------------------
    if not os.path.isdir(html_dir):
        result = {'error': f'HTML directory not found: {html_dir}'}
        print(json.dumps(result, indent=2))
        sys.exit(1)

    index_html_path = os.path.join(html_dir, 'index.html')
    if not os.path.isfile(index_html_path):
        result = {'error': f'index.html not found in {html_dir}'}
        print(json.dumps(result, indent=2))
        sys.exit(1)

    # SPEC.md may live directly in html_dir or one level up
    spec_path = os.path.join(html_dir, 'SPEC.md')
    if not os.path.isfile(spec_path):
        parent = os.path.normpath(os.path.join(html_dir, '..'))
        parent_spec = os.path.join(parent, 'SPEC.md')
        if os.path.isfile(parent_spec):
            spec_path = parent_spec
        else:
            result = {
                'error': 'SPEC.md not found. '
                         f'Checked: {spec_path} and {parent_spec}',
            }
            print(json.dumps(result, indent=2))
            sys.exit(1)

    # ------------------------------------------------------------------
    # Read inputs
    # ------------------------------------------------------------------
    with open(index_html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    headers_path = args.headers_path or os.path.join(html_dir, '_headers')
    headers_content = None
    if os.path.isfile(headers_path):
        with open(headers_path, 'r', encoding='utf-8') as f:
            headers_content = f.read()

    frontmatter, goals = parse_spec(spec_path)

    # ------------------------------------------------------------------
    # No goals → early exit
    # ------------------------------------------------------------------
    if not goals:
        report = {
            'branch': args.branch,
            'score': 0,
            'total_goals': 0,
            'met_goals': 0,
            'unmet_goals': [],
            'goal_details': [],
            'summary': _build_summary(args.branch, 0, 0, 0, [], []),
        }
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return

    # ------------------------------------------------------------------
    # Evaluate each goal
    # ------------------------------------------------------------------
    total_goals = len(goals)
    met_goals = 0
    unmet_goals = []
    goal_details = []

    for goal_text in goals:
        match = _match_checker(goal_text)
        if match:
            func, arg_type, description = match
            met = _run_check(func, arg_type, html_content, html_dir,
                             headers_content)
        else:
            met = False
            description = 'unknown — no checker matched this goal text'

        if met:
            met_goals += 1
            status = 'met'
        else:
            unmet_goals.append(goal_text)
            status = 'unmet'

        goal_details.append({
            'goal': goal_text,
            'status': status,
            'check': description,
        })

    # Weighted score (0–100)
    score = round((met_goals / total_goals) * 100)

    summary = _build_summary(
        args.branch, score, total_goals, met_goals,
        goal_details, unmet_goals,
    )

    report = {
        'branch': args.branch,
        'score': score,
        'total_goals': total_goals,
        'met_goals': met_goals,
        'unmet_goals': unmet_goals,
        'goal_details': goal_details,
        'summary': summary,
    }

    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
