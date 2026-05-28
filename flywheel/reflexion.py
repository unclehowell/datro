"""
reflexion.py — MEMORY.md Manager for the Reflexion Pattern

Implements the Reflexion pattern (Shinn et al. NeurIPS 2023):
agents verbally reflect on task feedback, maintain reflective text
in episodic memory, and use it for better decisions in subsequent trials.

Functions
---------
read_memory(branch_dir)          Parse MEMORY.md into structured entries.
write_entry(branch_dir, ...)     Append a new cycle entry to MEMORY.md.
get_recent_lessons(branch_dir)   Return last N lessons as prompt context.
get_reflection_context(...)      Return a summarised reflection string.
summarize_failures(branch_dir)   Aggregate only FAIL entries for pattern
                                 analysis.
prune_old_entries(branch_dir)    Keep the most recent K entries; archive
                                 older ones in MEMORY_ARCHIVE.md.
"""

from __future__ import annotations

import collections
import datetime
import os
import re
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MEMORY_FILENAME = "MEMORY.md"
ARCHIVE_FILENAME = "MEMORY_ARCHIVE.md"

# Regex that matches a cycle heading, e.g. "## Cycle 42"
_CYCLE_HEADING_RE = re.compile(r"^##\s+Cycle\s+(\d+)\s*$", re.MULTILINE)
# Regex for the task subheading: "### branch_name: task description"
_TASK_HEADING_RE = re.compile(r"^###\s+(.+?)\s*:\s*(.+)$")
# Regex for verdict line: "**Verdict:** PASS | ..." or "**Verdict:** FAIL | ..."
_VERDICT_RE = re.compile(r"^\*\*Verdict:\*\*\s*(PASS|FAIL)\s*(?:\|\s*(.*))?$", re.IGNORECASE)
# Regex for key-value metadata lines like "**Key:** value"
_METADATA_RE = re.compile(r"^\*\*(.+?):\*\*\s*(.*)$")
# Regex for lesson subheading
_LESSON_HEADING_RE = re.compile(r"^###\s+Lesson\s*$")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _memory_path(branch_dir: str) -> str:
    """Return the full path to the MEMORY.md file inside *branch_dir*."""
    return os.path.join(branch_dir, MEMORY_FILENAME)


def _archive_path(branch_dir: str) -> str:
    """Return the full path to the MEMORY_ARCHIVE.md file."""
    return os.path.join(branch_dir, ARCHIVE_FILENAME)


def _ensure_dir(path: str) -> None:
    """Create parent directories of *path* if they do not exist."""
    parent = os.path.dirname(path)
    if parent:
        os.makedirs(parent, exist_ok=True)


