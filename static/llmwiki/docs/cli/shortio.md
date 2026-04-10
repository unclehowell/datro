# Short.io CLI

## API Key Location
Stored in `~/short.io` file (local machine)

## Short Domain
- **Short Domain**: my.financecheque.uk
- **Main Domain**: financecheque.uk

## Usage (via API)
```javascript
const SHORT_API_KEY = "sk_uad5kdUaytsYQzIw";
const SHORT_DOMAIN = "my.financecheque.uk";

// Create link
fetch("https://api.short.io/links", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": SHORT_API_KEY
  },
  body: JSON.stringify({
    domain: SHORT_DOMAIN,
    originalURL: "https://command.financecheque.uk",
    alias: "custom-path"
  })
});
```

## Integration with Generate Page
The generate page at financecheque.uk uses short.io:
1. Generates random 6-char path
2. Creates short.io link: my.financecheque.uk/<path>
3. Creates Cloudflare subdomain: <path>.command.financecheque.uk

## References
- API Key: ~/short.io
- Short Domain: my.financecheque.uk
- Command Domain: command.financecheque.uk
