# Codex Adaptation Tasks

Status: planned; no implementation tasks completed. See plan.md for architecture and scope.

## Task 1: Define the adapter contract

**Description:** Inventory all skills, nine command sources and four personas; record source mappings, capability requirements, and per-command semantic overrides.

**Acceptance criteria:**
- [ ] Every source is mapped and unsupported host constructs are identified.
- [ ] Invocation, persona context, ship fallback, versioning, and packaging decisions are documented.
- [ ] Current official documentation and target runtime capabilities are recorded.

**Verification:** Review the inventory against the checkout and official docs; confirm no source is omitted.

**Dependencies:** None

**Files likely touched:** adapters/codex/manifest.json; adapters/codex/README.md

**Estimated scope:** Small. Generated outputs are build artifacts.

## Task 2: Build one runnable workflow slice

**Description:** Create deterministic packaging for a native skills CLI distribution with the canonical skills/resources and workflow-spec as the first callable wrapper.

**Acceptance criteria:**
- [ ] Generated distribution supports native local skills CLI discovery; optional plugin uses a distinct identity and valid metadata.
- [ ] workflow-spec invokes the existing specification workflow using Codex-compatible instructions.
- [ ] A fresh Codex session can discover an original skill and the generated workflow.

**Verification:** Focused generator tests plus a local install/discovery smoke test from outside the source checkout.

**Dependencies:** 1

**Files likely touched:** scripts/build-codex.js; scripts/build-codex-test.js; adapters/codex/manifest.json; .gitignore

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Checkpoint after Task 2

- [ ] Record passing focused checks and runtime smoke-test evidence.
- [ ] Review the resulting behavior, references, and unsupported capabilities before continuing.

## Task 3: Expose the specialist personas

**Description:** Generate persona-code-reviewer, persona-test-engineer, persona-security-auditor, and persona-web-performance-auditor with preserved role/report contracts.

**Acceptance criteria:**
- [ ] All four persona skills are callable and resolve their skill/resource references.
- [ ] Direct invocation applies the persona in the main chat without claiming separate context.
- [ ] Personas never delegate to another persona.

**Verification:** Generator fixture tests and fresh-session direct invocation checks for all four personas.

**Dependencies:** 2

**Files likely touched:** scripts/build-codex.js; scripts/build-codex-test.js; adapters/codex/manifest.json

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Task 4: Expose simple command workflows

**Description:** Generate workflow-plan, workflow-test, workflow-constraints, workflow-review, and workflow-code-simplify without confusing review/test with persona launches.

**Acceptance criteria:**
- [ ] All five commands preserve underlying skill sequence and expected artifacts.
- [ ] No Claude placeholders, tool calls, or broken namespaced invocations remain.
- [ ] Explicit wrapper invocation does not capture unrelated native skill requests.

**Verification:** Positive/negative routing fixtures and focused workflow smoke tests.

**Dependencies:** 2

**Files likely touched:** adapters/codex/manifest.json; scripts/build-codex.js; scripts/build-codex-test.js

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Checkpoint after Task 4

- [ ] Record passing focused checks and runtime smoke-test evidence.
- [ ] Review the resulting behavior, references, and unsupported capabilities before continuing.

## Task 5: Preserve build modes

**Description:** Add workflow-build with default one-task execution and explicit auto/all handling.

**Acceptance criteria:**
- [ ] Default completes the next task; auto/all preserve spec and working-tree prerequisites.
- [ ] User authorization and verification semantics are retained without absorbing unrelated changes.
- [ ] Task progression and per-task commit behavior match the source workflow and higher-priority host rules.

**Verification:** Behavioral fixtures for default/auto/all, missing spec, dirty tree, and failed verification.

**Dependencies:** 4

**Files likely touched:** adapters/codex/manifest.json; scripts/build-codex-test.js; evals/codex/build.json

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Task 6: Adapt web performance orchestration

**Description:** Add workflow-webperf with specialist instructions and source-only versus measured audit modes.

**Acceptance criteria:**
- [ ] Quick mode labels potential impact and invents no measured scores.
- [ ] Deep mode cites real artifacts or available measurement tools.
- [ ] Delegation capability and any fallback are disclosed accurately.

