// Prepares the static demo: copies sample images into public/ and bakes the recorded
// model outputs through the same code-side validator the server uses, so the hosted
// fallback needs no backend and never shows anything the validator hasn't seen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CROPS } from '../../server/src/knowledge.js';
import { validateAnalysis } from '../../server/src/validate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pub = path.join(root, 'web/public');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'samples/manifest.json'), 'utf8'));
const recorded = JSON.parse(fs.readFileSync(path.join(root, 'server/eval/results.json'), 'utf8'));

fs.mkdirSync(path.join(pub, 'samples'), { recursive: true });
fs.mkdirSync(path.join(pub, 'demo'), { recursive: true });
for (const m of manifest) fs.copyFileSync(path.join(root, 'samples', m.file), path.join(pub, 'samples', m.file));

const byId = {};
for (const r of recorded.results) if (!byId[r.id] || r.mode === 'given') byId[r.id] = r;
const crops = Object.entries(CROPS).map(([id, c]) => ({ id, name: c.name, diseases: Object.values(c.conditions).map((d) => d.name) }));
fs.writeFileSync(path.join(pub, 'demo/crops.json'), JSON.stringify(crops));
const samples = manifest.map((m) => ({ ...m, url: `samples/${m.file}` }));
const results = {};
for (const m of manifest) {
  const rec = byId[m.id];
  if (!rec) continue;
  results[m.id] = { source: 'recorded', model: rec.model, recordedAt: rec.recordedAt, truth: m.truth, ...validateAnalysis(rec.raw, { crop: rec.givenCrop }) };
}
fs.writeFileSync(path.join(pub, 'demo/samples.json'), JSON.stringify(samples));
fs.writeFileSync(path.join(pub, 'demo/results.json'), JSON.stringify(results));
console.log(`demo: ${samples.length} samples, ${Object.keys(results).length} recorded results`);
