# FinanceCheque.uk Task List

1. Replace placeholder branding ("PCP REFUND" / Jigsaw Claims) with FinanceCheque.uk name, logo, and contact details across header/footer and the Thank You page.
2. Implement article detail pages for news items (use `NEWS_ITEMS.slug`) and wire the "Read Full Story" CTA to real routes.
3. Add real content sources for news (CMS or markdown files) and remove hard-coded placeholder dates where appropriate.
4. Add GDPR/consent checkboxes to the claim form and link to Privacy Policy and Terms pages.
5. Add client-side validation for date of birth, phone, email, and postcode, with inline error messages.
6. Replace placeholder phone number on the Thank You page with the correct support number.
7. Remove verbose console logging from the claim form and replace with a minimal, production-safe logger.
8. Add server-side validation and rate limiting for `/api/submit-claim` in the backend functions.
9. Provide `.env.example` and guard against missing `VITE_*` keys with user-friendly errors.
10. Add SEO metadata (title/description/OG tags) per route and a sitemap/robots.txt for financecheque.uk.
11. Replace third-party hero/news images with optimized local assets to avoid external hotlinks.
12. Add accessibility improvements: focus styles for menu toggle, skip link, and proper button/aria labels.
