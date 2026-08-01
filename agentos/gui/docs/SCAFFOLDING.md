# Scaffolding — Patterns & Conventions

## Overview

Scaffolding provides the pre-built structures, templates, and patterns that agents use. It reduces the cognitive load on the LLM by providing ready-made solutions for common tasks.

## Scaffold Types

### 1. Route Scaffolds
Pre-defined routing patterns in the chat API:

| Route | Handler | Description |
|-------|---------|-------------|
| CHAT | Cloud LLM | Conversational response via Groq/OpenRouter |
| EXEC | Terminal | Shell command execution |
| MATH | Python3 | Pure arithmetic evaluation |
| VIDEO | Remotion | Video generation via Chrome+FFmpeg |
| TOOL | AgentLoop | Tool execution via registry |
| MCP | MCP Server | Model Context Protocol tools |

### 2. Tool Scaffolds
Each tool has a scaffold defining its interface:

```typescript
{
  name: "terminal",
  category: "system",
  capability: "terminal",
  parameters: [
    { name: "command", type: "string", required: true },
    { name: "cwd", type: "string", default: "/home/unclehowell" },
    { name: "timeout", type: "number", default: 30000 },
  ],
  timeout: 30000,
  permissions: ["execute"],
}
```

### 3. Template Scaffolds
Pre-built compositions for video generation:

| Template | Props | Description |
|----------|-------|-------------|
| TextAnimation | text, fontSize, color, animation | Animated text effects |
| TitleCard | title, subtitle, gradientStart/End | Title with gradient |
| GradientBg | color1/2/3, speed | Animated gradients |
| Shapes | shapeCount, colors, backgroundColor | Moving shapes |

### 4. Procedure Scaffolds
Stored in `~/.agentos/procedures/`:

```json
{
  "goal": "Deploy the command dashboard",
  "steps": [
    { "tool": "git", "params": { "command": "status" } },
    { "tool": "pm2", "params": { "action": "restart", "name": "agentos-gui" } },
    { "tool": "service_check", "params": { "name": "agentos-gui", "url": "http://localhost:3000" } }
  ]
}
```

## Conventions

### File Naming
- Components: PascalCase (`ObsidianGraph.tsx`)
- Utilities: camelCase (`cloud-router.ts`)
- Config: kebab-case (`agent-harness.md`)
- Tests: `*.test.ts` or `*.spec.ts`

### Code Style
- TypeScript strict mode
- No comments unless asked
- Prefer existing libraries (don't assume availability)
- Follow existing patterns in neighboring files

### API Design
- REST: `/api/{resource}` for CRUD
- SSE: `/api/events` for streaming
- POST: `/api/chat`, `/api/tools` for actions
- GET: `/api/status`, `/api/sessions` for queries

## Anti-Patterns

### Don't
- Over-engineer: don't add abstraction for 2 uses
- Premature optimization: don't optimize without measurement
- Skip error handling: always catch and report
- Ignore timeouts: every tool must have a timeout

### Do
- Start simple: one route, one tool, one template
- Measure first: profile before optimizing
- Fail gracefully: return useful error messages
- Set timeouts: prevent infinite loops

## Extension Points

### Adding a New Tool
1. Add definition to `BUILTIN_TOOLS` in `registry.ts`
2. Implement executor method
3. Register in constructor: `this.registerExecutor("name", this.execName.bind(this))`
4. Add to chat API router if needed

### Adding a New Route
1. Add classification to `ROUTER_SYSTEM` prompt
2. Add handler in `chat/route.ts`
3. Add to `ROUTE_ICONS` in chat page
4. Test with sample prompts

### Adding a New Template
1. Create React component in `remotion/src/templates/`
2. Export composition with defaultProps
3. Register in `remotion/src/Root.tsx`
4. Add to `VALID_COMPS` in tool executor
