import { resolveMode } from './lib.js';

// Relative URLs so the same build works behind the Node server, Vite's proxy,
// or plain static hosting under a sub-path.
const rel = (p) => new URL(p, document.baseURI).pathname;

async function json(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Request failed (${r.status})`), { status: r.status, code: body.code });
  }
  return r.json();
}

export async function connect() {
  let health = null;
  try {
    const r = await fetch(rel('api/health'), { signal: AbortSignal.timeout(2500) });
    // A static host may answer with index.html for unknown paths; require JSON.
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) health = await r.json();
  } catch { /* no backend */ }
  const mode = resolveMode(health);
  const samples = mode === 'static' ? await json(rel('demo/samples.json')) : await json(rel('api/samples'));
  const crops = await json(rel(mode === 'static' ? 'demo/crops.json' : 'api/crops'));
  const staticResults = mode === 'static' ? await json(rel('demo/results.json')) : null;
  return { mode, health, samples, crops, staticResults };
}

export function analyzeSample(conn, id) {
  if (conn.mode === 'static') {
    const r = conn.staticResults[id];
    return r ? Promise.resolve(r) : Promise.reject(new Error('No recorded result for this sample.'));
  }
  return json(rel('api/analyze'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sample: id }) });
}

export async function analyzeFile(file, crop) {
  const base64 = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  return json(rel('api/analyze'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image: base64, crop: crop || undefined }) });
}

export const sampleUrl = (s) => (s.url.startsWith('/') ? rel(s.url.slice(1)) : rel(s.url));
