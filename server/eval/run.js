// Runs every labelled sample through the real model and writes measured results.
//   npm run eval                 -> runs the model in both modes, writes eval/results.json and ../EVAL.md
//   npm run eval -- --rescore    -> re-scores saved model outputs without a model (e.g. after editing validate.js)
// Modes: "given" = grower names the crop (how the app is meant to be used); "auto" = model must name the crop too.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeWithOllama, ollamaStatus, MODEL } from '../src/ollama.js';
import { loadManifest, SAMPLES_DIR, RECORDED_FILE } from '../src/samples.js';
import { computeMetrics } from './metrics.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const rescore = process.argv.includes('--rescore');
let saved;

if (rescore) {
  saved = JSON.parse(fs.readFileSync(RECORDED_FILE, 'utf8'));
} else {
  const st = await ollamaStatus();
  if (!st.reachable || !st.modelPresent) {
    console.error(`Ollama with "${st.model}" is required. Start Ollama and run: ollama pull ${st.model}`);
    process.exit(1);
  }
  const manifest = loadManifest();
  const jobs = [
    ...manifest.filter((m) => m.crop).map((m) => ({ m, mode: 'given', crop: m.crop })),
    ...manifest.map((m) => ({ m, mode: 'auto', crop: undefined })),
  ];
  const results = [];
  for (const { m, mode, crop } of jobs) {
    const t = Date.now();
    const raw = await analyzeWithOllama(fs.readFileSync(path.join(SAMPLES_DIR, m.file)).toString('base64'), { crop });
    results.push({ id: m.id, mode, givenCrop: crop, truth: m.truth, raw, ms: Date.now() - t, model: MODEL(), recordedAt: new Date().toISOString().slice(0, 10) });
    console.log(`${results.length}/${jobs.length} ${mode} ${m.id} ${Date.now() - t}ms`);
  }
  saved = { model: MODEL(), recordedAt: new Date().toISOString().slice(0, 10), host: `${process.platform}/${process.arch}`, results };
  fs.writeFileSync(RECORDED_FILE, JSON.stringify(saved, null, 1));
}

const f = (x) => (x === null ? 'n/a' : `${x}%`);
const section = (title, m) => `## ${title}

${m.n} images: ${m.diseasedImages} diseased, ${m.healthyImages} healthy, ${m.backgroundImages} background-only.

| Metric | Raw model | Validated |
|---|---|---|
| Healthy-vs-problem right (${m.leafImages} leaf images) | ${f(m.healthyVsProblemRight.raw)} | ${f(m.healthyVsProblemRight.validated)} |
| Healthy-vs-problem flatly wrong (count) | ${m.healthyVsProblemWrong.raw} | ${m.healthyVsProblemWrong.validated} |
| Abstained ("can't tell", count) | ${m.abstained.raw} | ${m.abstained.validated} |
| Named a specific disease (count) | ${m.diseaseNamed.raw} | ${m.diseaseNamed.validated} |
| Of those, named the right disease | ${m.diseaseNamedRight.raw} (${f(m.diseaseNamedPrecision.raw)}) | ${m.diseaseNamedRight.validated} (${f(m.diseaseNamedPrecision.validated)}) |
| Exactly right overall, crop + condition | ${f(m.exactCorrect.raw)} | ${f(m.exactCorrect.validated)} |

- Diseased leaves where the exact disease was named: ${f(m.diseaseExactRecall)}
- Healthy leaves called healthy: ${f(m.healthyCorrect)}
- Crop identified: ${f(m.cropIdentified)}
- Background-only photos rejected: ${f(m.backgroundRejected)}
- Code-side checks changed the verdict on ${m.validatorChanged} of ${m.n} images
- Latency per image: median ${m.latencyMs.median} ms, p95 ${m.latencyMs.p95} ms
- Per class (validated, correct/total): ${Object.entries(m.perClass).map(([k, v]) => `${k} ${v}`).join('; ')}
`;
const modes = ['given', 'auto'].map((mode) => [mode, saved.results.filter((r) => (r.mode ?? 'auto') === mode)]).filter(([, r]) => r.length);
const metrics = Object.fromEntries(modes.map(([mode, r]) => [mode, computeMetrics(r)]));
fs.writeFileSync(path.join(here, 'metrics.json'), JSON.stringify({ model: saved.model, recordedAt: saved.recordedAt, modes: Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, { ...v, rows: undefined }])) }, null, 1));
const md = `# Eval results

Model \`${saved.model}\` via Ollama, run on ${saved.recordedAt} (${saved.host ?? 'unknown host'}), temperature 0, one run.
Images: PlantVillage (CC0), two per class, see \`samples/README.md\`. Single leaves on plain backgrounds, which is easier than field photos.
The first full run on these images exposed a design flaw (the model never named the crop), so the crop-selector design was then tuned on a separate set of 18 PlantVillage images (rows 7 away from these, one per class, not in this repo). Neighbouring rows can show the same leaf, so this is not a clean hold-out. Treat the numbers as optimistic.
"Raw" takes the model's claim at face value. "Validated" is what the app shows after the code-side checks.
With two images per class, one image is ~3 points. Treat this as a smoke test, not a benchmark.

${modes.map(([mode]) => section(mode === 'given' ? 'Grower names the crop (default use)' : 'Auto-detect the crop (model must name it)', metrics[mode])).join('\n')}`;
fs.writeFileSync(path.resolve(here, '../../EVAL.md'), md);
console.log('\n' + md);
