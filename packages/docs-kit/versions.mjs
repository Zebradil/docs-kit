#!/usr/bin/env node
// Builds the docs of past releases next to the default branch's site in dist/: the newest patch tag (vX.Y.Z) of each
// of the last `versions.keep` minor versions, at dist/vX.Y/, and the list of all of them in dist/versions.json.
// Each release's pages, assets and public files come from its tag; site.yaml, dependencies and the kit come from the
// working tree, so every version is built with the current kit and theme.
// Usage, from the docs directory after `astro build`: docs-kit-versions [--default-branch main]
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parse } from 'yaml';

/** Release tags grouped by minor version, newest first, each with its newest patch. Pre-releases are skipped. */
export function minorVersions(tags) {
  const newest = new Map();
  for (const tag of tags) {
    const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
    if (!match) continue;
    const [major, minor, patch] = match.slice(1).map(Number);
    const name = `v${major}.${minor}`;
    if (!newest.has(name) || newest.get(name).patch < patch) newest.set(name, { name, tag, major, minor, patch });
  }
  return [...newest.values()]
    .sort((a, b) => b.major - a.major || b.minor - a.minor)
    .map(({ name, tag }) => ({ name, tag }));
}

// Copied from a tag into the build: content replaces the working tree's, the others are laid over it so that files
// site.yaml names (logo, art) stay present.
const fromTag = ['src/content/docs', 'src/assets', 'public'];
const skipped = /^(node_modules|dist|\.astro)(\/|$)/;

function main() {
  const { values } = parseArgs({ options: { 'default-branch': { type: 'string', default: 'main' } } });
  const site = parse(readFileSync('site.yaml', 'utf8'));
  if (!site.versions) throw new Error('site.yaml has no `versions:`; nothing to build');
  const keep = site.versions.keep ?? 5;

  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  // `<tag>:./<path>` resolves the path against the working directory, wherever the docs directory is in the repo.
  const has = (tag, path) => spawnSync('git', ['cat-file', '-e', `${tag}:./${path}`]).status === 0;
  const candidates = minorVersions(git('tag', '--list', 'v*').split('\n')).filter(({ tag }) => has(tag, fromTag[0]));

  const built = [];
  for (const { name, tag } of candidates.slice(0, keep)) {
    const out = resolve('dist', name);
    // Inside the docs directory, so the build finds node_modules by walking up; a symlink confuses Astro's paths.
    mkdirSync('.astro', { recursive: true });
    const work = mkdtempSync(resolve('.astro/version-'));
    try {
      cpSync('.', work, { recursive: true, filter: (src) => !skipped.test(relative('.', src)) });
      rmSync(join(work, fromTag[0]), { recursive: true });
      // Pathspecs are relative to the working directory, and so are the archived paths.
      const archive = execFileSync('git', ['archive', tag, '--', ...fromTag.filter((p) => has(tag, p))], {
        maxBuffer: 1 << 30,
      });
      execFileSync('tar', ['-x', '-C', work], { input: archive });
      console.log(`Building ${name} from ${tag}`);
      const astro = resolve('node_modules/.bin/astro');
      const result = spawnSync(astro, ['build', '--outDir', out], {
        cwd: work,
        env: { ...process.env, DOCS_KIT_VERSION: name },
        stdio: 'inherit',
      });
      if (result.status !== 0) throw new Error(`astro build exited with ${result.status ?? result.signal}`);
      built.push(name);
    } catch (error) {
      // One release that no longer builds with the current kit must not block publishing the others.
      console.log(`::warning::Skipped the ${name} docs (${tag}): ${error.message}`);
      rmSync(out, { recursive: true, force: true });
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }

  const versions = [{ name: values['default-branch'], path: '' }, ...built.map((name) => ({ name, path: `${name}/` }))];
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/versions.json', `${JSON.stringify(versions, null, 2)}\n`);
  console.log(`Wrote dist/versions.json: ${versions.map((v) => v.name).join(', ')}`);
}

// npx runs this through a symlink in node_modules/.bin; tests import it for minorVersions.
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
