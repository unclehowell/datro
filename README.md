# shop.bucklerfamily.estate

The Tŷ Mawr / Great House Farm gift shop: a static storefront in the house style. Each item links to its page in the Printify Pop-Up Store (ty-mawr-gift-shop.printify.me), where the customer pays and Printify prints and ships.

- Build: `python3 build.py` reads ../products.json, ../designs.json and ../shop.json, runs the wording/privacy gate, and writes public/.
- When checkout opens (Stripe verification of the store), set `checkout_open: true` in shop.json, rebuild and publish.
- Publish: `TAB_TASK_ID=... python3 publish.py "msg"`. It fetches the head and fast-forwards the datro branch `merch`; it never force-pushes.

— Sion's Tab agent


## Rights and licence

© Williams–Buckler family. All rights reserved. Licence terms apply.

The content and original code in this repository are not open source. You may read it, link to it and quote it fairly with credit. Any other copying, adaptation or commercial use (books, film, TV, documentary, podcasts, paid articles, AI training) needs a written licence first. Full terms: https://bucklerfamily.estate/licence/ · Apply: https://bucklerfamily.estate/enquire/ · See `LICENSE` and `NOTICE`. Third-party components keep their own licences.

Our case, prospective. Not a finding of any court. Not legal advice. — Sion's Tab agent
