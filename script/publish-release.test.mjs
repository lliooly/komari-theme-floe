import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { publishRelease, newerThan } from './publish-release.mjs';

function fixture(t, releases = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floe-release-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const packagePath = path.join(dir, 'package.zip');
  fs.writeFileSync(packagePath, 'test package');
  const calls = [];
  return { repository: 'lliooly/komari-theme-floe', tag: 'v0.2.0', commit: 'a'.repeat(40), packagePath, calls,
    gh(args) { calls.push(args); return args[0] === 'api' ? JSON.stringify([releases]) : ''; } };
}

test('published releases are immutable even when an old tag is rerun', t => {
  const f = fixture(t, [{ tag_name: 'v0.2.0', draft: false, assets: [{ name: 'dist-release.zip', size: 42, state: 'uploaded' }] }]);
  publishRelease(f);
  assert.equal(f.calls.length, 1);
});

test('incomplete existing releases fail closed without replacing assets', t => {
  for (const draft of [true, false]) {
    const f = fixture(t, [{ tag_name: 'v0.2.0', draft, assets: [] }]);
    assert.throws(() => publishRelease(f), /inspect it manually/);
    assert.equal(f.calls.length, 1);
  }
});

test('new release uploads as a draft before becoming public; older versions cannot take latest', t => {
  const f = fixture(t, [{ tag_name: 'v0.10.0', draft: false, prerelease: false }]);
  publishRelease(f);
  assert.ok(f.calls[1].includes('--draft'));
  assert.ok(f.calls[1].includes('--verify-tag'));
  assert.ok(f.calls[1].includes('--notes-file'));
  assert.ok(f.calls[2].includes('--draft=false'));
  assert.ok(f.calls[2].includes('--latest=false'));
  assert.equal(newerThan('v0.10.0', 'v0.2.0'), true);
});

test('a new highest stable version becomes latest', t => {
  const f = fixture(t, [{ tag_name: 'v0.1.9', draft: false, prerelease: false }]);
  publishRelease(f);
  assert.ok(f.calls[2].includes('--latest=true'));
});

test('upload failures do not publish a draft and read failures do not create a release', t => {
  const f = fixture(t);
  assert.throws(() => publishRelease({ ...f, gh(args) { if (args[0] === 'api') return '[]'; f.calls.push(args); throw new Error('upload failed'); } }), /upload failed/);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][1], 'create');
  assert.throws(() => publishRelease({ ...f, gh() { throw new Error('API unavailable'); } }), /API unavailable/);
});
