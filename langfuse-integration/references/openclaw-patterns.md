# OpenClaw Patterns

Use this when integrating Langfuse in projects operated with OpenClaw.

## Placement

- Instrument your app/service code that makes LLM calls.
- If using multiple agents/services, standardize metadata keys (`agent`, `sessionId`, `feature`, `userId`).
- Keep provider API keys and Langfuse keys in environment/secret storage, never in skill files.

## Provider/model gating policy (recommended)

Use env-driven gates so the same code can run across environments.

- Exclude providers already forwarding traces (example: `openrouter`).
- Optionally include only selected models during rollout.
- Keep policy centralized in one helper (`shouldTrace`) reused by all LLM call sites.

Example env:

```bash
LANGFUSE_ENABLE=true
LANGFUSE_DENY_PROVIDERS=openrouter
# LANGFUSE_ALLOW_PROVIDERS=openai
# LANGFUSE_ALLOW_MODELS=gpt-4.1-mini,gpt-4.1
```

## Suggested metadata schema

```json
{
  "agent": "main|worker|tooling",
  "feature": "chat|summary|classification",
  "sessionId": "<conversation or request id>",
  "userId": "<stable user id>",
  "provider": "openai|openrouter",
  "model": "<model id>"
}
```

## Smoke-test routine

1. Run one successful request.
2. Run one intentionally failing request.
3. Confirm both appear in Langfuse with clear status and metadata.

## Troubleshooting

- No traces: verify `LANGFUSE_HOST`, keys, and outbound network.
- Missing usage: inspect provider response shape and map token fields correctly.
- Missing tail traces: add explicit flush on shutdown and after short-lived jobs.
