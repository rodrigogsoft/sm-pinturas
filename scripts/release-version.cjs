#!/usr/bin/env node

const { execSync } = require('node:child_process');

function run(command) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' }).trim();
}

function runInherit(command) {
  execSync(command, { stdio: 'inherit' });
}

function parseVersion(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function nextVersion(current, bumpType) {
  if (bumpType === 'major') {
    return { major: current.major + 1, minor: 0, patch: 0 };
  }

  if (bumpType === 'minor') {
    return { major: current.major, minor: current.minor + 1, patch: 0 };
  }

  return { major: current.major, minor: current.minor, patch: current.patch + 1 };
}

function toTag(version) {
  return `v${version.major}.${version.minor}.${version.patch}`;
}

function getLatestSemverTag() {
  const output = run('git tag --list "v*" --sort=-v:refname');
  const tags = output.split(/\r?\n/).map((t) => t.trim()).filter(Boolean);

  for (const tag of tags) {
    if (parseVersion(tag)) {
      return tag;
    }
  }

  return 'v1.0.0';
}

function assertCleanWorkingTree() {
  const status = run('git status --porcelain');
  if (status.length > 0) {
    console.error('Erro: existem alteracoes nao commitadas. Faça commit antes de gerar a tag.');
    process.exit(1);
  }
}

function assertTagDoesNotExist(tag) {
  const output = run(`git tag --list "${tag}"`);
  if (output === tag) {
    console.error(`Erro: a tag ${tag} ja existe.`);
    process.exit(1);
  }
}

function main() {
  const bumpType = (process.argv[2] || 'patch').toLowerCase();

  if (!['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Uso: node scripts/release-version.cjs [patch|minor|major]');
    process.exit(1);
  }

  assertCleanWorkingTree();

  const branch = run('git rev-parse --abbrev-ref HEAD');
  const latestTag = getLatestSemverTag();
  const baseVersion = parseVersion(latestTag) || { major: 1, minor: 0, patch: 0 };
  const newVersion = nextVersion(baseVersion, bumpType);
  const newTag = toTag(newVersion);

  assertTagDoesNotExist(newTag);

  console.log(`Branch atual: ${branch}`);
  console.log(`Ultima tag: ${latestTag}`);
  console.log(`Nova tag: ${newTag}`);

  runInherit(`git push origin ${branch}`);
  runInherit(`git tag -a ${newTag} -m "Release ${newTag}"`);
  runInherit(`git push origin ${newTag}`);

  console.log(`Release concluido com sucesso: ${newTag}`);
}

main();
