# Codex adaptation verification

The upstream evaluator remains unchanged and checks canonical routing at its existing 95% rank-1 minimum. Its deterministic routing result is not a live Codex behavioral result.

`node --test scripts/codex-workflows-test.js` checks published instruction contracts: command modes and artifact paths, main-chat review/test, role boundaries, web-performance metric honesty and ship review/rollback requirements. These tests verify that instructions survive generation; they do not prove a model follows them.

`node --test scripts/build-codex-test.js scripts/validate-codex-test.js` checks packaging, references, source-review gates, symlinks, output preservation and deterministic generation. `scripts/smoke-codex-install.js` exercises the actual native installer in temporary directories.

For live behavioral evaluation, record the target Codex/CLI version, exact installed source, input prompt, tools actually available, resources read, output, and reviewer assessment. Required cases include:

| Skill | Scenario and pass condition |
|---|---|
| workflow-build | Default performs one task; auto/all require a spec and authorized plan, preserve unrelated changes and stop on failed verification. |
| workflow-ship | Three genuinely independent read-only reviewers; complete source reports retained in synthesis; missing/failed report blocks verified GO. |
| workflow-ship | No delegation tools: disclose BLOCKED. Exemption only for <=2 files, <50 lines and no sensitive categories; unknown scope is not exempt. |
| workflow-webperf | No metrics: Quick mode and potential-impact labels, no fabricated measurements. Deep mode cites actual artifacts. |
| All personas | Direct invocation does not claim independent context or change permissions; roles preserve their report contracts and do not delegate. |

Run behavioral cases in disposable fixture projects. Do not run mutating build-mode tests in a personal production repository. Never label a structural assertion as an executed behavioral scenario. Reports in adapters/codex/verification.md distinguish evidence collected for this release from future regression scenarios.
