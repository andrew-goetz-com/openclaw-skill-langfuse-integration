export type TracePolicy = {
  enabled: boolean;
  allowProviders: Set<string>;
  denyProviders: Set<string>;
  allowModels: Set<string>;
  denyModels: Set<string>;
};

const csv = (value?: string) =>
  new Set((value || "").split(",").map((s) => s.trim()).filter(Boolean));

export function loadTracePolicy(env: NodeJS.ProcessEnv = process.env): TracePolicy {
  return {
    enabled: (env.LANGFUSE_ENABLE || "true").toLowerCase() !== "false",
    allowProviders: csv(env.LANGFUSE_ALLOW_PROVIDERS),
    denyProviders: csv(env.LANGFUSE_DENY_PROVIDERS),
    allowModels: csv(env.LANGFUSE_ALLOW_MODELS),
    denyModels: csv(env.LANGFUSE_DENY_MODELS),
  };
}

export function shouldTrace(provider: string, model: string, policy = loadTracePolicy()): boolean {
  if (!policy.enabled) return false;
  if (policy.denyProviders.has(provider) || policy.denyModels.has(model)) return false;
  if (policy.allowProviders.size > 0 && !policy.allowProviders.has(provider)) return false;
  if (policy.allowModels.size > 0 && !policy.allowModels.has(model)) return false;
  return true;
}
