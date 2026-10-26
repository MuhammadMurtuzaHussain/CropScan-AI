import { validateAnalysis } from '../src/validate.js';

/** The model's claim taken at face value, with no code-side checks. The baseline the validator is compared to. */
export function rawVerdict(raw, givenCrop) {
  let a;
  try { a = JSON.parse(raw); } catch { return { verdict: 'unclear', conditionId: null, cropId: null }; }
  if (!a || a.leaf_visible === false) return { verdict: 'not_a_plant', conditionId: null, cropId: null };
  const cropId = a.crop ?? givenCrop ?? null;
  if (a.condition === 'healthy') return { verdict: 'healthy', conditionId: 'healthy', cropId };
  if (a.condition === 'unclear' || typeof a.condition !== 'string') return { verdict: 'unclear', conditionId: null, cropId };
  return { verdict: 'issue_suspected', conditionId: a.condition, cropId };
}

/** Is a verdict exactly right for a ground-truth label ("tomato.late_blight", "potato.healthy", "not_a_plant")? */
export function isCorrect(v, truth) {
  if (truth === 'not_a_plant') return v.verdict === 'not_a_plant';
  if (truth.endsWith('.healthy')) return v.verdict === 'healthy' && v.cropId === truth.split('.')[0];
  return v.verdict === 'issue_suspected' && v.conditionId === truth;
}

const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : null);
const pctile = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

// Healthy-vs-problem only: ignores which disease and which crop.
const binaryRight = (v, healthy) => (healthy ? v.verdict === 'healthy' : v.verdict === 'issue_suspected');
const binaryWrong = (v, healthy) => (healthy ? v.verdict === 'issue_suspected' : v.verdict === 'healthy');
const named = (v) => v.verdict === 'issue_suspected' && v.conditionId && v.conditionId !== 'other_issue';

export function computeMetrics(results) {
  const rows = results.map((r) => {
    const raw = rawVerdict(r.raw, r.givenCrop);
    const val = validateAnalysis(r.raw, { crop: r.givenCrop });
    const v = { verdict: val.verdict, conditionId: ['healthy', 'issue_suspected'].includes(val.verdict) ? val.conditionId : null, cropId: val.cropId };
    const leaf = r.truth !== 'not_a_plant';
    const healthy = r.truth.endsWith('.healthy');
    return {
      truth: r.truth, ms: r.ms, leaf, healthy,
      rawCorrect: isCorrect(raw, r.truth), valCorrect: isCorrect(v, r.truth),
      rawBinRight: leaf && binaryRight(raw, healthy), valBinRight: leaf && binaryRight(v, healthy),
      rawBinWrong: leaf && binaryWrong(raw, healthy), valBinWrong: leaf && binaryWrong(v, healthy),
      rawAbstain: raw.verdict === 'unclear', valAbstain: v.verdict === 'unclear',
      rawNamed: named(raw), valNamed: named(v),
      rawNamedRight: named(raw) && raw.conditionId === r.truth, valNamedRight: named(v) && v.conditionId === r.truth,
      cropCorrect: leaf && v.cropId === r.truth.split('.')[0],
      changed: raw.verdict !== v.verdict || raw.conditionId !== v.conditionId,
    };
  });
  const leafRows = rows.filter((r) => r.leaf);
  const dis = leafRows.filter((r) => !r.healthy);
  const hl = rows.filter((r) => r.healthy);
  const bg = rows.filter((r) => !r.leaf);
  const count = (xs, k) => xs.filter((r) => r[k]).length;
  return {
    n: rows.length, leafImages: leafRows.length, healthyImages: hl.length, diseasedImages: dis.length, backgroundImages: bg.length,
    healthyVsProblemRight: { raw: pct(count(leafRows, 'rawBinRight'), leafRows.length), validated: pct(count(leafRows, 'valBinRight'), leafRows.length) },
    healthyVsProblemWrong: { raw: count(leafRows, 'rawBinWrong'), validated: count(leafRows, 'valBinWrong') },
    abstained: { raw: count(rows, 'rawAbstain'), validated: count(rows, 'valAbstain') },
    diseaseNamed: { raw: count(rows, 'rawNamed'), validated: count(rows, 'valNamed') },
    diseaseNamedRight: { raw: count(rows, 'rawNamedRight'), validated: count(rows, 'valNamedRight') },
    diseaseNamedPrecision: { raw: pct(count(rows, 'rawNamedRight'), count(rows, 'rawNamed')), validated: pct(count(rows, 'valNamedRight'), count(rows, 'valNamed')) },
    diseaseExactRecall: pct(count(dis, 'valNamedRight'), dis.length),
    healthyCorrect: pct(count(hl, 'valCorrect'), hl.length),
    backgroundRejected: pct(count(bg, 'valCorrect'), bg.length),
    cropIdentified: pct(count(leafRows, 'cropCorrect'), leafRows.length),
    validatorChanged: count(rows, 'changed'),
    exactCorrect: { raw: pct(count(rows, 'rawCorrect'), rows.length), validated: pct(count(rows, 'valCorrect'), rows.length) },
    latencyMs: { median: pctile(rows.map((r) => r.ms), 0.5), p95: pctile(rows.map((r) => r.ms), 0.95) },
    perClass: Object.fromEntries([...new Set(rows.map((r) => r.truth))].sort().map((t) => {
      const g = rows.filter((r) => r.truth === t);
      return [t, `${count(g, 'valCorrect')}/${g.length}`];
    })),
    rows,
  };
}
