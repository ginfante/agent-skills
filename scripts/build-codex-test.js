'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('./build-codex');
const root = path.resolve(__dirname, '..');
function temporary(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-adapter-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function tree(dir) {
  return Object.fromEntries(fs.readdirSync(dir, { recursive: true }).sort()
    .filter(file => fs.statSync(path.join(dir, file)).isFile())
    .map(file => [file, fs.readFileSync(path.join(dir, file), 'utf8')]));
}
test('distribution contains every original skill and every mapped workflow/persona', t => {
  const output = temporary(t);
  build({ root, output });
  const names = fs.readdirSync(path.join(output, 'skills'));
  assert.equal(names.length, 38);
  for (const name of ['workflow-build', 'workflow-ship', 'persona-code-reviewer', 'idea-refine']) {
    assert.ok(fs.existsSync(path.join(output, 'skills', name, 'SKILL.md')), name);
  }
});
test('individual skills carry resources without needing the original repository', t => {
  const output = temporary(t);
  build({ root, output });
  const skill = path.join(output, 'skills/security-and-hardening');
  const md = fs.readFileSync(path.join(skill, 'SKILL.md'), 'utf8');
  assert.doesNotMatch(md, /\.\.\/\.\.\/references/);
  assert.match(md, /references\/shared\/security-checklist.md/);
  assert.ok(fs.existsSync(path.join(skill, 'references/shared/security-checklist.md')));
  assert.ok(fs.existsSync(path.join(skill, 'references/hardening-patterns.md')));
  const spec = path.join(output, 'skills/workflow-spec');
  assert.ok(fs.existsSync(path.join(spec, 'references/workflows/spec-driven-development/SKILL.txt')));
  assert.match(fs.readFileSync(path.join(spec, 'SKILL.md'), 'utf8'), /references\/workflows/);
});
test('wrapper metadata disables implicit invocation without changing canonical descriptions', t => {
  const output = temporary(t);
  build({ root, output });
  const yaml = fs.readFileSync(path.join(output, 'skills/workflow-review/agents/openai.yaml'), 'utf8');
  assert.match(yaml, /allow_implicit_invocation: false/);
  assert.match(fs.readFileSync(path.join(output, 'skills/workflow-review/SKILL.md'), 'utf8'), /explicitly/);
  assert.ok(!fs.existsSync(path.join(output, 'skills/interview-me/agents/openai.yaml')));
});
test('build output is deterministic across destinations', t => {
  const a = temporary(t), b = temporary(t);
  build({ root, output: a });
  build({ root, output: b });
  assert.deepEqual(tree(a), tree(b));
});
test('rejects an unmapped command rather than silently dropping it', t => {
  const fixture = temporary(t);
  fs.cpSync(path.join(root, 'adapters'), path.join(fixture, 'adapters'), { recursive: true });
  fs.cpSync(path.join(root, '.claude/commands'), path.join(fixture, '.claude/commands'), { recursive: true });
  fs.cpSync(path.join(root, 'agents'), path.join(fixture, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(fixture, '.claude/commands/new-command.md'), '---\ndescription: new\n---\n');
  assert.throws(() => build({ root: fixture, output: path.join(fixture, 'output') }), /unmapped|inventory/i);
});
test('rejects a changed command until its translation is reviewed', t => {
  const fixture = temporary(t);
  for (const dir of ['adapters', '.claude/commands', 'agents']) {
    fs.cpSync(path.join(root, dir), path.join(fixture, dir), { recursive: true });
  }
  fs.appendFileSync(path.join(fixture, '.claude/commands/build.md'), '\nNew semantic instruction.\n');
  assert.throws(() => build({ root: fixture, output: path.join(fixture, 'output') }), /review|digest/i);
});
test('webperf persona refers to bundled workflows rather than repository-only skill paths', t => {
  const output = temporary(t);
  build({ root, output });
  const text = fs.readFileSync(path.join(output, 'skills/persona-web-performance-auditor/SKILL.md'), 'utf8');
  assert.doesNotMatch(text, /skills\/performance-optimization\/SKILL\.md/);
  assert.match(text, /references\/workflows\/performance-optimization\/SKILL.txt/);
});
test('failed generation preserves the preceding valid distribution', t => {
  const output = temporary(t);
  build({ root, output });
  const before = tree(output);
  const fixture = temporary(t);
  for (const dir of ['adapters', '.claude/commands', 'agents', 'skills', 'references', 'docs/agents.md']) {
    fs.cpSync(path.join(root, dir), path.join(fixture, dir), { recursive: true });
  }
  fs.copyFileSync(path.join(root, 'LICENSE'), path.join(fixture, 'LICENSE'));
  fs.writeFileSync(path.join(fixture, 'skills/interview-me/SKILL.md'), 'bad frontmatter');
  assert.throws(() => build({ root: fixture, output }), /frontmatter/);
  assert.deepEqual(tree(output), before);
});
function sourceFixture(t) {
  const fixture = temporary(t);
  for (const entry of ['adapters', '.claude/commands', 'agents', 'skills', 'references', 'docs/agents.md', 'LICENSE']) {
    fs.cpSync(path.join(root, entry), path.join(fixture, entry), { recursive: true });
  }
  return fixture;
}
test('command translation leaves repository paths and URLs intact', () => {
  const { translate } = require('./build-codex');
  assert.equal(translate('Read tasks/plan.md and docs/spec/guide.md at https://example.com/spec/guide'), 'Read tasks/plan.md and docs/spec/guide.md at https://example.com/spec/guide');
  assert.equal(translate('Run `/plan`, `/build auto`, then `/constraints check`.'), 'Run `workflow-plan`, `workflow-build auto`, then `workflow-constraints check`.');
});
test('selectively installed specification carries its downstream workflow references', t => {
  const output = temporary(t);
  build({ root, output });
  const target = path.join(output, 'skills/workflow-spec/references/workflows/spec-driven-development/SKILL.txt');
  const text = fs.readFileSync(target, 'utf8');
  assert.doesNotMatch(text, /skills\/[a-z-]+\/SKILL.md/);
  assert.ok(fs.existsSync(path.join(output, 'skills/workflow-spec/references/workflows/incremental-implementation/SKILL.txt')));
});
test('overridden shared sources require review when upstream content changes', t => {
  const fixture = sourceFixture(t);
  fs.appendFileSync(path.join(fixture, 'references/orchestration-patterns.md'), '\nNew upstream rule.\n');
  assert.throws(() => build({ root: fixture, output: path.join(fixture, 'dist/codex') }), /review|digest/i);
});
test('rejects LICENSE symlinks before copying content into releases', t => {
  const fixture = sourceFixture(t);
  fs.rmSync(path.join(fixture, 'LICENSE'));
  const secret = path.join(temporary(t), 'synthetic-private.txt');
  fs.writeFileSync(secret, 'synthetic private material');
  fs.symlinkSync(secret, path.join(fixture, 'LICENSE'));
  assert.throws(() => build({ root: fixture, output: path.join(fixture, 'dist/codex') }), /regular|symlink/i);
});
test('refuses an output ancestor symlink aliasing protected source directories', t => {
  const fixture = sourceFixture(t);
  const marker = path.join(fixture, 'skills/_codex-build.json');
  fs.writeFileSync(marker, '{}');
  fs.symlinkSync(fixture, path.join(fixture, 'dist'), 'junction');
  assert.throws(() => build({ root: fixture, output: path.join(fixture, 'dist/skills') }), /unsafe|output|symlink/i);
  assert.ok(fs.existsSync(path.join(fixture, 'skills/interview-me/SKILL.md')));
});
test('a final publication rename failure restores the preceding distribution', t => {
  const output = temporary(t);
  build({ root, output });
  const before = tree(output);
  const rename = fs.renameSync;
  fs.renameSync = (source, destination) => {
    if (path.basename(source).startsWith('.codex-stage-') && !path.basename(source).endsWith('-previous') && destination === fs.realpathSync(path.dirname(output)) + path.sep + path.basename(output)) throw new Error('synthetic publication failure');
    return rename(source, destination);
  };
  try { assert.throws(() => build({ root, output }), /synthetic publication failure/); }
  finally { fs.renameSync = rename; }
  assert.deepEqual(tree(output), before);
});
