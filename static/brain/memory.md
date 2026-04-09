# Memory: Persistent Context

## Role & Ownership

- **Position**: Assistant Technical Director of DATRO Consortium Ltd
- **Parent Organisation**: DATRO Consortium Ltd (trustee company, private security group)
- **Principal**: Sion Buckler Esq. (Ret'd Sgt)
- **Trust**: Buckler Family Trust (Sion Buckler as Settlor)
- **Estate**: Executor of the Estate of the Manor of Llandough
- **Location**: Near Penarth, South Wales

## Key Websites

| Platform | URL |
|----------|-----|
| Main Company | datro.xyz |
| Primary Platform | financecheque.uk |
| Library | library.datro.xyz |
| Archive | wayback.datro.xyz |

## Campaigns

| Subdomain | Purpose |
|-----------|---------|
| bpvsbuckler.datro.xyz | Set aside BP vs Buckler 1987 (concealed evidence, identity fraud) |
| ccan.datro.xyz | Christian Constitutionalist Alliance of Nations |
| ceo.datro.xyz | Proper burials, acknowledgement of deceased as civil war casualties |
| hnbb.datro.xyz / gui.datro.xyz | Internet as free, inherent, inalienable right |
| dcc.datro.xyz | Debt Cancellation Circle |
| car.financecheque.uk | PCP redress (£30 billion - UK State seeks £22.5bn, Britons get £7.5bn) |

## PCP Redress Details

- Total amount ruled due and payable: £30 billion
- British State retention attempt: £22.5 billion
- Amount to Britons: £7.5 billion
- Court ruling: August 2025

## Historical Context

- BP vs Buckler 1987 case (concealed evidence, identity fraud)
- British Establishment colonisation of indigenous Britons
- Civil war against indigenous Britons on ancestral birthland
- Centuries of deception, exploitation, abuse, human rights violations, war crimes, fraud, soft genocide, depopulation, replacement

## Lessons Learned

### Workflow Pipeline Consideration (2026-04-09)
- When working on ANY individual part of a workflow, ALWAYS consider the ENTIRE pipeline
- Cloudflare Workers/Pages deploy based on specific branch names - new branch each time breaks deployment
- The fcuk-sync script was incorrectly creating new branches instead of pushing to gh-pages directly
- FIXED: Now pushes directly to gh-pages branch for Cloudflare deployment

### Boolean Logic from Conversations
- Complex conversations contain simple logical deductions that must be extracted
- Example: "AWS needs specific branch" AND "script creates new branch" = "deployment fails"
- Must apply boolean logic: identify AND conditions that break the pipeline

### Memory Integration
- Opencode session conversations should be stored in brain/memory, honcho, and mem0
- Past context informs future decisions - check memory before acting
- Configuration details matter (like SSH key paths) - verify before attempting connections

## Infrastructure Details

### AWS Command Server (command.financecheque.uk / 13.135.142.244)
- **User**: ubuntu
- **SSH Key**: ~/.ssh/paperclip-hermes-nvidia-key.pem (NOT london-key.pem)
- **Datro Dir**: /var/www/datro (web root)
- **Working Datro Dir**: ~/datro (scripts)
- **fcuk-sync script**: ~/datro/scripts/fcuk-sync.sh
- **Cron**: */5 * * * * (every 5 minutes)
- **Target**: Pushes directly to gh-pages branch (not new branch)

### Cloudflare Deployment
- Monitors gh-pages branch for changes
- static/fcuk path deployed from gh-pages
