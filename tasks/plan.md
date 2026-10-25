# Implementation Plan: Full Agent Skills adaptation for Codex

Date: 2026-10-25
Status: Planned; implementation has not started.
Fork: git@github.com:ginfante/agent-skills.git
Upstream: https://github.com/addyosmani/agent-skills
Inspected baseline: aeac41d4d005999432bb7312f7ff06383a91d59d (main)
Task tracking: tasks/todo.md

## Objective and scope

Make every existing skill, lifecycle command workflow, and specialist persona usable from Codex while retaining upstream compatibility and a reproducible, versioned customization layer. At the inspected baseline this means 25 skills, nine command workflows, and four personas. Discover the inventory during generation rather than permanently hard-coding these counts.

Native `npx skills add` installation from the fork is a required, primary distribution path, including the modified original skills and generated command/persona skills.

This task creates the plan only. Building, installing, committing, pushing, and publishing the adaptation are subsequent work. Exact Claude slash-command UI registration is not an acceptance criterion: Codex-native skills provide the entry points. A persona skill applies a role; separate context requires actual subagent delegation.

## Findings from the checkout

- `.codex-plugin/plugin.json` exposes `./skills/`; `.agents/plugins/marketplace.json` registers the root package. Neither registers the Claude command/persona directories.
- Canonical commands live in `.claude/commands/*.md`; personas live in `agents/*.md`. Shared checklists live in `references/`.
- `build.md` includes single-task and auto/all modes, spec and working-tree prerequisites, and per-task verification. Preserve these semantics, translating host-specific syntax explicitly.
- `ship.md` fans out three specialist reviews and merges reports. It contains conflicting fallback instructions (sequential fallback versus a later never-sequential rule); the adapter must explicitly resolve this rather than pretend sequential work was independent parallel review.
- `webperf.md` invokes one specialist and distinguishes measured Deep mode from source-only Quick mode.
- `docs/agents.md` distinguishes command workflows from personas: review/test run in the main context; ship delegates; personas do not invoke each other.
- Existing Node tooling validates skills, links, versions, command parity, artifact paths, and routing evals. CI uses Node 24 and a 95% minimum rank-1 routing threshold. Preserve existing checks and thresholds.

## Architecture decisions

1. Keep upstream skills, commands, personas, and their shared references canonical. Store Codex translation rules and intentional overrides under `adapters/codex/`.
2. Produce a self-contained skills distribution at `dist/codex/skills/`, using a Node script consistent with existing tooling. Commit the generated distribution in reviewed release changes so the skills CLI can fetch it directly from Git; CI verifies generated content matches its sources. A separate plugin at `build/codex-plugin/` is an optional additional output from the same generator. Do not add generated adapter skills to the shared root `skills/` directory: that would also expose them to other hosts and alter upstream routing.
3. Generate installable versions of the canonical (including fork-modified) skills with each skill’s required resource closure bundled inside its own directory, and rewrite references to those local resources. Do not depend on the repository-level references directory or other sibling skill folders surviving a selective install. Cross-skill workflow steps invoke other skills by name; document and validate required companion skills. Add nine `workflow-*` and four `persona-*` skill entry points. Generate names from an explicit mapping; new upstream sources require a reviewed mapping or a clear generation failure.
4. Each wrapper has valid skill frontmatter and an explicit invocation description. Prefer explicit-only invocation metadata if the installed Codex version supports it; verify against current official docs before relying on the field. Do not compete with existing skills for broad implicit triggers.
5. Translate `$ARGUMENTS`, Claude namespaced skill references, Agent/subagent_type calls, persona lookup, and tool assumptions deliberately. Unknown runtime-specific constructs fail validation rather than receiving blind text substitution.
6. Persona wrappers preserve role, scope, output schema, and skill composition. Direct invocation adopts the role in the current chat. Delegating workflows pass those instructions and scoped evidence into independent Codex subagents; they must not claim to replace higher-priority system instructions.
7. Ship uses real parallel subagents when the host supports them and authorization permits. Otherwise, report the missing capability and offer a clearly labeled reduced mode; never claim independent or parallel evidence from a single context. Do not silently issue a fully verified launch decision with missing required reports.
8. Use a distinct plugin/marketplace identity for the adaptation to avoid double installation with the upstream pack. Build manifests derive from one adapter release version and retain MIT licensing/attribution. Avoid changing upstream version-parity rules merely to accommodate a separate artifact.
9. Use native `npx skills add` for both local development and remote installs. Point the remote command at `https://github.com/ginfante/agent-skills/tree/main/dist/codex` so discovery selects the adapted distribution rather than the upstream-layout root skills. Do not require an npm publication or custom installer.
10. Keep the build reproducible and independent of absolute checkout paths. No symlinks outside the built package, no network required to build, no injected always-on meta-router in global AGENTS.md.

## Proposed structure

```text
adapters/codex/manifest.json        # Source mapping, identity, version, semantics overrides
adapters/codex/README.md            # Conversion contract and capability limits
scripts/build-codex.js             # Deterministic self-contained package generation
scripts/build-codex-test.js        # Generator fixtures and failure tests
scripts/validate-codex.js          # Package completeness, references and drift checks
scripts/validate-codex-test.js     # Validator regression tests
dist/codex/skills/                 # Generated, self-contained skills committed for native CLI installs
  <skill-name>/SKILL.md
  <skill-name>/references/         # Local resources needed after selective install
build/codex-plugin/                # Optional plugin artifact; ignored locally
  .codex-plugin/plugin.json
  .agents/plugins/marketplace.json
  skills/                         # Canonical skills + workflow-* + persona-*
  references/
  agents/                         # Canonical source resources as needed
  docs/                           # Referenced resources as needed
  LICENSE
```

