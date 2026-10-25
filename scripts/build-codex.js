#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const DEFAULT_ROOT = path.resolve(__dirname, '..');
const digest = data => crypto.createHash('sha256').update(data).digest('hex');
const read = file => fs.readFileSync(file, 'utf8');
const posix = file => file.split(path.sep).join('/');
const inside = (root, file) => file === root || file.startsWith(root + path.sep);
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .flatMap(entry => {
      const file = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Symlink not allowed in sources: ${file}`);
      return entry.isDirectory() ? files(file) : [file];
    });
}
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function frontmatter(text, source) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing frontmatter: ${source}`);
  const field = name => {
    const values = [...match[1].matchAll(new RegExp(`^${name}:\\s*(.+)$`, 'gm'))];
    if (values.length > 1) throw new Error(`Duplicate ${name}: ${source}`);
    return values[0]?.[1].replace(/^['"]|['"]$/g, '');
  };
  return { name: field('name'), description: field('description'), body: text.slice(match[0].length) };
}
function checkedFile(root, relative) {
  const file = path.resolve(root, relative);
  if (!inside(root, file)) throw new Error(`Source path escapes repository: ${relative}`);
  if (!fs.statSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) {
    throw new Error(`Source must be a regular file: ${relative}`);
  }
  if (!inside(fs.realpathSync(root), fs.realpathSync(file))) throw new Error(`Source symlink escape: ${relative}`);
  return file;
}
function checkSources(root, manifest) {
  for (const [category, directory] of [['workflows', '.claude/commands'], ['personas', 'agents']]) {
    const actual = fs.readdirSync(path.join(root, directory)).filter(name => name.endsWith('.md') && !/^readme\.md$/i.test(name)).sort();
    const mapped = Object.keys(manifest[category]).map(name => `${name}.md`).sort();
    if (JSON.stringify(actual) !== JSON.stringify(mapped)) throw new Error(`Unmapped ${category} inventory: review adapters/codex/manifest.json`);
    for (const [name, entry] of Object.entries(manifest[category])) {
      if (entry.source !== `${directory}/${name}.md`) throw new Error(`Invalid source mapping for ${name}`);
      if (digest(fs.readFileSync(checkedFile(root, entry.source))) !== manifest.reviewedSources[entry.source]) {
        throw new Error(`Source review required: ${entry.source}; inspect semantics before updating its digest`);
      }
      if (entry.override) checkedFile(root, entry.override);
    }
  }
}
function translate(text) {
  return text.replace(/skills\/([a-z][a-z-]+)(?:\/SKILL\.md)?/g, '`$1` (use its bundled workflow when not installed)')
    .replace(/\$ARGUMENTS/g, 'the arguments supplied by the user with this workflow')
    .replace(/agent-skills:([a-z][a-z-]+)/g, '`$1`')
    .replace(/\/constraints (check|guard|ratchet)/g, 'workflow-constraints $1')
    .replace(/\/build(?: auto)?/g, value => value.includes('auto') ? 'workflow-build auto' : 'workflow-build')
    .replace(/\/(spec|plan|test|review|ship|webperf|code-simplify)\b/g, 'workflow-$1');
}

// Resources are local to each installable skill. A resource's source location is
// tracked separately from its destination so nested references retain meaning.
function bundle(root, target) {
  const destinations = new Map();
  function add(source, relative, transform = value => value) {
    const key = path.resolve(root, source);
    if (destinations.has(key)) return destinations.get(key);
    const destination = path.resolve(target, relative);
    if (!inside(target, destination)) throw new Error(`Destination escapes skill: ${relative}`);
    const file = checkedFile(root, source);
    destinations.set(key, relative);
    if (!/\.(md|txt|sh|yaml|json)$/i.test(file)) {
      write(destination, fs.readFileSync(file));
      return relative;
    }
    let text = transform(read(file));
    // Convert real shared references, including bare backtick paths. Example
    // project paths inside code fences are not treated as resource links.
    text = text.replace(/(?<![\w./-])((?:\.\.\/)*references\/[\w./-]+\.md)(#[\w-]+)?/g, (match, link, anchor = '') => {
      if (fs.existsSync(path.resolve(path.dirname(destination), link))) return match;
      let resolved = path.resolve(path.dirname(file), link);
      if (!fs.existsSync(resolved) && link.startsWith('references/')) resolved = path.join(root, link);
      if (!fs.existsSync(resolved)) throw new Error(`Missing bundled reference ${link} in ${source}`);
      if (!inside(root, resolved)) throw new Error(`Reference escapes repository: ${link}`);
      if (destinations.has(resolved)) {
        return posix(path.relative(path.dirname(destination), path.join(target, destinations.get(resolved)))) + anchor;
      }
      if (inside(path.join(root, 'references'), resolved)) {
        const name = path.basename(resolved);
        const src = name === 'orchestration-patterns.md' ? 'adapters/codex/references/orchestration-patterns.md' : posix(path.relative(root, resolved));
        const local = `references/shared/${name}`;
        // Mark both canonical and adapted paths to resolve repeated references.
        add(src, local);
        destinations.set(resolved, local);
        return posix(path.relative(path.dirname(destination), path.join(target, local))) + anchor;
      }
      // A skill's own files are copied with their original internal layout.
      if (inside(path.dirname(file), resolved) || inside(path.join(root, 'skills'), resolved)) return match;
      throw new Error(`Unmapped resource ${link} in ${source}`);
    });
    text = text.replace(/\]\((?:\.\.\/)?docs\/agents\.md\)/g, () => {
      const local = add('adapters/codex/references/personas.md', 'references/personas.md');
      return `](${posix(path.relative(path.dirname(destination), path.join(target, local)))})`;
    });
    write(destination, text);
    return relative;
  }
  function skill(name, destination = '') {
    const sourceDir = path.join(root, 'skills', name);
    if (!fs.existsSync(sourceDir)) throw new Error(`Unknown required skill: ${name}`);
    for (const file of files(sourceDir)) {
      const rel = posix(path.relative(sourceDir, file));
      const dest = path.posix.join(destination, rel === 'SKILL.md' && destination ? 'SKILL.txt' : rel);
      add(posix(path.relative(root, file)), dest, text => {
        if (name === 'idea-refine') text = text.replace('bash skills/idea-refine/scripts/idea-refine.sh', 'bash <installed-skill-directory>/scripts/idea-refine.sh');
        if (name === 'doubt-driven-development') {
          text = text.replace('In Claude Code, the role-based reviewers in `agents/` start with isolated context by design and are usable here — see `agents/` for the roster and per-domain match.', 'In Codex, only actual native subagent delegation provides isolated context. Direct persona skill invocation stays in the current chat. Ask the main session to delegate an appropriate specialist when available; disclose unavailable fresh-context review.');
        }
        return text;
      });
    }
  }
  return { add, skill };
}
function build({ root = DEFAULT_ROOT, output = path.join(root, 'dist/codex') } = {}) {
  root = path.resolve(root); output = path.resolve(output);
  const manifest = JSON.parse(read(path.join(root, 'adapters/codex/manifest.json')));
  checkSources(root, manifest);
  if (!/^[a-z][a-z0-9-]+$/.test(manifest.name) || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('Invalid adapter identity/version');
  const original = fs.readdirSync(path.join(root, 'skills')).filter(name => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))).sort();
  const names = [...original, ...Object.keys(manifest.workflows).map(name => `workflow-${name}`), ...Object.keys(manifest.personas).map(name => `persona-${name}`)];
  if (new Set(names).size !== names.length) throw new Error('Duplicate generated skill names');
  if (output === root || inside(output, root) || ['skills', 'agents', 'adapters', '.claude', 'scripts'].some(dir => inside(path.join(root, dir), output))) throw new Error('Unsafe output directory');
  if (fs.existsSync(output) && fs.readdirSync(output).length && !fs.existsSync(path.join(output, '_codex-build.json'))) throw new Error('Refusing to replace an unmanaged output directory');
  // Build in a sibling temporary directory. Failed generation preserves the last
  // good distribution. No Git metadata, credentials or global state is copied.
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const stage = fs.mkdtempSync(path.join(path.dirname(output), '.codex-stage-'));
  try {
    for (const name of original) {
      const meta = frontmatter(read(path.join(root, 'skills', name, 'SKILL.md')), name);
      if (!/^[a-z][a-z0-9-]*$/.test(name) || meta.name !== name || !meta.description) throw new Error(`Invalid skill frontmatter: ${name}`);
      const target = path.join(stage, 'skills', name);
      bundle(root, target).skill(name);
      write(path.join(target, 'LICENSE'), read(path.join(root, 'LICENSE')));
    }
    for (const category of ['workflows', 'personas']) {
      for (const [name, entry] of Object.entries(manifest[category])) {
        const generatedName = `${category === 'workflows' ? 'workflow' : 'persona'}-${name}`;
        if (!/^[a-z][a-z0-9-]*$/.test(generatedName)) throw new Error(`Invalid generated name: ${generatedName}`);
        const target = path.join(stage, 'skills', generatedName);
        const resources = bundle(root, target);
        const source = frontmatter(read(path.join(root, entry.source)), entry.source);
        if (!source.description) throw new Error(`Invalid source description: ${entry.source}`);
        let body = translate(entry.override ? read(path.join(root, entry.override)) : source.body);
        if (category === 'workflows') {
          body = body.replace(/CLAUDE\.md/g, 'AGENTS.md');
          if (name === 'webperf') body = body.replace('Spawn the `web-performance-auditor` subagent. Pass it explicitly:', 'Use native subagent tools, when available and authorized, to delegate a read-only review with the bundled web-performance-auditor instructions. If delegation is unavailable, apply those instructions in the current chat and explicitly label the review as single-context. Pass the reviewer:');
        }
        const index = entry.skills.map(skill => {
          resources.skill(skill, `references/workflows/${skill}`);
          return `- ${skill}: [bundled workflow](references/workflows/${skill}/SKILL.txt)`;
        });
        const roles = category === 'workflows' && name === 'ship' ? ['code-reviewer', 'security-auditor', 'test-engineer'] : category === 'workflows' && name === 'webperf' ? ['web-performance-auditor'] : [];
        for (const role of roles) {
          const local = resources.add(`agents/${role}.md`, `references/personas/${role}.md`, translate);
          index.push(`- ${role}: [persona instructions](${local})`);
        }
        const intro = category === 'personas'
          ? 'Apply this role in the current chat. This does not create a separate agent or context window. Do not delegate to other personas. When an orchestrating workflow delegates you, return only your report and evidence; do not edit shared files.'
          : 'Run this workflow in the main chat. Use only tools exposed by the current host and follow the user’s existing authorization and higher-priority instructions. Installing this skill does not register a custom slash command.';
        const description = `Runs the ${name} ${category === 'workflows' ? 'workflow' : 'specialist persona'} in Codex. Use when the user explicitly selects ${generatedName}.`;
        const prelude = `---\nname: ${generatedName}\ndescription: ${description}\n---\n\n${intro}\n\nRead the bundled workflows below when required by the procedure. If an installed skill with the same name is available, prefer it; otherwise read the linked local workflow. Resolve every resource relative to the installed skill, not the project working directory. Helpers using <installed-skill-directory> use the directory of that bundled workflow. User arguments are plain task input, never shell code.\n\n## Bundled workflows and personas\n\n${index.join('\n')}\n\n`;
        // Run the wrapper through the same resource rewriting as canonical files.
        resources.add(entry.override || entry.source, 'SKILL.md', () => prelude + body);
        write(path.join(target, 'agents/openai.yaml'), `interface:\n  display_name: ${JSON.stringify(generatedName)}\n  short_description: ${JSON.stringify(description.slice(0, 64))}\npolicy:\n  allow_implicit_invocation: false\n`);
        write(path.join(target, 'LICENSE'), read(path.join(root, 'LICENSE')));
      }
    }
    const sourceDigests = {};
    for (const source of ['scripts/build-codex.js', 'LICENSE']) {
      if (fs.existsSync(path.join(root, source))) sourceDigests[source] = digest(fs.readFileSync(path.join(root, source)));
    }
    for (const dir of ['skills', 'agents', 'references', 'adapters/codex', '.claude/commands']) {
      for (const file of files(path.join(root, dir))) sourceDigests[posix(path.relative(root, file))] = digest(fs.readFileSync(file));
    }
    write(path.join(stage, '_codex-build.json'), JSON.stringify({ name: manifest.name, version: manifest.version, upstreamCommit: manifest.upstreamCommit, skills: names.sort(), sourceDigests }, null, 2) + '\n');
    write(path.join(stage, 'LICENSE'), read(path.join(root, 'LICENSE')));
    write(path.join(stage, 'README.md'), `# ${manifest.name}\n\nGenerated from canonical sources. Do not edit this directory directly.\n\nBuild: node scripts/build-codex.js\nValidate: node scripts/validate-codex.js\nVersion: ${manifest.version}\nUpstream baseline: ${manifest.upstreamCommit}\n\nInstall with npx skills add <this-directory> -a codex --skill '*'.\n`);
    fs.rmSync(output, { recursive: true, force: true });
    fs.renameSync(stage, output);
  } catch (error) {
    fs.rmSync(stage, { recursive: true, force: true });
    throw error;
  }
  return names;
}
module.exports = { build, files, frontmatter, inside, translate };
if (require.main === module) {
  try {
    if (process.argv.length > 2) throw new Error('Usage: node scripts/build-codex.js');
    console.log(`Built ${build().length} Codex skills in dist/codex/skills`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
