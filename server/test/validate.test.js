import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis } from '../src/validate.js';
import { responseSchema } from '../src/schema.js';
import { CROPS, conditionIds } from '../src/knowledge.js';

const ok = (over = {}) => ({
  leaf_visible: true,
  visible_signs: ['dark brown spots with concentric rings', 'yellow halo around lesions'],
  crop: 'tomato',
  condition: 'tomato.early_blight',
  confidence: 'high',
  ...over,
});

test('accepts a coherent disease call and looks advice up from the knowledge base', () => {
  const r = validateAnalysis(JSON.stringify(ok()));
  assert.equal(r.verdict, 'issue_suspected');
  assert.equal(r.condition, 'Early blight');
  assert.deepEqual(r.advice, CROPS.tomato.conditions.early_blight.advice);
  assert.ok(r.checks.every((c) => c.passed));
});

test('never reports "high" confidence for a suspected disease (self-report is not a probability)', () => {
  assert.equal(validateAnalysis(ok()).confidence, 'medium');
});

test('rejects condition that belongs to a different crop', () => {
  const r = validateAnalysis(ok({ crop: 'apple', condition: 'tomato.early_blight' }));
  assert.equal(r.verdict, 'unclear');
  assert.equal(r.confidence, 'low');
  assert.equal(r.condition, null);
  assert.equal(r.checks.find((c) => c.id === 'condition_matches_crop').passed, false);
});

test('flags a "healthy" call that cites problem signs', () => {
  const r = validateAnalysis(ok({ condition: 'healthy', visible_signs: ['brown spots on the leaf'] }));
  assert.equal(r.verdict, 'unclear');
  assert.equal(r.checks.find((c) => c.id === 'evidence_supports_claim').passed, false);
});

test('negated signs do not count against a healthy call', () => {
  const r = validateAnalysis(ok({ condition: 'healthy', confidence: 'medium', visible_signs: ['uniform green', 'no spots or lesions'] }));
  assert.equal(r.verdict, 'healthy');
  assert.equal(r.confidence, 'medium');
});

test('disease claim with evidence that does not fit is downgraded', () => {
  const r = validateAnalysis(ok({ condition: 'tomato.yellow_leaf_curl_virus', visible_signs: ['smooth glossy surface', 'even colour'] }));
  assert.equal(r.verdict, 'unclear');
  assert.equal(r.condition, null);
});

test('no leaf means not_a_plant and no condition is shown', () => {
  const r = validateAnalysis(ok({ leaf_visible: false, crop: 'other', condition: 'unclear', visible_signs: ['plain grey background'] }));
  assert.equal(r.verdict, 'not_a_plant');
  assert.equal(r.condition, null);
});

test('unsupported crop is never given a verified condition', () => {
  const r = validateAnalysis(ok({ crop: 'other', condition: 'other_issue', visible_signs: ['brown spots'] }));
  assert.equal(r.verdict, 'unclear');
  assert.equal(r.crop, null);
});

test('malformed JSON, wrong types and out-of-vocabulary values all fail closed', () => {
  for (const bad of ['not json', '{}', JSON.stringify(ok({ crop: 'banana' })), JSON.stringify(ok({ condition: 'tomato.made_up' })), JSON.stringify(ok({ confidence: 'certain' })), JSON.stringify(ok({ visible_signs: 'spots' }))]) {
    const r = validateAnalysis(bad);
    assert.equal(r.verdict, 'unclear', bad);
    assert.equal(r.confidence, 'low');
    assert.equal(r.checks[0].passed, false);
  }
});

test('every result carries the not-agronomic-advice disclaimer', () => {
  for (const raw of [JSON.stringify(ok()), 'garbage']) {
    assert.match(validateAnalysis(raw).disclaimer, /not agronomic advice/);
  }
});

test('response schema enumerates exactly the knowledge-base conditions', () => {
  const s = responseSchema();
  assert.deepEqual(s.properties.condition.enum, conditionIds());
  assert.equal(s.additionalProperties, false);
  assert.equal(s.required.length, 6);
});

test('every disease in the knowledge base has advice and keywords', () => {
  for (const c of Object.values(CROPS)) {
    for (const d of Object.values(c.conditions)) {
      assert.ok(d.advice.length >= 2 && d.keywords.length >= 3, d.name);
    }
  }
});
