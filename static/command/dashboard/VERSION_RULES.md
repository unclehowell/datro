# VERSION FORMAT RULE — CRITICAL — NEVER FORGET

## The Only Allowed Format

All releases on the `command` branch MUST use this exact format:

```
command-VX.X.X.XX
```

- `command-` = branch ID prefix (lowercase)
- `V` = uppercase V
- `X.X.X.XX` = semantic version where the last two segments encode the release number

## Release Number Encoding

The version part encodes the sequential release counter:

- Release #1   → `0.0.0.01`   (patch=0, build=01)
- Release #2   → `0.0.0.02`
- Release #99  → `0.0.0.99`
- Release #100 → `0.0.1.00`   (patch=1, build=00)
- Release #101 → `0.0.1.01`
- Release #300 → `0.0.3.00`   (patch=3, build=00)

Formula: for release number R:
  patch = Math.floor(R / 100)
  build = R % 100 (zero-padded to 2 digits)

## Examples of Correct Tags

- `command-V0.0.0.01` ✅
- `command-V0.0.0.02` ✅
- `command-V0.0.3.00` ✅

## Examples of WRONG Formats (DO NOT USE)

- `command-r81` ❌
- `command-v0.2.0` ❌
- `command-v0.2.1` ❌
- `command-v0.0.0.1` ❌ (missing capital V, wrong patch/build)
- `command-V0.0.0.1` ❌  (missing trailing zero in build)

## Where to Update

1. `static/command/dashboard/public/_worker.js` — `APP_VERSION` constant
2. `static/command/dashboard/server.js` — `APP_VERSION` constant  
3. GitHub release tag — must match exactly (lowercase `command-`, uppercase `V`)

## Enforcement

The version in `APP_VERSION` MUST match the GitHub release tag.
