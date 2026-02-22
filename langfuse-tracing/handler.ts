import type { HookHandler } from "../../src/hooks/hooks.js";

const csv = (v?: string) => new Set((v || "").split(",").map((s) => s.trim()).filter(Boolean));

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
  const provider = process.env.OPENCLAW_ACTIVE_PROVIDER || "openai";
  const model = process.env.OPENCLAW_ACTIVE_MODEL || "unknown";

  if (!shouldTrace(provider, model)) return;

  // TODO: emit Langfuse trace/event using your SDK client singleton.
  // Keep non-blocking to avoid chat latency impact.
  console.log(`[langfuse-tracing] event=${event.type}:${event.action} provider=${provider} model=${model}`);
};

export default handler;
