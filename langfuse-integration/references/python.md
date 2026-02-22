# Python Pattern

## Install

```bash
pip install langfuse openai
```

## Minimal example (with provider/model gating)

```python
import os
import time
from openai import OpenAI
from langfuse import Langfuse

openai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
langfuse = Langfuse(
    secret_key=os.environ["LANGFUSE_SECRET_KEY"],
    public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
    host=os.getenv("LANGFUSE_HOST"),
)

def csv_env(name: str) -> set[str]:
    raw = os.getenv(name, "")
    return {x.strip() for x in raw.split(",") if x.strip()}

def should_trace(provider: str, model: str) -> bool:
    if os.getenv("LANGFUSE_ENABLE", "true").lower() == "false":
        return False
    allow_providers = csv_env("LANGFUSE_ALLOW_PROVIDERS")
    deny_providers = csv_env("LANGFUSE_DENY_PROVIDERS")  # e.g. openrouter
    allow_models = csv_env("LANGFUSE_ALLOW_MODELS")
    deny_models = csv_env("LANGFUSE_DENY_MODELS")

    if provider in deny_providers or model in deny_models:
        return False
    if allow_providers and provider not in allow_providers:
        return False
    if allow_models and model not in allow_models:
        return False
    return True

def traced_chat(input_text: str, user_id: str | None = None) -> str:
    provider = "openai"
    model = "gpt-4.1-mini"
    trace_enabled = should_trace(provider, model)

    trace = (
        langfuse.trace(name="chat", user_id=user_id, metadata={"feature": "chat", "provider": provider})
        if trace_enabled
        else None
    )
    start = time.time()

    try:
        res = openai.responses.create(model=model, input=input_text)
        text = getattr(res, "output_text", "") or ""

        if trace:
            trace.generation(
                name="openai-response",
                model=model,
                input=input_text,
                output=text,
                metadata={"latencyMs": int((time.time() - start) * 1000), "provider": provider},
                usage_details={
                    "input": getattr(getattr(res, "usage", None), "input_tokens", None),
                    "output": getattr(getattr(res, "usage", None), "output_tokens", None),
                },
            )
        return text
    except Exception as e:
        if trace:
            trace.event(name="llm-error", level="ERROR", metadata={"message": str(e)})
        raise
    finally:
        if trace_enabled:
            langfuse.flush()
```

## Notes

- Keep one Langfuse client per app process.
- Add `session_id` and request identifiers as metadata for debugging.
- Redact PII before emitting trace input/output when required.
- Recommended in your case: set `LANGFUSE_DENY_PROVIDERS=openrouter` to avoid duplicate traces when OpenRouter already logs to Langfuse.