def _read_text(filepath: str) -> str:
    """Read the entire text of *filepath*; return empty string if missing."""
    try:
        with open(filepath, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return ""


def _write_text(filepath: str, text: str) -> None:
    """Write *text* to *filepath*, creating parent directories if needed."""
    _ensure_dir(filepath)
    with open(filepath, "w", encoding="utf-8") as fh:
        fh.write(text)


def _append_text(filepath: str, text: str) -> None:
    """Append *text* to *filepath*, creating the file if it does not exist."""
    _ensure_dir(filepath)
    with open(filepath, "a", encoding="utf-8") as fh:
        fh.write(text)


# ---------------------------------------------------------------------------
# YAML frontmatter (manual, no PyYAML)
# ---------------------------------------------------------------------------

def _parse_frontmatter(text: str) -> Tuple[Dict[str, Any], str]:
    """Parse YAML frontmatter from *text*, returning ``(metadata, body)``.

    Frontmatter is expected between a leading ``---`` and the next ``---``.
    If no valid frontmatter is found the entire text is treated as body and an
    empty dict is returned.
    """
    lines = text.splitlines(keepends=False)
    if not lines or lines[0].strip() != "---":
        return {}, text

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        # Opening marker but no closing marker — treat as no frontmatter.
        return {}, text

    raw_yaml = "\n".join(lines[1:end_idx])
    metadata = _parse_simple_yaml(raw_yaml)
    body = "\n".join(lines[end_idx + 1:])
    return metadata, body


def _parse_simple_yaml(raw: str) -> Dict[str, Any]:
    """Parse a minimal subset of YAML key-value pairs.

    Supports:
      - ``key: value`` (strings only)
      - ``key: "quoted value"``
      - ``# comments``
    Nested structures or lists are **not** supported.
    """
    result: Dict[str, Any] = {}
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" not in stripped:
            continue
        key, _, value = stripped.partition(":")
        key = key.strip()
        value = value.strip().strip("\"'")
        if key:
            result[key] = value
    return result


# ---------------------------------------------------------------------------
# Cycle-entry parsing
# ---------------------------------------------------------------------------

def _parse_cycle_entries(body: str) -> List[Dict[str, Any]]:
    """Extract structured cycle entries from the markdown *body*.

    Returns a list of dicts sorted from **most recent** to oldest (the order
    they appear in the file — entries are appended newest-last, so we reverse
    on return).
    """
    # Split on "## Cycle NNN" headings.  We use re.split which captures the
    # delimiter so we can recover the cycle number.
    parts = _CYCLE_HEADING_RE.split(body)
    # parts[0] is everything before the first heading (frontmatter / preamble).
    # Then pattern: parts[1] = "42", parts[2] = content of that section, etc.
    entries: List[Dict[str, Any]] = []
    # Pre-compile a regex for the cycle heading (to get the number)
    for i in range(1, len(parts), 2):
        cycle_str = parts[i].strip()
        content = parts[i + 1] if i + 1 < len(parts) else ""
        try:
            cycle_number = int(cycle_str)
        except ValueError:
            continue
        entry = _parse_single_entry(cycle_number, content)
        if entry is not None:
            entries.append(entry)

    # Most recent last in file → reverse so most recent first.
    entries.reverse()
    return entries


def _parse_single_entry(cycle_number: int, content: str) -> Optional[Dict[str, Any]]:
    """Parse the content block of a single cycle.

    Returns a dict with keys::

        cycle_number, task_description, verdict, verdict_detail, lesson,
        metadata (dict), branch
    """
    lines = content.splitlines(keepends=False)
    # State machine
    state = "task"  # task -> verdict -> metadata -> lesson -> done
    entry: Dict[str, Any] = {
        "cycle_number": cycle_number,
        "task_description": "",
        "verdict": None,      # "PASS" or "FAIL"
        "verdict_detail": "",
        "lesson": "",
        "metadata": {},
        "branch": "",
    }
    lesson_lines: List[str] = []
    in_lesson = False

    for line in lines:
        # ---- task heading ----
        if state in ("task", "verdict", "metadata"):
            m = _TASK_HEADING_RE.match(line)
            if m:
                entry["branch"] = m.group(1).strip()
                entry["task_description"] = m.group(2).strip()
                if entry["verdict"] is not None:
                    state = "done"
                    break
                continue

        # ---- verdict ----
        if state in ("task", "verdict"):
            m = _VERDICT_RE.match(line)
            if m:
                entry["verdict"] = m.group(1).upper()
                entry["verdict_detail"] = (m.group(2) or "").strip()
                state = "verdict"
                continue

        # ---- metadata lines (only between verdict and lesson heading) ----
        if state == "verdict":
            # Check for lesson heading to transition
            if _LESSON_HEADING_RE.match(line):
                state = "lesson"
                in_lesson = True
                continue
            m = _METADATA_RE.match(line)
            if m:
                entry["metadata"][m.group(1).strip()] = m.group(2).strip()
                continue
            # Blank lines are ignored
            if line.strip() == "":
                continue
            # If we hit something else, treat it as lesson if it looks like
            # text, or just skip.
            state = "lesson"
            in_lesson = True
            lesson_lines.append(line)
            continue

        # ---- lesson body ----
        if state == "lesson" or in_lesson:
            if _TASK_HEADING_RE.match(line) or _CYCLE_HEADING_RE.match(line):
                # Should not happen within a single entry, but safety.
                break
            if line.strip() == "" and not lesson_lines:
                continue  # skip leading blank lines inside lesson
            lesson_lines.append(line)

    entry["lesson"] = "\n".join(lesson_lines).strip()

    # Basic validation
    if entry["verdict"] is None:
        return None  # incomplete entry
    return entry


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def read_memory(branch_dir: str) -> List[Dict[str, Any]]:
    """Read ``MEMORY.md`` from *branch_dir* and return structured entries.

    Parses YAML frontmatter (validates the ``branch`` key matches the
    directory basename, warns via log but does not raise), then extracts every
    ``## Cycle NNN`` section.

    Returns
    -------
    list[dict]
        Each dict has keys ``cycle_number``, ``task_description``,
        ``verdict`` (``"PASS"`` or ``"FAIL"``), ``verdict_detail``,
        ``lesson``, ``metadata`` (dict), and ``branch``.
        Most recent entry first.
    """
    text = _read_text(_memory_path(branch_dir))
    if not text:
        return []

    metadata, body = _parse_frontmatter(text)
    entries = _parse_cycle_entries(body)

    # Optional: validate branch name from frontmatter.
    expected_branch = os.path.basename(os.path.normpath(branch_dir))
    fm_branch = metadata.get("branch", "")
    if fm_branch and fm_branch != expected_branch:
        import warnings
        warnings.warn(
            f"Frontmatter branch {fm_branch!r} does not match directory "
            f"{expected_branch!r}",
            UserWarning,
            stacklevel=2,
        )
    return entries


def write_entry(
    branch_dir: str,
    cycle_num: int,
    task: str,
    verdict: str,
    lesson: str,
    metadata: Optional[Dict[str, str]] = None,
) -> None:
    """Append a new cycle entry to ``MEMORY.md``.

    Parameters
    ----------
    branch_dir:
        Directory containing (or to contain) ``MEMORY.md``.
    cycle_num:
        Cycle number (integer).
    task:
        Short task description.
    verdict:
        ``"PASS"`` or ``"FAIL"``.  May include a detail string after a pipe,
        e.g. ``"PASS | Score: 92"`` — the detail will be placed inline.
    lesson:
        Free-form lesson text.
    metadata:
        Optional dict of ``**Key:** value`` lines to insert between verdict
        and lesson (e.g. timestamp, reference URLs).
    """
    # Normalise verdict — allow "PASS | detail" or "FAIL | detail"
    verdict_clean = verdict
    verdict_detail = ""
    if "|" in verdict:
        parts = verdict.split("|", 1)
        verdict_clean = parts[0].strip().upper()
        verdict_detail = parts[1].strip()
    else:
        verdict_clean = verdict.strip().upper()

    md_path = _memory_path(branch_dir)
    text = _read_text(md_path)

    # Create file with header if it does not exist.
    if not text.strip():
        branch_name = os.path.basename(os.path.normpath(branch_dir))
        header = (
            f"---\n"
            f"branch: {branch_name}\n"
            f"---\n"
            f"\n"
            f"# MEMORY — {branch_name}\n"
            f"\n"
        )
        _write_text(md_path, header)

    # Build the entry block.
    verdict_line = f"**Verdict:** {verdict_clean}"
    if verdict_detail:
        verdict_line += f" | {verdict_detail}"

    meta_lines = []
    if metadata:
        for k, v in metadata.items():
            meta_lines.append(f"**{k}:** {v}")

    branch_name = os.path.basename(os.path.normpath(branch_dir))
    entry_parts = [
        "",
        f"## Cycle {cycle_num}",
        f"### {branch_name}: {task}",
        verdict_line,
    ]
    entry_parts.extend(meta_lines)
    entry_parts.append("### Lesson")
    entry_parts.append(lesson)
    entry = "\n".join(entry_parts)

    _append_text(md_path, entry)


def get_recent_lessons(branch_dir: str, count: int = 20) -> str:
    """Return the last *count* lessons as formatted prompt context.

    The output is a markdown block that can be injected into an AI prompt::

        ## Recent Lessons from {branch}
        - {lesson 1}
        - {lesson 2}
        ...
    """
    entries = read_memory(branch_dir)
    selected = entries[:count]
    if not selected:
        return ""

    branch_name = os.path.basename(os.path.normpath(branch_dir))
    lines = [f"## Recent Lessons from {branch_name}"]
    for e in reversed(selected):  # oldest-first is more natural in context
        lesson = e["lesson"].replace("\n", " ").strip()
        if not lesson:
            lesson = "(no lesson recorded)"
        lines.append(f"- {lesson}")
    return "\n".join(lines)


def get_reflection_context(branch_dir: str, max_entries: int = 5) -> str:
    """Return a summarised reflection string for the "Reflect" phase.

    Selects up to *max_entries* of the most important (diverse) lessons by
    de-duplicating near-duplicate text and keeping the most recent distinct
    lessons.  The output is a natural-language paragraph suitable for
    injecting into an AI prompt as reflective context.
    """
    entries = read_memory(branch_dir)
    if not entries:
        return ""

    # Build a list of (lesson, verdict, cycle) tuples, most-recent-first.
    candidates = [
        (e["lesson"].strip(), e["verdict"], e["cycle_number"])
        for e in entries
        if e["lesson"].strip()
    ]

    if not candidates:
        return ""

    branch_name = os.path.basename(os.path.normpath(branch_dir))

    # --- simple diversity filter ---
    # Tokenise each lesson into a set of words (lower-cased).
    # Group by verdict first, then within each group greedily keep lessons
    # whose Jaccard similarity with any already-kept lesson is below 0.7.
    def _token_set(text: str) -> set:
        return set(re.findall(r"[a-z0-9]+", text.lower()))

    def _jaccard(a: set, b: set) -> float:
        if not a or not b:
            return 0.0
        return len(a & b) / len(a | b)

    # Interleave PASS / FAIL to keep balance.
    pass_lessons = [(l, v, c) for l, v, c in candidates if v == "PASS"]
    fail_lessons = [(l, v, c) for l, v, c in candidates if v == "FAIL"]

    def _diverse_subset(
        pool: List[Tuple[str, str, int]], limit: int
    ) -> List[Tuple[str, str, int]]:
        kept: List[Tuple[str, str, int]] = []
        for item in pool:
            tok = _token_set(item[0])
            if any(_jaccard(tok, _token_set(k[0])) > 0.7 for k in kept):
                continue
            kept.append(item)
            if len(kept) >= limit:
                break
        return kept

    chosen: List[Tuple[str, str, int]] = []
    half = (max_entries + 1) // 2
    chosen.extend(_diverse_subset(fail_lessons, half))
    chosen.extend(_diverse_subset(pass_lessons, max_entries - len(chosen)))
    # Re-sort by cycle number descending (most recent first).
    chosen.sort(key=lambda x: x[2], reverse=True)

    # Build the reflection paragraph.
    fragments: List[str] = []
    for lesson, verdict, cycle in chosen:
        # Truncate very long lessons.
        if len(lesson) > 300:
            lesson = lesson[:297] + "..."
        fragments.append(
            f"- [Cycle {cycle} / {verdict}] {lesson}"
        )

    header = (
        f"## Reflection Context for {branch_name}\n"
        f"The following lessons were learned in recent cycles "
        f"(similar entries consolidated):"
    )
    return header + "\n" + "\n".join(fragments)


def summarize_failures(branch_dir: str) -> str:
    """Return a summary of all FAIL entries.

    Analyses the failure lessons for recurring patterns (by shared keywords)
    and produces a concise block::

        The following approaches have previously failed:

        - {lesson or pattern} ...

    If no failures exist, returns an empty string.
    """
    entries = read_memory(branch_dir)
    fails = [e for e in entries if e["verdict"] == "FAIL"]
    if not fails:
        return ""

    lessons = [e["lesson"].strip() for e in fails if e["lesson"].strip()]
    if not lessons:
        return ""

    # --- simple keyword-based pattern detection ---
    # Count bigram frequency across all failure lessons.
    bigram_counts: Dict[str, int] = collections.Counter()
    for lesson in lessons:
        tokens = re.findall(r"[a-z0-9]+", lesson.lower())
        for j in range(len(tokens) - 1):
            bigram = f"{tokens[j]} {tokens[j + 1]}"
            bigram_counts[bigram] += 1

    # Find the most common bigrams that appear in at least 2 lessons.
    common_patterns = [bg for bg, cnt in bigram_counts.items() if cnt >= 2]
    common_patterns.sort(key=lambda bg: (-bigram_counts[bg], bg))
    top_patterns = common_patterns[:5]

    # Build a summary that pairs each pattern with an example lesson.
    pattern_examples: List[str] = []
    for pattern in top_patterns:
        for lesson in lessons:
            if pattern in lesson.lower():
                # Show first 120 characters of the lesson as an example.
                snippet = lesson[:120]
                if len(lesson) > 120:
                    snippet += "..."
                pattern_examples.append(
                    f"- Pattern \"{pattern}\" → e.g. \"{snippet}\""
                )
                break

    lines = ["The following approaches have previously failed:"]
    if pattern_examples:
        lines.extend(pattern_examples)
    else:
        # No common patterns; just list the distinct lessons.
        seen: set = set()
        for lesson in lessons:
            # Normalise whitespace for dedup.
            norm = lesson.replace("\n", " ").strip()
            if norm not in seen:
                seen.add(norm)
                if len(norm) > 200:
                    norm = norm[:197] + "..."
                lines.append(f"- {norm}")

    lines.append(
        f"\n({len(fails)} total failure entr{'y' if len(fails)==1 else 'ies'})"
    )
    return "\n".join(lines)


def prune_old_entries(branch_dir: str, keep: int = 50) -> None:
    """Keep only the most recent *keep* entries in ``MEMORY.md``.

    Older entries are moved to ``MEMORY_ARCHIVE.md`` (created if needed;
    entries are appended with a section header per batch).  The frontmatter
    and the first ``## Cycle`` heading and beyond are pruned.
    """
    md_path = _memory_path(branch_dir)
    text = _read_text(md_path)
    if not text.strip():
        return

    # Strip frontmatter and preamble to get raw body.
    metadata, body = _parse_frontmatter(text)

    # Re-parse entries so we can count them.
    entries = _parse_cycle_entries(body)
    if len(entries) <= keep:
        return  # nothing to prune

    # Determine which entries to archive (oldest N).
    # entries is most-recent-first; reverse to get chronological.
    entries_chrono = list(reversed(entries))  # oldest first
    to_archive = entries_chrono[: len(entries_chrono) - keep]
    to_keep = entries_chrono[len(entries_chrono) - keep:]

    # Build the archival block.
    archive_path_ = _archive_path(branch_dir)
    branch_name = os.path.basename(os.path.normpath(branch_dir))
    archive_block_parts: List[str] = [
        f"# Archived entries from {branch_name}",
        f"**(pruned on {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')})**",
        "",
    ]
    for e in to_archive:
        entry_text = _reconstruct_entry(e)
        if entry_text:
            archive_block_parts.append(entry_text)

    archive_block = "\n".join(archive_block_parts)

    # Append to archive.
    archive_exists = os.path.isfile(archive_path_)
    if archive_exists:
        # Add a separator and then the new block.
        _append_text(
            archive_path_,
            f"\n\n---\n\n{archive_block}\n",
        )
    else:
        _write_text(archive_path_, archive_block + "\n")

    # Rebuild MEMORY.md with only kept entries.
    # Preserve original frontmatter + preamble up to the first cycle heading.
    preamble_lines: List[str] = []
    found_first_cycle = False
    for line in text.splitlines(keepends=False):
        if _CYCLE_HEADING_RE.match(line):
            found_first_cycle = True
            break
        if not found_first_cycle:
            preamble_lines.append(line)

    # If there's no frontmatter block, create a minimal one.
    preamble = "\n".join(preamble_lines).strip()
    if not preamble:
        preamble = f"---\nbranch: {branch_name}\n---\n\n# MEMORY — {branch_name}"

    kept_text = preamble + "\n\n"
    for e in reversed(to_keep):  # most recent first in file
        kept_text += _reconstruct_entry(e) + "\n"

    _write_text(md_path, kept_text.strip() + "\n")


def _reconstruct_entry(entry: Dict[str, Any]) -> str:
    """Reconstruct the markdown for a single cycle entry (no trailing blank)."""
    parts = [
        f"## Cycle {entry['cycle_number']}",
        f"### {entry.get('branch', '?')}: {entry['task_description']}",
    ]

    verdict_line = f"**Verdict:** {entry['verdict']}"
    if entry.get("verdict_detail"):
        verdict_line += f" | {entry['verdict_detail']}"
    parts.append(verdict_line)

    meta = entry.get("metadata", {}) or {}
    if meta:
        for k, v in meta.items():
            parts.append(f"**{k}:** {v}")

    parts.append("### Lesson")
    parts.append(entry.get("lesson", "").strip())
    return "\n".join(parts)
