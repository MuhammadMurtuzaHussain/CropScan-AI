import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { sniffImage } from '../src/image.js';

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]).toString('base64');
const good = JSON.stringify({ leaf_visible: true, visible_signs: ['uniform green', 'no spots'], crop: 'potato', condition: 'healthy', confidence: 'medium' });
const manifest = [{ id: 's1', file: 's1.jpg', truth: 'potato.healthy', crop: 'potato', source: 'test' }];

async function withServer(deps, fn) {
  const server = createApp(deps).listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); }
}
const post = (base, body) => fetch(`${base}/api/analyze`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const live = () => ({ reachable: true, modelPresent: true, model: 'm' });
const down = () => ({ reachable: false, modelPresent: false, model: 'm' });

test('live upload returns a validated analysis', async () => {
  await withServer({ analyze: async () => good, status: live, manifest, recorded: {} }, async (base) => {
    const r = await post(base, { image: JPEG });
    const j = await r.json();
    assert.equal(r.status, 200);
    assert.equal(j.source, 'live');
    assert.equal(j.verdict, 'healthy');
    assert.match(j.disclaimer, /not agronomic advice/);
  });
});

test('model output that breaks the rules is downgraded, not passed through', async () => {
  const lie = JSON.stringify({ leaf_visible: true, visible_signs: ['spots'], crop: 'apple', condition: 'tomato.late_blight', confidence: 'high' });
  await withServer({ analyze: async () => lie, status: live, manifest, recorded: {} }, async (base) => {
    const j = await (await post(base, { image: JPEG })).json();
    assert.equal(j.verdict, 'unclear');
    assert.equal(j.confidence, 'low');
  });
});

test('rejects non-images and bad base64 with 400', async () => {
  await withServer({ analyze: async () => good, status: live, manifest, recorded: {} }, async (base) => {
    assert.equal((await post(base, { image: Buffer.from('hello world').toString('base64') })).status, 400);
    assert.equal((await post(base, { image: '!!!' })).status, 400);
    assert.equal((await post(base, {})).status, 400);
  });
});

test('no model: uploads get 503 with a helpful message', async () => {
  await withServer({ analyze: async () => good, status: down, manifest, recorded: {} }, async (base) => {
    const r = await post(base, { image: JPEG });
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /Ollama|model/);
  });
});

test('no model: samples replay recorded output, re-validated and labelled as recorded', async () => {
  const recorded = { s1: { raw: good, model: 'gemma4:e4b', recordedAt: '2026-10-26' } };
  await withServer({ analyze: async () => assert.fail('must not call the model'), status: down, manifest, recorded }, async (base) => {
    const j = await (await post(base, { sample: 's1' })).json();
    assert.equal(j.source, 'recorded');
    assert.equal(j.verdict, 'healthy');
    assert.equal(j.truth, 'potato.healthy');
    const h = await (await fetch(`${base}/api/health`)).json();
    assert.equal(h.mode, 'recorded');
  });
});

test('unknown sample id is 404', async () => {
  await withServer({ status: down, manifest, recorded: {} }, async (base) => {
    assert.equal((await post(base, { sample: 'nope' })).status, 404);
  });
});

test('sniffImage identifies formats by magic bytes', () => {
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.equal(sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), 'png');
  assert.equal(sniffImage(Buffer.from('RIFF0000WEBPVP8 ')), 'webp');
  assert.equal(sniffImage(Buffer.from('GIF89a......')), null);
});
