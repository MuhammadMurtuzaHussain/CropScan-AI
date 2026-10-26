export const VERDICTS = {
  healthy: { label: 'No visible disease signs', tone: 'good' },
  issue_suspected: { label: 'Possible problem', tone: 'warn' },
  unclear: { label: "Can't tell from this photo", tone: 'muted' },
  not_a_plant: { label: 'No crop leaf found', tone: 'muted' },
};

export function verdictView(result) {
  const v = VERDICTS[result?.verdict] ?? VERDICTS.unclear;
  const headline = result?.verdict === 'issue_suspected' && result.condition
    ? `${v.label}: ${result.condition}${result.crop ? ` on ${result.crop.toLowerCase()}` : ''}`
    : result?.verdict === 'healthy' && result.crop
      ? `${result.crop}: ${v.label.toLowerCase()}`
      : v.label;
  return { tone: v.tone, headline };
}

/** Did the validated verdict agree with the sample's ground-truth label? Null when unlabelled. */
export function matchesTruth(result, truth) {
  if (!truth) return null;
  if (truth === 'not_a_plant') return result.verdict === 'not_a_plant';
  if (truth.endsWith('.healthy')) return result.verdict === 'healthy' && result.cropId === truth.split('.')[0];
  return result.verdict === 'issue_suspected' && result.conditionId === truth;
}

/** Decide how the app talks to a backend. `health` is the /api/health body or null if unreachable. */
export function resolveMode(health) {
  if (!health) return 'static';
  return health.mode === 'live' ? 'live' : 'recorded';
}

export const MODE_COPY = {
  live: { badge: 'Live: local Gemma', note: 'Photos are analysed by an open-weight model running on this machine. Nothing leaves it.' },
  recorded: { badge: 'Recorded run', note: 'No local model is reachable, so sample images replay results recorded from a real model run. Uploads are disabled.' },
  static: { badge: 'Recorded run', note: 'This hosted demo has no model behind it, so sample images replay results recorded from a real Gemma run. Run it locally to analyse your own photos.' },
};
