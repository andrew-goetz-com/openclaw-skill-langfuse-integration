---
name: langfuse-integration
description: Integrate Langfuse observability with OpenAI or OpenRouter calls in OpenClaw-adjacent projects. Use when setting up prompt/response tracing, token and latency monitoring, user/session attribution, or basic eval/score logging for Node.js or Python LLM workflows.
---

# Langfuse Integration

Set up reliable LLM tracing with Langfuse, then verify traces end-to-end before expanding instrumentation.

## Workflow

1. Choose integration path.
2. Configure environment variables.
3. Add minimal instrumentation.
4. Send one smoke-test request.
5. Confirm trace in Langfuse UI.
6. Expand to metadata, scores, and cost dashboards.

## 1) Choose integration path

- Use `references/nodejs.md` for JavaScript/TypeScript services.
- Use `references/python.md` for Python services.
- Use `references/openclaw-patterns.md` for OpenClaw-specific placement and conventions.
- Use `references/hook-implementation.md` for gateway-level enforcement (recommended for guaranteed coverage).
- Reuse `scripts/should_trace.ts` or `scripts/should_trace.py` as the canonical gating helper.

Prefer gateway hook enforcement when users want all OpenClaw requests governed by one tracing policy.

## 2) Required environment variables

Set these in your runtime:

- `LANGFUSE_SECRET_KEY`
- `LANGFUSE_PUBLIC_KEY`
- `LANGFUSE_HOST` (for EU/US/self-hosted endpoint)
- `OPENAI_API_KEY` (or provider key used by your app)

Optional gating controls (recommended):

- `LANGFUSE_ENABLE=true|false` (global on/off)
- `LANGFUSE_ALLOW_PROVIDERS` (csv, e.g. `openai,anthropic`)
- `LANGFUSE_DENY_PROVIDERS` (csv, e.g. `openrouter`)
- `LANGFUSE_ALLOW_MODELS` (csv exact model ids)
- `LANGFUSE_DENY_MODELS` (csv exact model ids)

Default policy for this skill: if `LANGFUSE_DENY_PROVIDERS` includes `openrouter`, skip tracing for OpenRouter calls to avoid duplicate ingestion when provider-side logging already exists.

Do not hardcode secrets in source files.

## 3) Apply gating before instrumentation

Before creating a trace, evaluate provider/model policy.

Rule order:

1. If `LANGFUSE_ENABLE=false`, skip tracing.
2. If provider/model in deny-list, skip tracing.
3. If allow-list is non-empty and provider/model not included, skip tracing.
4. Otherwise trace normally.

This prevents double-logging for providers already connected to Langfuse externally.

## 4) Minimal instrumentation standard

For every traced generation, capture at least:

- model
- input messages/prompt
- output text
- usage (input/output tokens when available)
- latency
- status/error

Add optional metadata early when available:

- `userId`
- `sessionId`
- `feature` (chat, summary, extraction, etc.)

## 5) Agent execution mode (default)

Do not ask users to copy files manually. Implement the hook directly.

When user asks for OpenClaw-wide monitoring, execute this exact sequence:

1. Read and follow `references/hook-implementation.md`.
2. Create hook files in `<workspace>/hooks/langfuse-tracing/` yourself.
3. If env vars are missing, ask only for required values (`LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, optional `LANGFUSE_HOST` and policy vars).
4. Enable hook via `openclaw hooks enable langfuse-tracing`.
5. Run `openclaw hooks list` and `openclaw hooks check` and report results.
6. Run success + deny-policy test requests and confirm behavior in Langfuse.

Only provide manual copy/paste instructions if direct file/CLI execution is unavailable.

## 6) Verification checklist

After first instrumented request:

- Confirm one trace appears in Langfuse.
- Confirm generation includes prompt + completion.
- Confirm tokens and model are populated.
- Confirm error path also logs when forcing a bad key/request.

If traces do not appear, verify keys, host, network egress, and flush/shutdown behavior.

## 7) Production guardrails

- Redact secrets and highly sensitive payloads before logging.
- Sample high-volume traffic if cost/noise grows.
- Use consistent metadata keys across services.
- Add scores/evals only after baseline tracing is stable.

## 8) Common asks this skill should handle

- “Add Langfuse tracing to my OpenAI calls.”
- “Track per-user LLM usage and latency.”
- “Why are traces missing from Langfuse?”
- “Set up a reusable instrumentation wrapper for Node/Python.”
