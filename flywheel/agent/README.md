# Agent Harness — Flywheel Intelligence Layer

```
.fcukproxy/
├── multi-branch-release.sh   Main flywheel script
├── intelligence.py           AI + pool fix selector
├── release-state.json        Flywheel state
└── agent/
    ├── README.md             This file
    ├── soul.md               Mission, identity, decision framework
    ├── manifest.md           Branch registry with metadata
    ├── memory.md             Cross-branch learnings & patterns
    ├── heartbeat.sh          Health monitoring script
    └── branches/
        ├── althea.md
        ├── archives.md
        ├── ...               One per branch
```

## How It Works

1. Flywheel selects a branch (rotation_index)
2. **soul.md** provides mission context — what each website is trying to do
3. **manifest.md** provides metadata — URL, stack, type
4. **branches/{branch}.md** provides per-branch knowledge — past fixes, known issues
5. **intelligence.py** reads all of the above and builds a rich prompt for the AI
6. AI returns targeted fixes specific to that branch's website and purpose
7. If AI fails, **fix pool** iterates through 30+ fallback types
8. After release, **branches/{branch}.md** is updated with what was done
9. After release, **memory.md** is updated with what was learned

## Key Principle

Each release must make the branch's deployed website measurably better.
The agent uses its accumulated knowledge to make deterministic, context-aware decisions about what to fix next.
