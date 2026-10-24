/**
 * Great House Farm Wiki mobile read-more proxy.
 *
 * Serves the existing public WordPress site through a Cloudflare Worker and
 * adds an accessible two-line preview control to long text on small screens.
 * Source evidence remains on WordPress; this worker changes presentation only.
 *
 * Before routing a public domain to this Worker, test it against representative
 * pages and confirm WordPress permits proxying. Set WP_ORIGIN to
 * https://greathousefarmwiki.wordpress.com in Worker variables.
 */
const DEFAULT_ORIGIN = "https://greathousefarmwiki.wordpress.com";

const ENHANCEMENT = String.raw`<style id="ghf-readmore-css">
@media (max-width: 767px) {
  .ghf-readmore-target.ghf-readmore-collapsed {
    display: -webkit-box !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 2 !important;
    line-clamp: 2 !important;
    overflow: hidden !important;
  }
  .ghf-readmore-control {
    display: inline-block;
    margin: .25rem 0 .75rem;
    padding: .25rem .5rem;
    border: 1px solid currentColor;
    border-radius: .25rem;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: .9em;
    text-decoration: underline;
    cursor: pointer;
  }
  .ghf-readmore-control:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}
@media (min-width: 768px) {
  .ghf-readmore-control { display: none !important; }
}
</style>
<script id="ghf-readmore-script">
(() => {
  'use strict';
  const mobile = () => window.matchMedia('(max-width: 767px)').matches;
  const excluded = 'script,style,noscript,textarea,pre,code,button,input,select,option,summary,figcaption,.wp-block-button,.wp-block-navigation,.ghf-mobile-menu,.ghf-readmore-control,[role="button"],[contenteditable="true"]';
  const candidates = 'p, li, blockquote, .wp-block-heading';
  const isEligible = el => {
    if (el.closest(excluded)) return false;
    if (el.matches('li') && el.querySelector('ul,ol')) return false;
    const text = (el.innerText || el.textContent || '').trim();
    if (text.length < 110) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  };
  const enhance = () => {
    document.querySelectorAll(candidates).forEach(el => {
      if (!isEligible(el)) return;
      let button = el.nextElementSibling;
      if (!button || !button.classList.contains('ghf-readmore-control')) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'ghf-readmore-control';
        button.textContent = 'Read more';
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', () => {
          const expanded = button.getAttribute('aria-expanded') === 'true';
          button.setAttribute('aria-expanded', String(!expanded));
          button.textContent = expanded ? 'Read more' : 'Read less';
          el.classList.toggle('ghf-readmore-collapsed', expanded);
        });
        el.after(button);
      }
      if (mobile()) {
        el.classList.add('ghf-readmore-target');
        if (el.scrollHeight > el.clientHeight + 2 || el.dataset.ghfMeasured !== '1') {
          el.dataset.ghfMeasured = '1';
          // Measure natural height first; only add a control when content overflows.
          el.classList.remove('ghf-readmore-collapsed');
          const fullHeight = el.scrollHeight;
          const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
          if (fullHeight > lineHeight * 2.25) {
            el.classList.add('ghf-readmore-collapsed');
            button.hidden = false;
          } else {
            el.classList.remove('ghf-readmore-collapsed');
            button.hidden = true;
          }
        }
      } else {
        el.classList.remove('ghf-readmore-collapsed', 'ghf-readmore-target');
        button.hidden = true;
      }
    });
  };
  let timer;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(enhance, 80); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', schedule, {passive:true});
  // WordPress themes may load/replace content lazily; process new content too.
  const observer = new MutationObserver(records => {
    if (records.some(r => [...r.addedNodes].some(n => n.nodeType === 1))) schedule();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
</script>`;

export default {
  async fetch(request, env) {
    const origin = (env.WP_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, "");
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, origin);
    const headers = new Headers(request.headers);
    headers.set("Host", new URL(origin).host);
    headers.delete("cookie");
    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers,
      redirect: "follow",
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body
    });
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.includes("text/html") || request.method === "HEAD") {
      const headers = new Headers(upstream.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
    }
    let html = await upstream.text();
    // Avoid injecting twice and preserve original document/evidence content.
    if (html.includes('id="ghf-readmore-script"')) {
      const headers = new Headers(upstream.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(html, { status: upstream.status, headers });
    }
    if (html.includes("</head>")) html = html.replace("</head>", ENHANCEMENT + "</head>");
    else html = ENHANCEMENT + html;
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-length");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-security-policy");
    responseHeaders.delete("content-security-policy-report-only");
    responseHeaders.set("X-Robots-Tag", "noindex, nofollow");
    responseHeaders.set("x-ghf-readmore", "injected");
    return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
  }
};
