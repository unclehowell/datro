"""Institution tags for every scene of the Tŷ Mawr story.

Reads src/data/story.json (written by content/graph/build_graph.py) and writes
  src/data/institutions.json   used by the player's "Screen by institution" filter
  api/institutions.json        the same, for readers and agents

A scene is tagged with an institution only when the scene's own words name it:
its title, place, narration, received account (and its quoted wording) and
"what we now know". Evidence titles, picture credits and correspondence replies
are not read, so a scene is not tagged just because it cites a wiki page or a
judgment. A few scenes say only "the council"; where the scene itself makes
clear which council it is, the tag is set by hand in BY_HAND with the reason.

Filter links: https://bpvsbuckler.bucklerfamily.estate/?institution=<slug>
(add &view=storyboard for the storyboard). Run from static/bpvsbuckler:
  python3 content/institutions.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://bpvsbuckler.bucklerfamily.estate"

# slug, display name, patterns (regular expressions, case-sensitive unless (?i))
INSTITUTIONS = [
    ("cadw", "Cadw", [r"\bCadw\b"]),
    ("welsh-government", "Welsh Government (incl. Welsh Office)", [
        r"\bWelsh Government\b", r"\bWelsh Office\b", r"\bWelsh Assembly\b", r"\bWelsh Ministers?\b",
        r"\bSecretary of State for Wales\b", r"\bATISN\b"]),
    ("hmlr", "HM Land Registry", [r"\bLand Registry\b", r"\bHMLR\b", r"\bIndependent Complaints Reviewer\b"]),
    ("vale-council", "Vale of Glamorgan Council", [
        r"\bVale of Glamorgan (?:Council|Borough|councillors?|planning)\b", r"\bVale Council\b", r"\bVale planning\b"]),
    ("cardiff-council", "Cardiff Council", [
        r"\bCardiff (?:City )?Council\b", r"\bCity of Cardiff\b", r"\bCardiff Corporation\b", r"\bCardiff County Borough\b"]),
    ("south-glamorgan", "South Glamorgan County Council", [r"\bSouth Glamorgan\b"]),
    ("bp", "BP Properties / BP / Western Ground Rents", [
        r"\bBP\b", r"\bWestern Ground Rents\b", r"\bWGR\b", r"\bBritish Petroleum\b"]),
    ("courts", "The courts (High Court, Court of Appeal, HMCTS)", [
        r"\bCourt of Appeal\b", r"\bHigh Court\b", r"\bHMCTS\b", r"(?i)\bcounty court\b", r"\bHouse of Lords\b",
        r"\bLord Justice\b", r"\bLord Chancellor\b", r"(?i)\bmagistrates\b", r"\bjudges?\b", r"(?i)\bpossession order\b",
        r"^Court$"]),
    ("south-wales-police", "South Wales Police", [r"(?i)\bpolice\b", r"(?i)\bconstabulary\b"]),
    ("mod", "Ministry of Defence", [r"\bMinistry of Defence\b", r"\bMoD\b", r"\bMOD\b", r"\bWar Office\b"]),
    ("ico", "Information Commissioner's Office", [r"\bInformation Commissioner\b", r"\bICO\b"]),
    ("national-archives", "The National Archives", [r"\bNational Archives\b", r"\bTNA\b", r"\bPublic Record Office\b"]),
    ("nrw", "Natural Resources Wales / Forestry", [r"\bNatural Resources Wales\b", r"\bNRW\b", r"\bForestry Commission\b"]),
    ("forest-of-cardiff", "Forest of Cardiff", [r"\bForest of Cardiff\b", r"\bForest Cardiff\b"]),
    ("land-authority-wales", "Land Authority for Wales", [r"\bLand Authority for Wales\b", r"\bLAW\b"]),
    ("glamorgan-archives", "Glamorgan Archives", [r"\bGlamorgan Archives\b", r"\bGlamorgan Record Office\b"]),
    ("llandough-community-council", "Llandough Community Council", [
        r"\bLlandough Community Council\b", r"(?i)\bcommunity council\b"]),
    # Added because the scenes themselves turn on these bodies.
    ("heneb", "Heneb (formerly GGAT)", [
        r"\bGGAT\b", r"\bHeneb\b", r"\bGlamorgan-Gwent Archaeological Trust\b", r"\bHistoric Environment Record\b",
        r"\bArchwilio\b"]),
    ("rcahmw", "Royal Commission (RCAHMW)", [r"\bRoyal Commission\b", r"\bRCAHMW\b"]),
    ("museum-wales", "Museum Wales", [r"\bMuseum Wales\b", r"\bNational Museum\b"]),
    ("glamorgan-county-council", "Glamorgan County Council", [r"\bGlamorgan County Council\b"]),
    ("echr", "European Commission of Human Rights", [
        r"\bEuropean Commission of Human Rights\b", r"\bEuropean Court of Human Rights\b", r"\bStrasbourg\b"]),
]

# Scenes that say only "the council", where the scene shows which council it is.
BY_HAND = {
    # The 1990 evaluation is the condition on the Vale's outline permission 89/01396/OUT.
    "vale-council": ["ghf-19900801-1", "ghf-19920727-1", "ghf-19931203-1"],
}


def scene_text(s):
    parts = [s.get("title"), s.get("narration"), s.get("received"), s.get("known")]
    if isinstance(s.get("case"), str):
        parts.append(s["case"])
    for w in s.get("received_words") or []:
        if isinstance(w, (list, tuple)) and w:
            parts.append(str(w[0]))
    return "\n".join(p for p in parts if p)


def tags_for(s, compiled):
    text = scene_text(s)
    place = s.get("place") or ""
    out = []
    for slug, _name, pats in compiled:
        if any(p.search(text) or p.search(place) for p in pats):
            out.append(slug)
    for slug, ids in BY_HAND.items():
        if s["id"] in ids and slug not in out:
            out.append(slug)
    order = [slug for slug, _n, _p in INSTITUTIONS]
    return sorted(out, key=order.index)


def main():
    story = json.load(open(os.path.join(ROOT, "src/data/story.json"), encoding="utf-8"))
    compiled = [(slug, name, [re.compile(p, re.M) for p in pats]) for slug, name, pats in INSTITUTIONS]
    known = {s["id"] for s in story["scenes"]}
    for slug, ids in BY_HAND.items():
        for i in ids:
            if i not in known:
                print(f"institutions: hand tag {slug} names scene {i}, which is no longer in the story")
    scenes = {}
    for s in story["scenes"]:
        t = tags_for(s, compiled)
        if t:
            scenes[s["id"]] = t
    counts = {slug: 0 for slug, _n, _p in INSTITUTIONS}
    for t in scenes.values():
        for slug in t:
            counts[slug] += 1
    data = {
        "url_pattern": SITE + "/?institution={slug}",
        "rule": "A scene is tagged with an institution when the scene's own words (title, place, narration, "
                "received account, what we now know) name it. Untagged when unclear.",
        "institutions": [
            {"slug": slug, "name": name, "slide_count": counts[slug],
             "url": f"{SITE}/?institution={slug}"} for slug, name, _p in INSTITUTIONS],
        "scenes": scenes,
    }
    body = json.dumps(data, ensure_ascii=False, indent=1) + "\n"
    for rel in ("src/data/institutions.json", "api/institutions.json"):
        path = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "w", encoding="utf-8").write(body)
    print("institutions: " + ", ".join(f"{k} {v}" for k, v in counts.items()))
    print(f"institutions: {len(scenes)} of {len(story['scenes'])} scenes tagged")


if __name__ == "__main__":
    main()
