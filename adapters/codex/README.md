# Full Codex adaptation

This fork exposes the canonical skills, lifecycle workflows and specialist personas through the native skills CLI. The first adapter release is `0.1.0`. Source workflows remain in `skills/`, `.claude/commands/` and `agents/`; only the generated distribution is adapted.

## Build and validate

Use Node 24 (CI) or a supported current Node release:

```bash
node scripts/build-codex.js
node scripts/validate-codex.js
node --test scripts/build-codex-test.js scripts/validate-codex-test.js scripts/codex-workflows-test.js
```

Commit `dist/codex` with the source changes. CI regenerates an expected package and fails on missing or stale files. Do not edit generated files directly. The native CLI does not run a repository build after cloning it, so an ignored/unpublished build directory is insufficient. No npm package publication or custom installer is required.

## Install

After the tagged source is pushed:

```bash
# List before installing.
npx skills add https://github.com/ginfante/agent-skills/tree/codex-v0.1.0/dist/codex --list

# All adapted skills for Codex in the current project.
npx skills add https://github.com/ginfante/agent-skills/tree/codex-v0.1.0/dist/codex -a codex --skill '*'

# Add -g for availability across projects.
npx skills add https://github.com/ginfante/agent-skills/tree/codex-v0.1.0/dist/codex -a codex --skill '*' -g

# One workflow, including its underlying resources.
npx skills add https://github.com/ginfante/agent-skills/tree/codex-v0.1.0/dist/codex -a codex --skill workflow-ship

# Local development after a build.
npx skills add ./dist/codex -a codex --skill '*'
```

The CLI was tested at version 1.7.4 with Node 24. It requires Node 22.20 or later. You can pin the installer separately as `npx skills@1.7.4 add ...`. The plain repository shorthand discovers the canonical root skills; use the explicit `dist/codex` URL for this complete adaptation. `--all` targets all agents; `-a codex --skill '*'` targets every skill for Codex only.

Codex uses the CLI's shared `.agents/skills` directory for project installs. Global scope uses the CLI's user location. The CLI's default mode and `--copy` both preserve every resource. Secondary agent links may be symlinks; they are not separate Codex personas. Avoid duplicate upstream-plugin/global/project installations of the same skill name; choose the intended source and scope before replacing an existing installation. This build does not modify global settings or automatically install anything.

## Invoke

Start a fresh chat after installation. Select the skill through the host's skill picker, or explicitly ask to use its exact name. On Codex CLI, `$workflow-spec` is a typical explicit invocation; desktop skill-picker syntax may differ by version. Installing these skills does not register Claude's `/spec` or override Codex's built-in `/plan` or `/review` commands.

| Original command | Codex skill |
|---|---|
| /spec | workflow-spec |
| /plan | workflow-plan |
| /build, /build auto, /build all | workflow-build, with the same arguments |
| /test | workflow-test |
| /constraints, check, guard, ratchet | workflow-constraints, with the same arguments |
| /review | workflow-review |
| /webperf | workflow-webperf |
| /code-simplify | workflow-code-simplify |
| /ship | workflow-ship |

Personas are `persona-code-reviewer`, `persona-security-auditor`, `persona-test-engineer` and `persona-web-performance-auditor`. Direct invocation applies the role in the current chat. It does not launch a separate agent, create a fresh context, add tools, or change permissions. Wrapper metadata sets `policy.allow_implicit_invocation: false` in `agents/openai.yaml`; their descriptions also request explicit selection.

## Composition and resource layout

Each skill carries its license, existing helper files, local references and required shared checklists. Repository-only `skills/<name>/SKILL.md` references become bundled workflow resources. Required wrapper workflows are copied as `references/workflows/<name>/SKILL.txt`, not nested `SKILL.md` files, so discovery lists only the intended 38 entries. Transitive repository workflow paths are also bundled. Cycles resolve to already-bundled sources. Prefer a separately installed workflow with the same name when available; otherwise use the local bundled copy. Resource paths are relative to the installed skill; user-project output paths such as `SPEC.md` and `tasks/plan.md` remain relative to the user's project.

`workflow-review` and `workflow-test` stay in the main chat. `workflow-webperf` uses a native subagent when supported/authorized, otherwise explicitly labels current-context execution. It does not invent scores when measurement tools/artifacts are missing. `workflow-ship` runs three read-only independent subagents and merges their complete reports; it returns BLOCKED when required independent review is unavailable. The narrowly scoped upstream small-change exemption is preserved. A readiness audit does not authorize deployment.

The original ship source contains conflicting fallback instructions. The adapter resolves them in favor of honest independent-review evidence. It does not implement Claude Agent Teams or imitate Claude's persona precedence paths. All persona orchestration is owned by the main workflow, never another persona.

## Update and rollback

Change your fork's canonical skill files for behavior shared across hosts. Put Codex-only procedure changes in adapter overrides. Build and validate before committing. Command/persona sources and replaced shared resources have reviewed SHA-256 digests in `manifest.json`; if they change, generation stops until their translations are reviewed and the matching digests updated. Digests detect drift; they do not authenticate a trusted maintainer or sandbox installed instructions.

For reproducible consumption, reinstall a reviewed explicit tag or commit URL. To follow a moving branch, install its `tree/<branch>/dist/codex` URL and use `npx skills check` and `npx skills update`; source/ref tracking must be checked against the installed CLI's lock metadata. Do not assume a pinned install will silently move to a later release. Native update commands may update other installed skills unless their names/scope are selected explicitly.

Tag releases as `codex-vMAJOR.MINOR.PATCH`, independently of upstream's plugin versions. `_codex-build.json` records the adapter version, upstream baseline and source digests. Merge upstream into a review branch, reconcile source/override changes, regenerate and preserve all existing validation/routing gates. For rollback, reinstall the preceding adapter tag. This first release has no preceding adapter tag; before adopting it, retain the source/version of any installation it replaces.

## Repeatable native installer smoke test

Supply a local, already-installed skills CLI entry point:

```bash
node scripts/smoke-codex-install.js --cli /path/to/node_modules/skills/bin/cli.mjs
```

This tests full default and copy installs, selective ship installation, and a secondary-agent symlink in temporary directories, comparing all installed bytes with the distribution. Add `--source <GitHub-tree-URL>` to repeat against a pushed release. It does not install globally. See `evals/codex/README.md` and `verification.md` here for the limits of the recorded evidence.

## Official references

- Conversion of Claude commands/personas: https://developers.openai.com/plugins/guides/submit-claude-plugin
- Codex skills and host-specific invocation: https://learn.chatgpt.com/docs/build-skills
- Codex subagents: https://learn.chatgpt.com/docs/agent-configuration/subagents
- Skill metadata/policy: https://developers.openai.com/plugins/deploy/submission-errors
- CLI source formats and options: https://github.com/vercel-labs/skills/blob/main/docs/commands.md
- CLI discovery: https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md
