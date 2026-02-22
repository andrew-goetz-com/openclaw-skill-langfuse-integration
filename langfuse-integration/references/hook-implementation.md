# Gateway Hook Implementation (Enforced Runtime Tracing)

Use this guide to add guaranteed, gateway-level tracing policy. This complements the skill's code patterns by ensuring tracing behavior is enforced regardless of prompt quality.

## Goal

Enforce one policy for all OpenClaw-managed requests:

- Trace requests by default
- Skip specific providers/models when configured
- Typical setup: skip OpenRouter if it already forwards traces to Langfuse

## Prerequisites

- OpenClaw gateway is running
- Langfuse keys available
- Access to workspace and OpenClaw config

## Step 1: Create hook directory

Agent behavior: create files and run commands directly. Do not ask the user to copy/paste unless execution access is unavailable.

Create a workspace hook so it is scoped per-agent/workspace:

```bash
mkdir -p <workspace>/hooks/langfuse-tracing
```

Required files:

- `<workspace>/hooks/langfuse-tracing/HOOK.md`
- `<workspace>/hooks/langfuse-tracing/handler.ts`

## Step 2: Add HOOK.md

Create `HOOK.md`:

```markdown
---
name: langfuse-tracing
description: "Enforce provider/model tracing policy for OpenClaw runtime requests"
metadata: { "openclaw": { "emoji": "📈", "events": ["message", "command"], "requires": { "env": ["LANGFUSE_SECRET_KEY", "LANGFUSE_PUBLIC_KEY"] } } }
---

# Langfuse Tracing Hook

Apply centralized tracing policy at runtime.
```

Notes:

- `events` can be narrowed as your implementation matures.
- Keep hook eligibility tied to Langfuse env vars so it fails safely.

## Step 3: Add handler.ts skeleton

Create `handler.ts` with policy evaluation and structured logging entry points.

```ts
import type { HookHandler } from "../../src/hooks/hooks.js";

const csv = (v?: string) => new Set((v || "").split(",").map(s => s.trim()).filter(Boolean));

function shouldTrace(provider: string, model: string) {
  const enabled = (process.env.LANGFUSE_ENABLE || "true").toLowerCase() !== "false";
  if (!enabled) return false;

  const allowProviders = csv(process.env.LANGFUSE_ALLOW_PROVIDERS);
  const denyProviders = csv(process.env.LANGFUSE_DENY_PROVIDERS);
  const allowModels = csv(process.env.LANGFUSE_ALLOW_MODELS);
  const denyModels = csv(process.env.LANGFUSE_DENY_MODELS);

  if (denyProviders.has(provider) || denyModels.has(model)) return false;
  if (allowProviders.size > 0 && !allowProviders.has(provider)) return false;
  if (allowModels.size > 0 && !allowModels.has(model)) return false;
  return true;
}

const handler: HookHandler = async (event) => {
  // TODO: extract provider/model from event context or correlated runtime metadata.
  const provider = "openai";
  const model = "gpt-4.1-mini";

  if (!shouldTrace(provider, model)) return;

  // TODO: emit Langfuse trace/event via your preferred SDK client singleton.
  // Keep this non-blocking.
};

export default handler;
```

## Step 4: Configure policy env vars

Set these in the environment where gateway runs:

```bash
LANGFUSE_ENABLE=true
LANGFUSE_SECRET_KEY=...
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_HOST=https://cloud.langfuse.com

# Example dedupe rule
LANGFUSE_DENY_PROVIDERS=openrouter
```

Optional controls:

- `LANGFUSE_ALLOW_PROVIDERS=openai`
- `LANGFUSE_ALLOW_MODELS=gpt-4.1-mini,gpt-4.1`
- `LANGFUSE_DENY_MODELS=<csv>`

## Step 5: Enable hook

Agent behavior: execute these commands yourself and return concise status output.

```bash
openclaw hooks list
openclaw hooks enable langfuse-tracing
openclaw hooks check
```

Then restart gateway process so registration refreshes.

## Step 6: Verify behavior

1. Send one request with provider/model that should be traced.
2. Send one request that should be skipped by deny policy.
3. Confirm expected outcome in Langfuse.
4. Confirm hook eligibility and loaded status in CLI.

## Step 7: Troubleshooting

### Hook not listed

- Verify directory path: `<workspace>/hooks/langfuse-tracing`
- Verify both `HOOK.md` and `handler.ts` exist
- Run `openclaw hooks list --verbose`

### Hook not eligible

- Run `openclaw hooks info langfuse-tracing`
- Check missing env vars and set them

### Traces missing

- Verify `LANGFUSE_HOST` and keys
- Confirm outbound network from gateway host
- Confirm your provider/model resolution logic is correct
- Add temporary console logs in handler for policy decisions

## Recommended rollout strategy

1. Enable hook with `LANGFUSE_ENABLE=true` in staging.
2. Start with `LANGFUSE_ALLOW_PROVIDERS=openai`.
3. Add deny rules (`openrouter`) where upstream forwarding already exists.
4. Remove temporary debug logs after confidence is high.

## Security and privacy

- Never hardcode keys in hook files.
- Redact PII/secrets before emitting payloads.
- Keep handler non-blocking; do not degrade chat latency.
