import { test, expect } from 'vitest';
import { verdictView, matchesTruth, resolveMode } from './lib.js';

test('headline names the disease and crop for a suspected issue', () => {
  expect(verdictView({ verdict: 'issue_suspected', condition: 'Early blight', crop: 'Tomato' }).headline).toBe('Possible problem: Early blight on tomato');
});

test('unclear and not-a-plant never get a disease headline', () => {
  expect(verdictView({ verdict: 'unclear', condition: null }).tone).toBe('muted');
  expect(verdictView({ verdict: 'not_a_plant' }).headline).toBe('No crop leaf found');
  expect(verdictView(undefined).headline).toBe("Can't tell from this photo");
});

test('matchesTruth compares disease ids, healthy by crop, and background', () => {
  expect(matchesTruth({ verdict: 'issue_suspected', conditionId: 'tomato.late_blight' }, 'tomato.late_blight')).toBe(true);
  expect(matchesTruth({ verdict: 'issue_suspected', conditionId: 'tomato.early_blight' }, 'tomato.late_blight')).toBe(false);
  expect(matchesTruth({ verdict: 'healthy', cropId: 'potato' }, 'potato.healthy')).toBe(true);
  expect(matchesTruth({ verdict: 'healthy', cropId: 'tomato' }, 'potato.healthy')).toBe(false);
  expect(matchesTruth({ verdict: 'not_a_plant' }, 'not_a_plant')).toBe(true);
  expect(matchesTruth({ verdict: 'healthy' }, null)).toBeNull();
});

test('resolveMode', () => {
  expect(resolveMode(null)).toBe('static');
  expect(resolveMode({ mode: 'live' })).toBe('live');
  expect(resolveMode({ mode: 'recorded' })).toBe('recorded');
});
