#!/usr/bin/env python3
"""GraphRAG HTTP server — lightweight keyword RAG on port 8050."""

import json
import os
import re
import sys
from collections import Counter
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs

INPUT_DIR = Path(os.environ.get("GRAPHRAG_INPUT", Path(__file__).parent / "input"))
CHUNK_SIZE = 200
TOP_K = 3
MAX_EXCERPT = 600

STOP_WORDS = {
    "the","and","that","this","which","with","from","were","been","have","would","could",
    "should","shall","may","might","must","also","into","than","then","them","they",
    "their","there","these","those","being","between","through","during","before",
    "after","above","below","out","off","over","under","again","further",
    "once","here","when","where","why","how","all","both","each","few","more",
    "most","other","some","such","no","not","only","same","very","just","because",
    "what","about","did","win"
}
EXCLUDE_EXCS = {".csv", ".json", ".log"}

_chunks = []


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


def tokenize(text):
    words = re.findall(r"\b[a-zA-Z]{2,}\b", text.lower())
    return [w for w in words if w not in STOP_WORDS]


def chunk_text(text, size=CHUNK_SIZE):
    paragraphs = re.split(r"\n\s*\n", text)
    chunks, current, current_len = [], [], 0
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        words = para.split()
        if current_len + len(words) > size and current:
            chunks.append(" ".join(current))
            current, current_len = [], 0
        current.extend(words)
        current_len += len(words)
        if current_len >= size:
            chunks.append(" ".join(current))
            current, current_len = [], 0
    if current:
        chunks.append(" ".join(current))
    return chunks


def load_chunks():
    chunks = []
    for path in sorted(INPUT_DIR.rglob("*")):
        if path.is_file() and path.suffix.lower() not in EXCLUDE_EXCS:
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


def retrieve(query, top_k=TOP_K):
    scored = [(score_chunk(query, c), name, c) for name, c in _chunks]
    scored = [x for x in scored if x[0] > 0]
    scored.sort(reverse=True)
    results = []
    for score, name, text in scored[:top_k]:
        excerpt = text[:MAX_EXCERPT] + ("..." if len(text) > MAX_EXCERPT else "")
        results.append({"source": name, "score": score, "excerpt": excerpt})
    return results


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write(f"[graphrag] {args[0]}\n")

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/query":
            params = parse_qs(parsed.query)
            q = params.get("q", [""])[0].strip()
            if not q:
                self.send_json(400, {"error": "missing ?q="})
                return
            results = retrieve(q)
            self.send_json(200, {"query": q, "results": results, "chunks_loaded": len(_chunks)})
        elif parsed.path == "/health":
            self.send_json(200, {"status": "ok", "chunks": len(_chunks), "input_dir": str(INPUT_DIR)})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/query":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            q = body.get("q", "").strip()
            if not q:
                self.send_json(400, {"error": "missing q in body"})
                return
            results = retrieve(q)
            self.send_json(200, {"query": q, "results": results, "chunks_loaded": len(_chunks)})
        else:
            self.send_json(404, {"error": "not found"})

    def send_json(self, code, data):
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main():
    global _chunks
    port = int(os.environ.get("GRAPHRAG_PORT", 8050))
    print(f"[graphrag] Loading chunks from {INPUT_DIR}...")
    _chunks = load_chunks()
    print(f"[graphrag] Loaded {len(_chunks)} chunks")
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"[graphrag] Listening on http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
