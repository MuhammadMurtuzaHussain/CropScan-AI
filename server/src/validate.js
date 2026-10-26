import { CROPS, PROBLEM_WORDS, NEGATION, DISCLAIMER, GENERIC_UNCLEAR_ADVICE, conditionIds, cropIds } from './knowledge.js';

const CONF = ['low', 'medium', 'high'];

/**
 * Code-side check of what the model claimed. The model's output is treated as
 * untrusted: it must parse, stay inside the allowed vocabulary, agree with
 * itself, and cite evidence that fits the condition it names. Anything that
 * fails lowers the confidence and is reported in `checks`. Advice never comes
 * from the model; it is looked up from the knowledge base.
 */
export function validateAnalysis(raw, { crop: givenCrop } = {}) {
  const checks = [];
  const add = (id, passed, note) => checks.push({ id, passed, note });

  // 1. Shape
  let a = raw;
  if (typeof raw === 'string') {
    try { a = JSON.parse(raw); } catch { a = null; }
  }
  if (givenCrop && a && typeof a === 'object' && a.crop === undefined) a = { ...a, crop: givenCrop };
  const shapeOk =
    a && typeof a === 'object' &&
    typeof a.leaf_visible === 'boolean' &&
    Array.isArray(a.visible_signs) && a.visible_signs.every((s) => typeof s === 'string') &&
    (a.plant === undefined || typeof a.plant === 'string') &&
    cropIds().includes(a.crop) &&
    conditionIds().includes(a.condition) &&
    CONF.includes(a.confidence);
  add('schema', !!shapeOk, shapeOk ? 'Model output matches the schema.' : 'Model output was malformed or used values outside the allowed list.');
  if (!shapeOk) return finish({ givenCrop, verdict: 'unclear', confidence: 'low', claim: null, checks });

  const signs = a.visible_signs.map((s) => s.trim()).filter(Boolean).slice(0, 4);
  let confidence = a.confidence;
  let verdict;

  // 2. Is there a leaf at all?
  if (!a.leaf_visible) {
    add('leaf_present', true, 'Model reports no crop leaf in the photo.');
    return finish({ givenCrop, verdict: 'not_a_plant', confidence: 'low', claim: { crop: a.crop, condition: a.condition, signs }, checks });
  }
  add('leaf_present', true, 'A leaf is the subject of the photo.');

  // 3. Crop is one we cover (and, if the grower named one, the model stayed on it)
  const cropKnown = a.crop in CROPS;
  if (givenCrop && a.crop !== givenCrop) add('crop_as_given', false, `Model answered for "${a.crop}" but the grower said "${givenCrop}".`);
  add('crop_supported', cropKnown, cropKnown ? `Crop "${CROPS[a.crop].name}" is covered.` : 'Crop is outside the supported set, so no condition is verified.');

  // 4. Condition belongs to the crop
  let conditionOk = true;
  if (a.condition.includes('.')) {
    const [c, cond] = a.condition.split('.');
    conditionOk = c === a.crop && !!CROPS[c]?.conditions[cond];
    add('condition_matches_crop', conditionOk, conditionOk ? 'Condition belongs to the named crop.' : `Condition "${a.condition}" does not belong to crop "${a.crop}".`);
  }

  // 5. Evidence fits the claim
  const positive = signs.filter((s) => !NEGATION.test(s));
  let evidenceOk = true;
  if (a.condition === 'healthy') {
    const bad = positive.filter((s) => PROBLEM_WORDS.some((w) => s.toLowerCase().includes(w)));
    evidenceOk = bad.length === 0;
    add('evidence_supports_claim', evidenceOk, evidenceOk ? 'No problem signs cited against a healthy call.' : `Called healthy but cited: "${bad[0]}".`);
  } else if (a.condition.includes('.') && conditionOk && cropKnown) {
    const kws = CROPS[a.crop].conditions[a.condition.split('.')[1]].keywords;
    const hit = positive.some((s) => kws.some((k) => s.toLowerCase().includes(k)));
    evidenceOk = hit;
    add('evidence_supports_claim', hit, hit ? 'Cited signs are consistent with the named disease.' : 'None of the cited signs fit the named disease.');
  } else if (a.condition === 'other_issue') {
    evidenceOk = positive.length > 0;
    add('evidence_supports_claim', evidenceOk, evidenceOk ? 'Signs cited for an unlisted problem.' : 'Reported a problem without citing any sign.');
  }

  const failed = checks.some((c) => !c.passed && c.id !== 'crop_supported');

  // 6. Verdict and confidence
  if (a.condition === 'unclear' || !conditionOk || checks.some((c) => c.id === 'crop_as_given' && !c.passed)) verdict = 'unclear';
  else if (a.condition === 'healthy') verdict = evidenceOk ? 'healthy' : 'unclear';
  else if (!cropKnown) verdict = 'unclear'; // never name a disease for a crop we do not cover
  else verdict = evidenceOk ? 'issue_suspected' : 'unclear';

  if (failed || verdict === 'unclear') confidence = 'low';
  else if (!cropKnown) confidence = confidence === 'high' ? 'medium' : confidence;
  else if (signs.length < 2 && confidence === 'high') confidence = 'medium';
  // The model's own confidence is a self-report, not a probability. Cap "high" for diseases.
  if (verdict === 'issue_suspected' && confidence === 'high') confidence = 'medium';
  add('confidence_adjusted', true, confidence === a.confidence ? 'Model confidence kept.' : `Model said "${a.confidence}", reported as "${confidence}".`);

  return finish({ givenCrop, verdict, confidence, claim: { crop: a.crop, condition: a.condition, signs }, checks });
}

function finish({ givenCrop, verdict, confidence, claim, checks }) {
  let conditionName = null;
  let advice = GENERIC_UNCLEAR_ADVICE;
  if (verdict === 'issue_suspected' && claim) {
    if (claim.condition === 'other_issue') {
      conditionName = 'A problem not on the list';
      advice = ['Something looks off, but it does not match a disease this app knows.', ...GENERIC_UNCLEAR_ADVICE];
    } else {
      const [c, cond] = claim.condition.split('.');
      conditionName = CROPS[c].conditions[cond].name;
      advice = CROPS[c].conditions[cond].advice;
    }
  } else if (verdict === 'healthy') {
    advice = ['No visible signs of disease in this photo. Keep scouting regularly; early symptoms are easy to miss.'];
  }
  return {
    verdict,
    confidence,
    crop: claim && claim.crop in CROPS ? CROPS[claim.crop].name : null,
    cropSource: givenCrop ? 'grower' : 'model',
    cropId: claim?.crop ?? null,
    conditionId: claim?.condition ?? null,
    condition: conditionName,
    signs: claim?.signs ?? [],
    advice,
    checks,
    disclaimer: DISCLAIMER,
  };
}
