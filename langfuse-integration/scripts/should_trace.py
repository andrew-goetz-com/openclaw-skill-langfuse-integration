import os


def _csv(name: str) -> set[str]:
    raw = os.getenv(name, "")
    return {x.strip() for x in raw.split(",") if x.strip()}


def should_trace(provider: str, model: str) -> bool:
    if os.getenv("LANGFUSE_ENABLE", "true").lower() == "false":
        return False

    allow_providers = _csv("LANGFUSE_ALLOW_PROVIDERS")
    deny_providers = _csv("LANGFUSE_DENY_PROVIDERS")
    allow_models = _csv("LANGFUSE_ALLOW_MODELS")
    deny_models = _csv("LANGFUSE_DENY_MODELS")

    if provider in deny_providers or model in deny_models:
        return False
    if allow_providers and provider not in allow_providers:
        return False
    if allow_models and model not in allow_models:
        return False
    return True