The exact supported manifest shape and invocation syntax must be rechecked on the target Codex runtime before implementation. Use the current supported packaging format; do not assume old CLI plugin commands match the desktop app.

## Task sequence and dependency graph

1. Specify the adapter contract and capability matrix.
2. Deliver one working workflow wrapper in an isolated package (depends on 1).
3. Deliver persona wrappers and direct role invocation (depends on 2).
4. Deliver the remaining simple workflow wrappers (depends on 2).
5. Deliver build mode handling and prerequisites (depends on 4).
6. Deliver webperf single-persona orchestration (depends on 3, 4).
7. Deliver ship parallel review and synthesis (depends on 3, 5, 6).
8. Validate complete packaging and upstream drift (depends on 5, 6, 7).
9. Add CI, installation instructions, and release maintenance (depends on 8), including native skills CLI compatibility.
10. Verify native local/remote CLI installation and update/rollback behavior (depends on 8, 9).

Checkpoints after 1–2, 3–4, 5–7, and 8–10. Each checkpoint records actual evidence and any capability gaps. Details and acceptance criteria are in tasks/todo.md.

## Validation strategy

- Test generation against fixtures: malformed frontmatter, unmapped commands, duplicate names, unknown placeholders, missing resources, and reproducibility across two output directories.
- Walk all built Markdown links and resource references, including docs and persona composition links. For the skills distribution, validate that resource paths stay inside each individually installed skill directory. Test selective installation with only one skill present.
- Check inventory parity (baseline 25 + 9 + 4), valid skill metadata, unique identity, version consistency, and absence of unconverted Claude execution instructions.
- Preserve upstream validation and routing gates; add adapter-specific routing cases with positive, negative, and behavioral cases for the new wrappers. Do not lower the 95% existing routing threshold.
- Smoke-test from the installed built artifact in a fresh Codex chat, outside this repository. Verify one existing skill, a simple command, build single-task/auto selection, all four personas, webperf missing-metrics behavior, and ship report merging with actual delegation.
- Test a host without delegation: report limitations honestly; do not simulate independent contexts. Record runtime/version and tool availability with smoke-test results.

## Native skills CLI installation contract

After the distribution is built, committed and pushed (commands below are planned, not executed):

```bash
# Local development: install generated adaptations without publishing.
npx skills add /Users/guillermo/dev/agent-skills/dist/codex -a codex --skill '*'

# Remote: install every adapted skill for Codex in the current project.
npx skills add https://github.com/ginfante/agent-skills/tree/main/dist/codex -a codex --skill '*'

# Global variant: make the adapted skills available across projects.
npx skills add https://github.com/ginfante/agent-skills/tree/main/dist/codex -a codex --skill '*' -g

# Discover the adapted entries without installing.
npx skills add https://github.com/ginfante/agent-skills/tree/main/dist/codex --list

# Planned pinned release example; the tag must exist before running.
npx skills add https://github.com/ginfante/agent-skills/tree/codex-v0.1.0/dist/codex -a codex --skill '*'
```

The plain `ginfante/agent-skills` source still discovers canonical root skills; do not claim it includes the generated adaptations. Use the explicit distribution URL for the full pack. `--all` targets every agent; use `-a codex --skill '*'` to select every skill for Codex only. Add `-g` only when global installation is wanted.

Validate `skills check` and `skills update` behavior with the actual CLI release for a Git subdirectory source. Record source/ref tracking and prove updates continue to come from the fork. For reproducible releases, test reinstalling an explicit tag and rollback to a preceding tag; do not assume an update command preserves a pinned ref without testing it. Test both copy and symlink installation modes. No actual global install or publication is part of this planning request.

## Maintenance and versioning

Use origin for ginfante/agent-skills and upstream for addyosmani/agent-skills. Merge upstream changes through a reviewable branch; regenerate and run parity/drift validation before accepting them. Keep fork changes primarily in adapters, build tooling, tests, and documentation. Tag adapter releases with a distinct prefix such as codex-v0.1.0, record the upstream commit in the build metadata, and install pinned reviewed versions. Rollback means reinstalling the preceding tag; installation instructions must explain how to disable duplicate upstream installations.

## Risks and resolutions

| Risk | Resolution |
|---|---|
| Commands are more than aliases | Preserve modes, prerequisites, orchestration, and output contracts in behavioral tests. |
| Shared references break after packaging | Copy the full reachable resource closure and validate from the built artifact. |
| Wrapper skills degrade native routing | Explicit invocation and negative routing cases; avoid broad descriptions. |
| Runtime-specific delegation or plugin support | Capability matrix plus fresh-session smoke tests; disclose unsupported behavior. |
| Upstream adds commands/personas or changes semantics | Source mapping and source digests; fail on unmapped additions and require override review on changed sources. |
| Fork version conflicts with upstream manifests | Separate adapter artifact identity/version; preserve upstream parity checks. |

## Sources

- Native skills CLI source formats/options: https://github.com/vercel-labs/skills/blob/main/docs/commands.md
- Native discovery rules: https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md

- Repository: docs/codex-setup.md, docs/agents.md, AGENTS.md, CONTRIBUTING.md, .claude/commands/, agents/, and .github/workflows/test-plugin-install.yml.
- OpenAI conversion guidance: https://developers.openai.com/plugins/guides/submit-claude-plugin
- Recheck current official Codex skill/plugin and delegation documentation during Task 1; availability is runtime-dependent.
