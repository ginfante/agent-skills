'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build } = require('./build-codex');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-contracts-'));
const { after } = require('node:test');
after(() => fs.rmSync(temp, { recursive: true, force: true }));
build({ output: temp });
const skill = name => fs.readFileSync(path.join(temp, 'skills', name, 'SKILL.md'), 'utf8');
// These assert the published instruction contracts. They do not claim to prove
// model compliance or replace a fresh-session behavioral evaluation.
test('build retains single-task default, auto/all, specification and unrelated-change guards', () => {
  const text = skill('workflow-build');
  for (const required of ['next', 'auto', 'all', 'SPEC.md', 'git status --porcelain', 'unrelated', 'RED', 'GREEN', 'commit']) assert.ok(text.includes(required), required);
  assert.doesNotMatch(text, /\$ARGUMENTS|agent-skills:/);
});
test('review and test stay in main context rather than launching personas', () => {
  for (const name of ['workflow-review', 'workflow-test']) {
    const text = skill(name);
    assert.match(text, /main chat/);
    assert.doesNotMatch(text, /Spawn|subagent_type|Delegate.*persona/);
  }
});
test('ship blocks missing independent evidence and retains rollback and complete reports', () => {
  const text = skill('workflow-ship');
  for (const required of ['concurrently', 'independent context', 'BLOCKED', 'failed specialist', 'Rollback plan', 'Complete specialist reports', 'fewer than 50', 'NO-GO']) assert.ok(text.includes(required), required);
  assert.doesNotMatch(text, /treat their outputs as if returned in parallel/);
});
test('webperf requires evidence for Deep mode and discloses single-context fallback', () => {
  const text = skill('workflow-webperf');
  for (const required of ['Quick mode', 'potential impact', 'Lighthouse', 'Deep mode', 'single-context']) assert.ok(text.includes(required), required);
  const persona = skill('persona-web-performance-auditor');
  assert.match(persona, /not measured/);
  assert.match(persona, /backed by these sources/);
});
test('all personas preserve their report and prevent recursive delegation', () => {
  for (const name of ['code-reviewer', 'security-auditor', 'test-engineer', 'web-performance-auditor']) {
    const text = skill(`persona-${name}`);
    assert.match(text, /does not create a separate agent or context window/);
    assert.match(text, /Do not delegate to other personas/);
    assert.match(text, /Composition/);
  }
});
test('constraints uses AGENTS.md and preserves native subcommands', () => {
  const text = skill('workflow-constraints');
  assert.match(text, /AGENTS.md/);
  for (const command of ['check', 'guard', 'ratchet']) assert.ok(text.includes(`workflow-constraints ${command}`));
});
