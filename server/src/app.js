import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeImage, BadImage } from './image.js';
import { validateAnalysis } from './validate.js';
import { analyzeWithOllama, ollamaStatus, ModelUnavailable, MODEL } from './ollama.js';
import { CROPS } from './knowledge.js';
import { loadManifest, loadRecorded, SAMPLES_DIR } from './samples.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(here, '../../web/dist');

/**
 * deps are injectable so tests never need a real model.
 *   analyze(base64, {crop}) -> raw model JSON string
 *   status() -> {reachable, modelPresent, model}
 */
export function createApp({ analyze = analyzeWithOllama, status = ollamaStatus, manifest = loadManifest(), recorded = loadRecorded() } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '14mb' }));

  app.get('/api/health', async (_req, res) => {
    const s = await status();
    res.json({
      ok: true,
      model: s.model,
      ollama: s.reachable,
      modelPresent: s.modelPresent,
      // "live": model answers uploads. "recorded": only sample images, replaying saved model outputs.
      mode: s.reachable && s.modelPresent ? 'live' : 'recorded',
      samples: manifest.length,
    });
  });

  app.get('/api/samples', (_req, res) => {
    res.json(manifest.map(({ id, file, truth, crop, source }) => ({ id, file, truth, crop, source, url: `/samples/${file}` })));
  });
  app.get('/api/crops', (_req, res) => {
    res.json(Object.entries(CROPS).map(([id, c]) => ({ id, name: c.name, diseases: Object.values(c.conditions).map((d) => d.name) })));
  });
  app.use('/samples', express.static(SAMPLES_DIR, { index: false, maxAge: '1d' }));

  app.post('/api/analyze', async (req, res) => {
    const { image, sample } = req.body ?? {};
    const crop = typeof req.body?.crop === 'string' && req.body.crop in CROPS ? req.body.crop : undefined;
    try {
      const s = await status();
      const live = s.reachable && s.modelPresent;

      if (sample) {
        const meta = manifest.find((m) => m.id === sample);
        if (!meta) return res.status(404).json({ error: 'Unknown sample id.' });
        if (live) {
          const buf = fs.readFileSync(path.join(SAMPLES_DIR, meta.file));
          const raw = await analyze(buf.toString('base64'), { crop: meta.crop ?? undefined });
          return res.json({ source: 'live', model: MODEL(), truth: meta.truth, ...validateAnalysis(raw, { crop: meta.crop ?? undefined }) });
        }
        const rec = recorded[sample];
        if (!rec) return res.status(503).json({ error: 'No model is reachable and no recorded result exists for this sample.' });
        return res.json({ source: 'recorded', model: rec.model, recordedAt: rec.recordedAt, truth: meta.truth, ...validateAnalysis(rec.raw, { crop: rec.givenCrop }) });
      }

      if (!live) {
        return res.status(503).json({
          error: s.reachable
            ? `Ollama is running but model "${s.model}" is not pulled. Run: ollama pull ${s.model}`
            : 'No local model is reachable, so uploads cannot be analysed. Start Ollama, or try a sample image.',
          code: 'model_unavailable',
        });
      }
      const img = decodeImage(image);
      const raw = await analyze(img.base64, { crop });
      return res.json({ source: 'live', model: MODEL(), ...validateAnalysis(raw, { crop }) });
    } catch (e) {
      if (e instanceof ModelUnavailable) return res.status(503).json({ error: e.message, code: 'model_unavailable' });
      if (e instanceof BadImage) return res.status(400).json({ error: e.message });
      console.error(e);
      return res.status(500).json({ error: 'Analysis failed.' });
    }
  });

  if (fs.existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST));
    app.get(/^\/(?!api|samples).*/, (_req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')));
  }
  return app;
}
