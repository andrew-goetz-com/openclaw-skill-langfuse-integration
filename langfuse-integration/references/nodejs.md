# Node.js / TypeScript Pattern

## Install

```bash
npm install langfuse openai
```

## Minimal example (with provider/model gating)

```ts
import OpenAI from "openai";
import { Langfuse } from "langfuse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_HOST,
});

const csv = (v?: string) => new Set((v || "").split(",").map(s => s.trim()).filter(Boolean));
const allowProviders = csv(process.env.LANGFUSE_ALLOW_PROVIDERS);
const denyProviders = csv(process.env.LANGFUSE_DENY_PROVIDERS); // e.g. openrouter
const allowModels = csv(process.env.LANGFUSE_ALLOW_MODELS);
const denyModels = csv(process.env.LANGFUSE_DENY_MODELS);

function shouldTrace(provider: string, model: string) {
  if ((process.env.LANGFUSE_ENABLE || "true").toLowerCase() === "false") return false;
  if (denyProviders.has(provider) || denyModels.has(model)) return false;
  if (allowProviders.size > 0 && !allowProviders.has(provider)) return false;
  if (allowModels.size > 0 && !allowModels.has(model)) return false;
  return true;
}

export async function tracedChat(input: string, userId?: string) {
  const provider = "openai";
  const model = "gpt-4.1-mini";
  const traceEnabled = shouldTrace(provider, model);

  const trace = traceEnabled
    ? langfuse.trace({ name: "chat", userId, metadata: { feature: "chat", provider } })
    : null;

  const start = Date.now();
  try {
    const res = await openai.responses.create({ model, input });
    const text = res.output_text ?? "";

    trace?.generation({
      name: "openai-response",
      model,
      input,
      output: text,
      metadata: { latencyMs: Date.now() - start, provider },
      usageDetails: { input: res.usage?.input_tokens, output: res.usage?.output_tokens },
    });

    return text;
  } catch (error: any) {
    trace?.event({ name: "llm-error", level: "ERROR", metadata: { message: String(error?.message || error) } });
    throw error;
  } finally {
    if (traceEnabled) await langfuse.flushAsync();
  }
}
```

## Notes

- For chat completions API, map `usage.prompt_tokens` and `usage.completion_tokens`.
- Reuse a single Langfuse client instance per process.
- Flush on graceful shutdown to avoid dropped traces.
- Recommended in your case: set `LANGFUSE_DENY_PROVIDERS=openrouter` to avoid duplicate traces if OpenRouter already forwards to Langfuse.
