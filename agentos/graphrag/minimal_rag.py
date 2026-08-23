#!/usr/bin/env python3
"""Minimal local RAG PoC - improved relevance."""

import os
import re
from pathlib import Path
from collections import Counter

INPUT_DIR = Path("/home/x/Desktop/graphrag_project/input")
CHUNK_SIZE = 200
TOP_K = 3
MAX_EXCERPT = 600

STOP_WORDS = {
    "the","and","that","this","which","with","from","were","been","have","would","could",
    "should","shall","may","might","must","also","into","than","then","them","they",
    "their","there","these","those","being","between","through","during","before",
    "after","above","below","between","out","off","over","under","again","further",
    "once","here","there","when","where","why","how","all","both","each","few","more",
    "most","other","some","such","no","not","only","same","very","just","because",
    "what","about","did","win"
}

EXCLUDE_EXTS = {".csv", ".json", ".log"}

def clean(text):
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def tokenize(text):
    words = re.findall(r"\b[a-zA-Z]{2,}\b", text.lower())
    return [w for w in words if w not in STOP_WORDS]

def chunk_text(text, size=CHUNK_SIZE):
    paragraphs = re.split(r"\n\s*\n", text)
    chunks = []
    current = []
    current_len = 0
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        words = para.split()
        if current_len + len(words) > size and current:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
        current.extend(words)
        current_len += len(words)
        if current_len >= size:
            chunks.append(" ".join(current))
            current = []
            current_len = 0
    if current:
        chunks.append(" ".join(current))
    return chunks

def load_chunks():
    chunks = []
    for path in sorted(INPUT_DIR.rglob("*")):
        if path.is_file() and path.suffix.lower() not in EXCLUDE_EXTS:
            try:
                text = clean(path.read_text(errors="ignore"))
                if len(text) < 20:
                    continue
                for chunk in chunk_text(text):
                    chunks.append((str(path.relative_to(INPUT_DIR)), chunk))
            except Exception:
                pass
    return chunks

def score_chunk(query, chunk_text):
    query_terms = Counter(tokenize(query))
    doc_terms = Counter(tokenize(chunk_text))
    score = 0
    for term in query_terms:
        if term in doc_terms:
            score += doc_terms[term]
            if term in chunk_text.lower():
                score += 2
    return score

def retrieve(query, chunks, top_k=TOP_K):
    scored = [(score_chunk(query, c), name, c) for name, c in chunks]
    scored = [x for x in scored if x[0] > 0]
    scored.sort(reverse=True)
    return scored[:top_k]

def main():
    query = input("Query: ").strip()
    if not query:
        return
    chunks = load_chunks()
    if not chunks:
        print("No text chunks found.")
        return
    results = retrieve(query, chunks)
    if not results:
        print("No matches found.")
        return
    print(f"\nTop {len(results)} results for: {query}\n")
    for score, name, text in results:
        excerpt = text[:MAX_EXCERPT] + ("..." if len(text) > MAX_EXCERPT else "")
        print(f"=== {name} (relevance: {score}) ===")
        print(excerpt)
        print()

if __name__ == "__main__":
    main()