**Verification:** Behavioral fixtures with absent metrics, supplied Lighthouse data, and delegation unavailable.

**Dependencies:** 3, 4

**Files likely touched:** adapters/codex/manifest.json; scripts/build-codex-test.js; evals/codex/webperf.json

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Task 7: Adapt ship orchestration

**Description:** Add workflow-ship using three independent specialist reviews followed by main-context synthesis.

**Acceptance criteria:**
- [ ] Available subagents receive bounded review context and run concurrently without shared edits.
- [ ] Reports are deduplicated into blockers, launch decision, and rollback plan.
- [ ] Unavailable delegation, failed reports, and conflicting source fallback rules have explicit honest handling.

**Verification:** Behavioral fixtures plus a real delegation smoke test recording three reports and the merged decision.

**Dependencies:** 3, 5, 6

**Files likely touched:** adapters/codex/manifest.json; scripts/build-codex-test.js; evals/codex/ship.json

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Checkpoint after Task 7

- [ ] Record passing focused checks and runtime smoke-test evidence.
- [ ] Review the resulting behavior, references, and unsupported capabilities before continuing.

## Task 8: Validate complete packaging and drift

**Description:** Implement validation for all generated entries, resources, source mappings, semantic overrides and deterministic output.

**Acceptance criteria:**
- [ ] All baseline 38 entries are covered in dist/codex/skills; dynamic additions fail when unmapped.
- [ ] Missing links, resource paths escaping an individual skill, stale reviewed-source digests, and unsupported constructs fail clearly.
- [ ] Two builds produce equivalent file trees and preserve upstream routing gates.

**Verification:** node --test scripts/validate-codex-test.js; node scripts/validate-codex.js; run the existing validators and routing evals.

**Dependencies:** 5, 6, 7

**Files likely touched:** scripts/validate-codex.js; scripts/validate-codex-test.js; scripts/build-codex.js; adapters/codex/manifest.json

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Task 9: Document and automate release maintenance

**Description:** Wire the adaptation checks into CI and document build, install, invocation, pinned updates, rollback and upstream sync.

**Acceptance criteria:**
- [ ] Existing CI checks and 95% routing threshold remain intact.
- [ ] Codex installation instructions work on the tested runtime and identify all capability limits.
- [ ] Adapter release tags, attribution, upstream provenance, and duplicate-install handling are documented.

**Verification:** Run the new CI commands locally and execute documented install/update/rollback smoke tests; record evidence.

**Dependencies:** 8

**Files likely touched:** .github/workflows/test-codex-adapter.yml; docs/codex-setup.md; adapters/codex/README.md; evals/codex/README.md

**Estimated scope:** Medium. Generated outputs are build artifacts.

## Task 10: Verify native skills CLI delivery

**Description:** Publish-ready generated skills must install through the standard npx skills add command from both the local distribution and the fork’s explicit distribution URL, with no custom installer. Validate using an isolated temporary project before any personal/global installation.

**Acceptance criteria:**
- [ ] Local and Git subdirectory discovery expose all 38 baseline entries; full-pack and selective installs retain required resources in both copy and symlink modes.
- [ ] The release distribution is committed, reproducible, and preserves fork modifications; remote installation is tested once its source is pushed.
- [ ] Documentation proves project/global command syntax, fork-source update tracking, and explicit-tag rollback; persona and workflow semantics survive native installation.

**Verification:** Run npx skills add against local dist/codex with --list and -a codex --skill '*' in a temporary project; repeat with --copy and one selected skill. After publication, repeat against the fork URL and a release tag, inspect lock metadata, and exercise check/update and tagged reinstall. Record the tested CLI version and distinguish executed tests from pending remote checks.

**Dependencies:** 8, 9

**Files likely touched:** scripts/validate-codex-test.js; docs/codex-setup.md; adapters/codex/README.md; .github/workflows/test-codex-adapter.yml

**Estimated scope:** Medium. Generated dist/codex release files are reproducible build outputs tracked in Git.

## Checkpoint after Task 10

- [ ] Record passing focused checks and runtime smoke-test evidence.
- [ ] Review the resulting behavior, references, and unsupported capabilities before continuing.
