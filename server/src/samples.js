import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SAMPLES_DIR = path.resolve(here, '../../samples');
export const RECORDED_FILE = path.resolve(here, '../eval/results.json');

export function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(path.join(SAMPLES_DIR, 'manifest.json'), 'utf8'));
  } catch {
    return [];
  }
}

/** Raw model outputs saved by `npm run eval`, keyed by sample id. Served in demo mode with no model. */
export function loadRecorded() {
  try {
    const { results } = JSON.parse(fs.readFileSync(RECORDED_FILE, 'utf8'));
    // Samples replay the grower-supplied-crop run when there is one (that is how the app is meant to be used).
    const byId = {};
    for (const r of results) if (!byId[r.id] || r.mode === 'given') byId[r.id] = r;
    return byId;
  } catch {
    return {};
  }
}
