import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

// Execute the actual privileged workflow shell against a local GitHub CLI fake.
// The fake never uses credentials or contacts GitHub.
const workflow = fs.readFileSync(new URL('../.github/workflows/dependabot-auto-merge.yml', import.meta.url), 'utf8');
const policy = workflow.split('        run: |\n')[1].split('\n').map(line => line.slice(10)).join('\n');
const head = 'a'.repeat(40);
const review = (state, id = 1, user = 7, commit = head) => ({ state, id, user: { id: user }, commit_id: commit, submitted_at: `2026-09-09T00:00:${String(id).padStart(2, '0')}Z` });

function runPolicy(t, scenario = {}, type = 'version-update:semver-patch') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'floe-automerge-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'scenario.json'), JSON.stringify(scenario));
  fs.writeFileSync(path.join(dir, 'gh'), `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const dir = process.env.MOCK_GH_DIR;
const s = JSON.parse(fs.readFileSync(path.join(dir,'scenario.json')));
const args = process.argv.slice(2);
fs.appendFileSync(path.join(dir,'calls'),JSON.stringify(args)+'\\n');
const out = value => console.log(JSON.stringify(value));
if (s.apiError) { process.stderr.write('API unavailable'); process.exit(1); }
if (args[0] === 'pr' && args[1] === 'view') {
  const counter = path.join(dir,'views');
  const n = fs.existsSync(counter) ? Number(fs.readFileSync(counter)) : 0;
  fs.writeFileSync(counter,String(n+1));
  out({state:'OPEN',isDraft:false,author:{login:'app/dependabot',is_bot:true},headRefOid:s.stale && n > 0 ? 'b'.repeat(40) : '${head}',baseRefName:'main',isCrossRepository:false,reviewDecision:null,autoMergeRequest:s.autoEnabled ? {} : null,...s.pr});
} else if (args[0] === 'pr' && args[1] === 'merge') {
  out({});
} else if (args.includes('POST')) {
  out({});
} else if (args.some(a=>a.includes('/reviews?'))) {
  const counter=path.join(dir,'reviews');
  const n=fs.existsSync(counter)?Number(fs.readFileSync(counter)):0;
  fs.writeFileSync(counter,String(n+1));
  out([[],s.lateReviews && n>0 ? s.lateReviews : (s.reviews || [])]);
} else if (args.some(a=>a.includes('/rules/branches/'))) {
  out(s.rules || [{type:'required_status_checks',parameters:{required_status_checks:[{context:'build',integration_id:15368}]}}]);
} else if (args.includes('repos/lliooly/komari-theme-floe')) {
  out({allow_auto_merge:true,allow_merge_commit:true,...s.repository});
} else { process.stderr.write('Unexpected fake gh call: '+JSON.stringify(args)); process.exit(2); }
`, { mode: 0o755 });
  const result = spawnSync('bash', ['-c', policy], { encoding: 'utf8', env: {
    ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}`, MOCK_GH_DIR: dir,
    GH_TOKEN: '', GH_REPO: 'lliooly/komari-theme-floe', PR_NUMBER: '16', EXPECTED_HEAD: head, UPDATE_TYPE: type,
  } });
  const callsFile = path.join(dir, 'calls');
  const calls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf8').trim().split('\n').map(JSON.parse) : [];
  return { ...result, calls, writes: calls.filter(args => args.includes('POST') || args[1] === 'merge') };
}

test('patch/minor approve the evaluated commit and enable guarded auto-merge', t => {
  for (const type of ['version-update:semver-patch', 'version-update:semver-minor']) {
    const result = runPolicy(t, {}, type);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.writes.length, 2);
    assert.ok(result.writes[0].includes(`commit_id=${head}`));
    assert.ok(result.writes[1].includes('--auto'));
    assert.ok(result.writes[1].includes('--match-head-commit'));
    assert.ok(result.writes[1].includes(head));
  }
});

test('major and unknown metadata never call GitHub', t => {
  for (const type of ['version-update:semver-major', '', 'security-update']) {
    const result = runPolicy(t, {}, type);
    assert.equal(result.status, 0);
    assert.equal(result.calls.length, 0);
  }
});

test('human change requests block automation even after a comment or during the final recheck', t => {
  for (const scenario of [
    { reviews: [review('CHANGES_REQUESTED'), review('COMMENTED', 2)] },
    { reviews: [review('APPROVED')], lateReviews: [review('CHANGES_REQUESTED', 2, 8)] },
  ]) {
    const result = runPolicy(t, scenario);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.writes.length, 0);
  }
});

test('dismissed change requests no longer block and current approval/auto-merge are idempotent', t => {
  const result = runPolicy(t, { reviews: [review('CHANGES_REQUESTED'), review('DISMISSED', 2), review('APPROVED', 3)], autoEnabled: true });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.writes.length, 0);
});

test('drafts, humans, foreign bases, fork PRs and changed heads are rejected', t => {
  for (const scenario of [
    { pr: { isDraft: true } }, { pr: { author: { login: 'human', is_bot: false } } },
    { pr: { baseRefName: 'other' } }, { pr: { isCrossRepository: true } },
    { pr: { headRefOid: 'b'.repeat(40) } }, { stale: true },
  ]) {
    const result = runPolicy(t, scenario);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.writes.length, 0);
  }
});

test('missing required checks, wrong check provider, merge queue and disabled auto-merge fail closed', t => {
  const check = { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'build', integration_id: 15368 }] } };
  for (const scenario of [
    { rules: [] }, { rules: [{ ...check, parameters: { required_status_checks: [{ context: 'build', integration_id: 1 }] } }] },
    { rules: [check, { type: 'merge_queue' }] }, { repository: { allow_auto_merge: false } }, { apiError: true },
  ]) {
    const result = runPolicy(t, scenario);
    assert.notEqual(result.status, 0);
    assert.equal(result.writes.length, 0);
  }
});
