import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { syncLocales, translate } from './i18n-sync.mjs';

function fixture(t, source = { greeting: '你好 {{name}}' }, target = { greeting: 'Hello {{name}}' }) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'floe-i18n-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const snapshot = path.join(directory, 'snapshot');
  const put = (file, value) => fs.writeFileSync(path.join(directory, file), JSON.stringify(value));
  put('zh_CN.json', source); put('en.json', target); put('snapshot', source);
  const contents = () => Object.fromEntries(fs.readdirSync(directory).map(file => [file, fs.readFileSync(path.join(directory, file), 'utf8')]));
  return { directory, snapshot, put, contents };
}
const config = { apiKey: 'test-only', baseUrl: 'https://invalid.example/v1', model: 'mock', source: 'zh_CN', timeoutMs: 50 };
const answer = object => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(object) } }] }), { status: 200 });

test('malformed or empty source and malformed later target never delete translations', async t => {
  for (const invalid of ['{invalid', '{}', '[]', '{"a": 1}', '{"__proto__":{"polluted":"x"}}']) {
    const f = fixture(t);
    fs.writeFileSync(path.join(f.directory, 'zh_CN.json'), invalid);
    const before = f.contents();
    await assert.rejects(syncLocales(f));
    assert.deepEqual(f.contents(), before);
  }
  const f = fixture(t);
  fs.writeFileSync(path.join(f.directory, 'zh_TW.json'), '{broken');
  const before = f.contents();
  await assert.rejects(syncLocales(f));
  assert.deepEqual(f.contents(), before);
});

test('dry-run reports changed source strings without network or file writes', async t => {
  const f = fixture(t);
  f.put('zh_CN.json', { greeting: '欢迎 {{name}}' });
  const before = f.contents();
  const result = await syncLocales({ ...f, dryRun: true, config, request: () => assert.fail('dry-run called API') });
  assert.equal(result.needsAI, true);
  assert.deepEqual(result.locales[0].pending, ['greeting']);
  assert.deepEqual(f.contents(), before);
});

test('changed source is translated, snapshot advances, and second run is a no-op', async t => {
  const f = fixture(t, { z: '最后', greeting: '你好 {{name}}' }, { z: 'Last', greeting: 'Hello {{name}}' });
  f.put('zh_CN.json', { z: '最后', greeting: '欢迎 {{name}}' });
  let requests = 0;
  await syncLocales({ ...f, config, request: async () => { requests++; return answer({ greeting: 'Welcome {{name}}' }); } });
  assert.equal(requests, 1);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.directory, 'en.json'))).greeting, 'Welcome {{name}}');
  const result = await syncLocales({ ...f, check: true, request: () => assert.fail('no-op called API') });
  assert.equal(result.changed, false);
});

test('failed later locale or broken placeholders leave all files unchanged', async t => {
  const f = fixture(t);
  f.put('zh_TW.json', { greeting: '你好 {{name}}' });
  f.put('zh_CN.json', { greeting: '欢迎 {{name}}' });
  const before = f.contents();
  let requests = 0;
  await assert.rejects(syncLocales({ ...f, config, request: async () => ++requests === 1 ? answer({ greeting: 'Welcome {{name}}' }) : answer({ greeting: '歡迎' }) }), /Placeholder mismatch/);
  assert.deepEqual(f.contents(), before);
});

test('strict check detects drift, validation tolerates pending source updates, and no-ai cannot partially sync', async t => {
  const f = fixture(t);
  f.put('zh_CN.json', { greeting: '你好 {{name}}', new: '新增' });
  const before = f.contents();
  await syncLocales({ ...f, validateOnly: true });
  await assert.rejects(syncLocales({ ...f, check: true }), /not synchronized/);
  await assert.rejects(syncLocales({ ...f, noAI: true }), /partial changes/);
  await assert.rejects(syncLocales(f), /OPENAI_API_KEY/);
  assert.deepEqual(f.contents(), before);
});

test('validation rejects placeholder drift in an unchanged translation', async t => {
  const f = fixture(t, undefined, { greeting: 'Hello {name}' });
  await assert.rejects(syncLocales({ ...f, validateOnly: true }), /Placeholder mismatch/);
});

test('permanent API failures stop immediately; transient failures have bounded retries', async () => {
  let attempts = 0;
  const waits = [];
  await assert.rejects(translate([['a', '甲']], 'en', config, async () => { attempts++; return new Response('', { status: 401 }); }), /HTTP 401/);
  assert.equal(attempts, 1);
  attempts = 0;
  await assert.rejects(translate([['a', '甲']], 'en', config, async () => { attempts++; return new Response('', { status: 429, headers: { 'retry-after': '999999' } }); }, async delay => waits.push(delay)), /HTTP 429/);
  assert.equal(attempts, 3);
  assert.deepEqual(waits, [30000, 30000]);
});

test('request signal times out slow response bodies and leaves source unchanged', async t => {
  const f = fixture(t);
  f.put('zh_CN.json', { greeting: '欢迎 {{name}}' });
  const before = f.contents();
  await assert.rejects(syncLocales({ ...f, config: { ...config, timeoutMs: 5 }, request: async (_url, { signal }) => ({
    ok: true,
    json: () => new Promise((resolve, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('timeout signal did not fire')), 200);
      signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(signal.reason); }, { once: true });
    }),
  }) }), /timeout/i);
  assert.deepEqual(f.contents(), before);
});

test('unknown AI output keys and invalid batch limits fail without writes', async t => {
  const f = fixture(t);
  f.put('zh_CN.json', { greeting: '欢迎 {{name}}' });
  const before = f.contents();
  await assert.rejects(syncLocales({ ...f, config: { ...config, batchSize: 0 } }), /positive integer/);
  await assert.rejects(syncLocales({ ...f, config, request: async () => answer({ unexpected: 'value' }) }), /Unexpected translation keys/);
  assert.deepEqual(f.contents(), before);
});
