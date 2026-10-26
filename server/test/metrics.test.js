import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMetrics, isCorrect, rawVerdict } from '../eval/metrics.js';

const raw = (o) => JSON.stringify({ leaf_visible: true, visible_signs: ['brown spots with rings', 'yellow halo'], crop: 'tomato', condition: 'tomato.early_blight', confidence: 'medium', ...o });

test('isCorrect handles disease, healthy-by-crop and background truths', () => {
  assert.ok(isCorrect({ verdict: 'issue_suspected', conditionId: 'tomato.early_blight' }, 'tomato.early_blight'));
  assert.ok(!isCorrect({ verdict: 'healthy', cropId: 'apple' }, 'tomato.healthy'));
  assert.ok(isCorrect({ verdict: 'not_a_plant' }, 'not_a_plant'));
});

test('rawVerdict reads the claim without validating it', () => {
  assert.equal(rawVerdict(raw({ crop: 'apple' })).verdict, 'issue_suspected');
  assert.equal(rawVerdict('nope').verdict, 'unclear');
});

test('metrics: validator turns a wrong-crop disease claim into an abstention', () => {
  // Model blames a tomato disease on an apple: raw says "problem", validator says "unclear".
  const results = [
    { truth: 'tomato.early_blight', raw: raw({}), ms: 100 },
    { truth: 'apple.healthy', raw: raw({ crop: 'apple' }), ms: 300 },
    { truth: 'not_a_plant', raw: raw({ leaf_visible: false, crop: 'other', condition: 'unclear' }), ms: 200 },
  ];
  const m = computeMetrics(results);
  assert.equal(m.n, 3);
  assert.equal(m.healthyVsProblemWrong.raw, 1);
  assert.equal(m.healthyVsProblemWrong.validated, 0);
  assert.equal(m.abstained.validated, 1);
  assert.equal(m.diseaseNamedRight.validated, 1);
  assert.equal(m.backgroundRejected, 100);
  assert.equal(m.validatorChanged, 1);
  assert.equal(m.latencyMs.median, 200);
});

test('metrics: other_issue counts as flagging a problem but not as naming a disease', () => {
  const m = computeMetrics([{ truth: 'tomato.early_blight', raw: raw({ condition: 'other_issue' }), givenCrop: 'tomato', ms: 1 }]);
  assert.equal(m.healthyVsProblemRight.validated, 100);
  assert.equal(m.diseaseNamed.validated, 0);
});
