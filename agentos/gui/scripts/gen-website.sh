#!/bin/bash
PORT=${1:-8080}
mkdir -p /tmp/website
cat > /tmp/website/index.html << 'HTML'
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Hermes</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0a0a0a;color:#e8b84e;min-height:100vh;display:flex;align-items:center;justify-content:center}
.c{text-align:center;padding:2rem}
h1{font-size:3rem;margin-bottom:1rem}
p{color:#999;font-size:1.2rem}
.s{margin-top:2rem;padding:1rem;border:1px solid #333;border-radius:8px}
.d{display:inline-block;width:10px;height:10px;background:#4ade80;border-radius:50%;margin-right:8px;animation:p 2s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.3}}
</style></head>
<body><div class="c">
<h1>Hermes AgentOS</h1>
<p>Generated website on localhost:PORT</p>
<div class="s"><span class="d"></span>Service is live</div>
</div></body></html>
HTML
sed -i "s/PORT/$PORT/g" /tmp/website/index.html
cd /tmp/website && python3 -m http.server "$PORT" --bind 0.0.0.0 &
echo "Website live on http://localhost:$PORT"
