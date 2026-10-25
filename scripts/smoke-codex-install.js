#!/usr/bin/env node
'use strict';
// Uses an explicitly supplied CLI entry point, avoiding package downloads or
// writes to personal agent directories. All installation targets are temporary.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { files } = require('./build-codex');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args[0] !== '--cli' || !args[1] || (args.length !== 2 && !(args.length === 4 && args[2] === '--source'))) {
  console.error('Usage: node scripts/smoke-codex-install.js --cli /path/to/skills/bin/cli.mjs [--source git-url]');
  process.exit(1);
}
const cli = path.resolve(args[1]);
const source = args[3] || path.join(root, 'dist/codex');
const expected = JSON.parse(fs.readFileSync(path.join(root, 'dist/codex/_codex-build.json'), 'utf8')).skills;
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-cli-smoke-'));
try {
  for (const [mode, selection, extra] of [
    ['default', '*', []], ['copy', '*', ['--copy']],
    ['selective', 'workflow-ship', []],
    ['agent-symlink', 'workflow-spec', ['-a', 'claude-code']],
  ]) {
    const cwd = path.join(temp, mode);
    fs.mkdirSync(cwd);
    const output = execFileSync(process.execPath, [cli, 'add', source, '-a', 'codex', '--skill', selection, '-y', ...extra], {
      cwd, encoding: 'utf8', timeout: 120000,
      env: { ...process.env, DISABLE_TELEMETRY: '1', NO_COLOR: '1' },
    });
    const installed = path.join(cwd, '.agents/skills');
    const names = fs.readdirSync(installed).sort();
    assert.deepEqual(names, selection === '*' ? expected : [selection], output);
    for (const name of names) {
      const original = path.join(root, 'dist/codex/skills', name);
      for (const file of files(original)) {
        const dest = path.join(installed, name, path.relative(original, file));
        assert.ok(fs.existsSync(dest), `Missing installed resource: ${dest}`);
        assert.ok(fs.readFileSync(file).equals(fs.readFileSync(dest)), `Changed installed content: ${dest}`);
      }
    }
    if (mode === 'agent-symlink') {
      const link = path.join(cwd, '.claude/skills/workflow-spec');
      assert.ok(fs.lstatSync(link).isSymbolicLink(), 'Default secondary agent installation must symlink');
      assert.equal(fs.realpathSync(link), fs.realpathSync(path.join(installed, 'workflow-spec')));
    }
    console.log(`${mode}: ${names.length} skills installed; all resources preserved`);
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
