import { buildPrompt, responseSchema } from './schema.js';

const HOST = () => process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
export const MODEL = () => process.env.OLLAMA_MODEL || 'gemma4:e4b';

export class ModelUnavailable extends Error {}

/** Is Ollama reachable, and is the configured model pulled? */
export async function ollamaStatus(fetchImpl = fetch) {
  try {
    const r = await fetchImpl(`${HOST()}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!r.ok) return { reachable: false, modelPresent: false, model: MODEL() };
    const { models = [] } = await r.json();
    const present = models.some((m) => m.name === MODEL() || m.model === MODEL());
    return { reachable: true, modelPresent: present, model: MODEL() };
  } catch {
    return { reachable: false, modelPresent: false, model: MODEL() };
  }
}

/** Ask the local vision model for a structured read of one image (base64, no data: prefix). `crop` is the grower's crop id, if known. */
export async function analyzeWithOllama(imageBase64, { crop, fetchImpl = fetch, timeoutMs = 180_000 } = {}) {
  let res;
  try {
    res = await fetchImpl(`${HOST()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model: MODEL(),
        stream: false,
        think: process.env.OLLAMA_THINK === '1',
        format: responseSchema({ crop }),
        options: { temperature: 0, seed: 7 },
        messages: [{ role: 'user', content: buildPrompt({ crop }), images: [imageBase64] }],
      }),
    });
  } catch (e) {
    throw new ModelUnavailable(`Could not reach Ollama at ${HOST()} (${e.cause?.code || e.name}).`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ModelUnavailable(`Ollama returned ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.message?.content ?? '';
}
