import json, html, sys, glob
from datetime import datetime

def load(prefix):
    msgs=[]
    for f in sorted(glob.glob(f"corr/{prefix}_*.json")):
        msgs+=json.load(open(f))
    return sorted(msgs,key=lambda m:m["date"])

def fmt(d):
    dt=datetime.strptime(d,"%Y-%m-%dT%H:%M:%SZ")
    return dt.strftime("%-d %B %Y, %H:%M UTC")

def body_html(t):
    return "".join(f"<p>{html.escape(p).replace(chr(10),'<br>')}</p>" for p in t.split("\n\n"))

def build(cfg):
    msgs=load(cfg["prefix"])
    threads=[]
    for m in msgs:
        if m["thread"] not in threads: threads.append(m["thread"])
    out=[]
    out.append(f'<p><strong>Evidence type:</strong> Email correspondence (primary record). <strong>Institution:</strong> {html.escape(cfg["name"])}. <strong>Forensic assessment:</strong> <a href="{cfg["forensic_url"]}">{html.escape(cfg["forensic_title"])}</a>. <strong>Register:</strong> <a href="/records-access-chronology/foi-reply-register/">FOI &amp; Public-Authority Reply Register</a>.</p>')
    out.append('<p>This page catalogues, word for word, every email exchanged between the Williams/Buckler family and this institution about Great House Farm (Tŷ Mawr), Llandough, grouped by request thread and in date order. Each entry shows the email first, labelled by type. Repeated quoted history and email logos are trimmed so each email appears once; nothing is redacted and nothing else is altered, including spelling.</p>')
    out.append('<h2>Thread index</h2><ol>'+"".join(f'<li><a href="#t{i+1}">{html.escape(t)}</a></li>' for i,t in enumerate(threads))+'</ol>')
    for i,t in enumerate(threads):
        out.append(f'<h2 id="t{i+1}">Thread {i+1} — {html.escape(t)}</h2>')
        for m in [x for x in msgs if x["thread"]==t]:
            fam = m["from"].startswith(("Sion","Hywel"))
            label = "Email — sent by the family" if fam else f'Email — reply from {cfg["short"]}'
            head = f'{fmt(m["date"])} · {label} · {html.escape(m["subject"])}'
            meta = f'<p><strong>From:</strong> {html.escape(m["from"])}<br><strong>To:</strong> {html.escape(m["to"])}<br><strong>Date:</strong> {fmt(m["date"])}<br><strong>Subject:</strong> {html.escape(m["subject"])}'
            if m.get("attachments"): meta+=f'<br><strong>Attachments:</strong> {html.escape(m["attachments"])}'
            meta+='</p>'
            note = f'<p><em>Note:</em> {html.escape(m["note"])}</p>' if m.get("note") else ""
            out.append(f'<!-- wp:details --><details class="wp-block-details"><summary>{head}</summary>{meta}<blockquote class="wp-block-quote">{body_html(m["body"])}</blockquote>{note}</details><!-- /wp:details -->')
    if cfg.get("pending"):
        out.append('<h2>Threads awaiting transcription</h2><p>These threads exist in the family&#8217;s mailbox and are being added. Each is an empty placeholder until its text appears above.</p><ul>'+"".join(f'<li>{html.escape(p)}</li>' for p in cfg["pending"])+'</ul>')
    out.append(f'<p><strong>Related:</strong> <a href="{cfg["forensic_url"]}">{html.escape(cfg["forensic_title"])}</a> · <a href="/records-access-chronology/foi-reply-register/">FOI &amp; Public-Authority Reply Register</a> · <a href="/records-access-chronology/">Records Access Chronology</a></p>')
    return "\n".join(out), len(msgs), len(threads)

if __name__=="__main__":
    cfg=json.load(open(sys.argv[1]))
    h,n,t=build(cfg)
    open(cfg["out"],"w").write(h)
    print(n,"messages",t,"threads",len(h),"chars")
