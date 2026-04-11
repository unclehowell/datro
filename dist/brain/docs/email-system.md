# Email System

Email notification system for DATRO infrastructure. Configured 2026-04-10.

## Provider
- **Resend** - Transactional email API
- Domain: financecheque.uk
- From: FCUK Notify <notify@financecheque.uk>
- API Key: re_a6ygVkzq_7aWMsjxzRp6sBjAW4dhPC22S (restricted to sending only)

## Usage
Scripts use Resend API to send notifications:
- `/home/ubuntu/bin/fcuk-auto-sync.sh` - fcuk repo sync (checks only, skips if nothing to sync)
- Recipient: hywelapbuckler@gmail.com
- Runs every 15 mins via cron

## Limits
- 100 emails/day (free tier)
- 1 custom domain
- Avoid apostrophes in sender name

## Setup Notes
- Use `FCUK Notify` not `Finance Cheque UK` (apostrophe → spam)
- Resend uses US servers but delivers to UK fine
- DNS records added to Cloudflare for financecheque.uk

## Contact Rules
- **Only hywelapbuckler@gmail.com** receives emails from DATRO
- This is Hywel Buckler - system architect and creator
- No other emails unless explicitly authorized