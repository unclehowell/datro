# Email Marketing System Configuration

**Date:** 2026-04-12

## Summary

This document describes the automated email marketing system deployed on this server. The system uses the Resend.com API to send marketing emails on a scheduled basis via cron jobs. The system tracks progress and prevents overlapping runs.

## Architecture

```
System Components:
├── /home/ubuntu/send_emails_resend_safe.sh    # Main sender script (cronjob)
├── /home/ubuntu/send_emails_resend_all.sh   # Bulk sender (one-time)
├── /home/ubuntu/send_emails_resend.sh      # Legacy sender
├── /home/ubuntu/email_list.txt            # Target email addresses (1 per line)
├── /home/ubuntu/email_progress.txt        # Current line number tracking
├── /home/ubuntu/email_send.log             # Send logs
├── /home/ubuntu/.secrets/.env.resend      # API key (RESEND_API_KEY)
└── /tmp/send_emails.lock                  # Lockfile (prevents overlap)
```

## How It Works

### 1. Email List Management

- **email_list.txt**: Contains one email address per line
- **email_progress.txt**: Tracks current line number (cycles 1 to TOTAL_LINES)

### 2. Progress Tracking

The system reads `email_progress.txt` to determine which email to send next:

```bash
CURRENT_LINE=1
if [ -f "$PROGRESS" ]; then
  CURRENT_LINE=$(cat "$PROGRESS")
fi

# After sending, increment:
echo $((CURRENT_LINE + 1)) > "$PROGRESS"
```

### 3. Lockfile Mechanism

Prevents overlapping runs:

```bash
LOCKFILE=/tmp/send_emails.lock
if [ -f "$LOCKFILE" ]; then
  exit 0  # Already running, exit
fi
touch "$LOCKFILE"
trap "rm -f $LOCKFILE" EXIT
```

### 4. Cycle Completion

When all emails processed, cycle back to start:

```bash
if [ "$CURRENT_LINE" -gt "$TOTAL_LINES" ]; then
  echo 1 > "$PROGRESS"  # Cycle back to start
  crontab -l | grep -v send_emails_resend_safe.sh | crontab -  # Remove cron
fi
```

## Cron Job Configuration

```
*/2 * * * * /home/ubuntu/send_emails_resend_safe.sh
```

Runs every 2 minutes. One email per run to respect free tier (100/month = ~3/day).

## Resend.com API

### API Endpoint

```
POST https://api.resend.com/emails
```

### Headers

```bash
-H "Authorization: Bearer $RESEND_API_KEY"
-H "Content-Type: application/json"
```

### Payload

```json
{
  "from": "noreply@car.financecheque.uk",
  "to": ["recipient@example.com"],
  "subject": "Car Finance Cheque UK",
  "html": "Sirs/Madam,<br><br>Following the FCA's recent press release..."
}
```

### Response Handling

```bash
RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" -d "$PAYLOAD" https://api.resend.com/emails)
CODE=$(echo "$RESPONSE" | tail -1)

if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  echo "$(date): SENT $EMAIL (line $CURRENT_LINE of $TOTAL_LINES)" >> "$LOG"
else
  echo "$(date): FAILED $EMAIL (line $CURRENT_LINE of $TOTAL_LINES) HTTP=$CODE" >> "$LOG"
fi
```

## Email Content

### Subject Line

```
Car Finance Cheque UK
```

### HTML Body

```html
Sirs/Madam,<br><br>Following the FCA's recent press release, many individuals may now be eligible to make a claim relating to car finance agreements.<br><br>You can quickly check your eligibility here:<br><a href="https://car.financecheque.uk">https://car.financecheque.uk</a><br><br>Kind regards,<br>Sion Buckler<br>Founder & CEO<br>DATRO Consortium Ltd<br>+44 203 137 7118
```

### Plain Text Alternative

```
Sirs/Madam,

Following the FCA's recent press release, many individuals may now be eligible to make a claim relating to car finance agreements.

You can quickly check your eligibility here:
https://car.financecheque.uk

Kind regards,
Sion Buckler
Founder & CEO
DATRO Consortium Ltd
+44 203 137 7118
```

## File Dependencies

### Non-Standard Files (Not part of fresh Ubuntu install)

| File | Purpose |
|------|---------|
| `/home/ubuntu/send_emails_resend_safe.sh` | Main sender script |
| `/home/ubuntu/send_emails_resend_all.sh` | Bulk sender |
| `/home/ubuntu/send_emails_resend.sh` | Legacy sender |
| `/home/ubuntu/mail_script.sh` | Alternative using `mail` command |
| `/home/ubuntu/email_list.txt` | Target email addresses |
| `/home/ubuntu/email_progress.txt` | Line number tracker |
| `/home/ubuntu/email_send.log` | Send activity log |
| `/home/ubuntu/.secrets/.env.resend` | API key storage |
| `/tmp/send_emails.lock` | Lockfile |

### Key Scripts

```
/home/ubuntu/
├── send_emails_resend_safe.sh    # Primary (cron-controlled, 1 email per run)
├── send_emails_resend_all.sh    # Bulk (sends all remaining)
├── send_emails_resend.sh       # Legacy (incomplete variables)
├── mail_script.sh             # Alternative with mail command
├── email_list.txt              # Email addresses
├── email_progress.txt         # Progress tracker
└── email_send.log             # Activity log
```

## PM2 Process Management

The system can also run under PM2:

```
/home/ubuntu/.pm2/
├── pids/email-sender-3.pid
└── logs/
    ├── email-sender-out.log
    └── email-sender-error.log
```

View PM2 status:

```bash
pm2 status
```

## Monitoring

### Check Logs

```bash
tail -f /home/ubuntu/email_send.log
```

### View Progress

```bash
cat /home/ubuntu/email_progress.txt
```

### Count Emails

```bash
wc -l /home/ubuntu/email_list.txt
```

## Security Notes

- API key stored in `/home/ubuntu/.secrets/.env.resend` (not committed to git)
- Lockfile prevents concurrent runs
- Only sends 1 email per cron cycle (respects free tier)
- HTTP response codes checked for success

## Files Tree View

```
/home/ubuntu/
├── .secrets/
│   └── .env.resend              # RESEND_API_KEY=re_...
├── send_emails_resend_safe.sh   # Main cron script (runs every 2 min)
├── send_emails_resend_all.sh   # Bulk sender
├── send_emails_resend.sh      # Legacy
├── mail_script.sh             # mail command alternative
├── email_list.txt            # Target emails
├── email_progress.txt        # Current position
├── email_send.log            # Activity log
└── package.json              # Dependencies
```

## See Also

- [FCUK Clone Workflow](../fcuk-clone-workflow.md) - Related deployment