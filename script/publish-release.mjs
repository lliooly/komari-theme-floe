#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function versionParts(tag) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) throw new Error(`Invalid release tag: ${tag}`);
  return tag.slice(1).split('.').map(BigInt);
}

export function newerThan(left, right) {
  const a = versionParts(left), b = versionParts(right);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function publishRelease({ repository, tag, commit, packagePath = 'release-assets/dist-release.zip', gh = args => execFileSync('gh', args, { encoding: 'utf8' }) }) {
  versionParts(tag);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^[0-9a-f]{40}$/.test(commit)) throw new Error('Invalid repository or commit');
  const releases = JSON.parse(gh(['api', '--paginate', '--slurp', `repos/${repository}/releases?per_page=100`])).flat();
  const existing = releases.find(release => release.tag_name === tag);
  if (existing) {
    if (!existing.draft && existing.assets.some(asset => asset.name === 'dist-release.zip' && asset.size > 0 && asset.state === 'uploaded')) {
      console.log(`${tag} is already published. Keeping its assets, notes and latest status unchanged.`);
      return;
    }
    throw new Error(`${tag} already exists as a draft or incomplete release; inspect it manually. No assets were replaced.`);
  }
  const latest = !releases.some(release => !release.draft && !release.prerelease &&
    /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(release.tag_name) && newerThan(release.tag_name, tag));
  const sha256 = createHash('sha256').update(fs.readFileSync(packagePath)).digest('hex');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'floe-release-'));
  const notes = path.join(directory, 'notes.md');
  fs.writeFileSync(notes, `Floe ${tag.slice(1)} theme package.\n\nSHA-256: \`${sha256}\`\n\nBuilt from commit ${commit}.\n`);
  try {
    // An upload error leaves an inspectable draft, never a public partial release.
    gh(['release', 'create', tag, packagePath, '--repo', repository, '--verify-tag', '--draft', '--title', `Floe ${tag.slice(1)}`, '--notes-file', notes]);
    gh(['release', 'edit', tag, '--repo', repository, '--draft=false', `--latest=${latest}`]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { publishRelease({ repository: process.env.REPOSITORY, tag: process.env.RELEASE_TAG, commit: process.env.COMMIT_SHA }); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
