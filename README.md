# OpenClaw Langfuse Integration Skill

Langfuse observability skill for OpenClaw, including:

- `langfuse-integration/` skill (setup + policy + troubleshooting)
- `langfuse-tracing/` runtime hook scaffold (gateway-level enforcement pattern)
- packaged artifact: `dist/langfuse-integration.skill`

## What this gives you

- End-to-end tracing guidance for OpenClaw-managed LLM requests
- Provider/model gating policy (`allow/deny`) to avoid duplicate ingestion
- Agent-first setup instructions (OpenClaw does the work; no manual copy expected)
- Hook implementation blueprint for runtime enforcement

## Install

### Option A: Use packaged skill file

Use `dist/langfuse-integration.skill` with your OpenClaw/ClawHub flow.

### Option B: Use source folder directly

Use `langfuse-integration/` as the skill source and package with your preferred workflow.

## Core environment variables

- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_HOST` (optional depending on cloud/self-hosted target)
- `LANGFUSE_ENABLE=true|false`
- `LANGFUSE_ALLOW_PROVIDERS` / `LANGFUSE_DENY_PROVIDERS`
- `LANGFUSE_ALLOW_MODELS` / `LANGFUSE_DENY_MODELS`

Example dedupe policy:

```bash
LANGFUSE_ENABLE=true
LANGFUSE_DENY_PROVIDERS=openrouter
```

## Repository layout

```text
langfuse-integration/
  SKILL.md
  references/
    hook-implementation.md
    nodejs.md
    openclaw-patterns.md
    python.md
  scripts/
    should_trace.py
    should_trace.ts

langfuse-tracing/
  HOOK.md
  handler.ts

dist/
  langfuse-integration.skill
```

## Publish to ClawHub checklist

- [x] Skill has clear frontmatter (`name`, `description`)
- [x] References are split by concern (node/python/hook/patterns)
- [x] Reusable scripts included for policy gating
- [x] Packaged `.skill` artifact included
- [ ] Final live validation against real Langfuse project
- [ ] Add optional screenshots/demo trace links

## Security note

If any token was exposed in logs during setup, rotate it before making the repository public.
