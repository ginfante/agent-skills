#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build, files, frontmatter, inside } = require('./build-codex');
const { stripFencedCodeBlocks } = require('./lib/skill-lint');
const ROOT = path.resolve(__dirname, '..');
function validate({ root = ROOT, output = path.join(root, 'dist/codex') } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-expected-'));
  try {
    build({ root, output: temp });
    const expected = files(temp).map(file => path.relative(temp, file)).sort();
    const actual = files(output).map(file => path.relative(output, file)).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('Missing or stale distribution files; rebuild with node scripts/build-codex.js');
    for (const file of expected) {
      if (!fs.readFileSync(path.join(temp, file)).equals(fs.readFileSync(path.join(output, file)))) {
        throw new Error(`Stale generated file mismatch: ${file}; rebuild the distribution`);
      }
    }
    const skills = path.join(output, 'skills');
    const names = fs.readdirSync(skills);
    for (const name of names) {
      const directory = path.join(skills, name);
      const meta = frontmatter(fs.readFileSync(path.join(directory, 'SKILL.md'), 'utf8'), name);
      if (meta.name !== name || !meta.description || meta.description.length > 1024) throw new Error(`Invalid metadata: ${name}`);
      for (const file of files(directory).filter(file => /\.(md|txt)$/.test(file))) {
        const text = stripFencedCodeBlocks(fs.readFileSync(file, 'utf8'));
        for (const [, link] of text.matchAll(/\]\(([^\s)]+)\)/g)) {
          if (/^(?:[a-z]+:|#)/i.test(link)) continue;
          const target = path.resolve(path.dirname(file), link.split('#')[0]);
          if (!inside(directory, target)) throw new Error(`Reference escapes individual skill: ${file}: ${link}`);
          if (!fs.existsSync(target)) throw new Error(`Missing resource: ${file}: ${link}`);
        }
        for (const [, link] of text.matchAll(/(?<![\w./-])((?:\.\.\/)*references\/[\w./-]+\.(?:md|txt))/g)) {
          const target = path.resolve(path.dirname(file), link);
          if (!inside(directory, target) || !fs.existsSync(target)) throw new Error(`Missing or escaping resource: ${file}: ${link}`);
        }
      }
      if (/^(?:workflow|persona)-/.test(name)) {
        const text = fs.readFileSync(path.join(directory, 'SKILL.md'), 'utf8');
        if (/\$ARGUMENTS|agent-skills:|subagent_type|Agent tool|\.claude\//.test(text)) throw new Error(`Untranslated host instruction in ${name}`);
        const yaml = fs.readFileSync(path.join(directory, 'agents/openai.yaml'), 'utf8');
        if (!yaml.includes('allow_implicit_invocation: false')) throw new Error(`Implicit wrapper invocation enabled: ${name}`);
      }
    }
    return names.length;
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
module.exports = { validate };
if (require.main === module) {
  try { console.log(`Validated ${validate()} self-contained Codex skills; generated output matches sources.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
