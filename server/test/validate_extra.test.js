import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis } from '../src/validate.js';
import { responseSchema, buildPrompt } from '../src/schema.js';

const base = { leaf_visible: true, visible_signs: ['brown spots with rings'], condition: 'tomato.early_blight', confidence: 'medium' };

test('grower-supplied crop is injected and shown as grower-sourced', () => {
  const r = validateAnalysis(JSON.stringify(base), { crop: 'tomato' });
  assert.equal(r.verdict, 'issue_suspected');
  assert.equal(r.cropSource, 'grower');
  assert.equal(r.crop, 'Tomato');
});

test('model answering for a different crop than the grower named is rejected', () => {
  const r = validateAnalysis(JSON.stringify({ ...base, crop: 'apple', condition: 'apple.apple_scab', visible_signs: ['dark scabby patches'] }), { crop: 'tomato' });
  assert.equal(r.verdict, 'unclear');
  assert.equal(r.checks.find((c) => c.id === 'crop_as_given').passed, false);
});

test('"other_issue" on a known crop is reported as an unlisted problem, not a crash', () => {
  const r = validateAnalysis(JSON.stringify({ ...base, condition: 'other_issue', visible_signs: ['brown patches'] }), { crop: 'grape' });
  assert.equal(r.verdict, 'issue_suspected');
  assert.equal(r.condition, 'A problem not on the list');
  assert.equal(r.confidence, 'medium');
});

test('healthy on an unsupported crop is allowed but never reported high confidence', () => {
  const r = validateAnalysis(JSON.stringify({ leaf_visible: true, plant: 'basil', visible_signs: ['uniform green'], crop: 'other', condition: 'healthy', confidence: 'high' }));
  assert.equal(r.verdict, 'healthy');
  assert.equal(r.confidence, 'medium');
});

test('with a crop given, the schema offers only that crop\'s conditions', () => {
  const s = responseSchema({ crop: 'potato' });
  assert.deepEqual(s.properties.condition.enum, ['healthy', 'potato.early_blight', 'potato.late_blight', 'other_issue', 'unclear']);
  assert.ok(!('crop' in s.properties));
  assert.match(buildPrompt({ crop: 'potato' }), /Potato leaf/);
  assert.ok('crop' in responseSchema().properties);
});
