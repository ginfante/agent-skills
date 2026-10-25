# Verification record: Codex adapter 0.1.0

Date: 2026-10-25. Local host: macOS. Native installer: skills 1.7.4 on Node 24.19.0. Fresh Codex CLI smoke session: codex-cli 0.163.0-alpha.11.1. Upstream baseline: aeac41d4d005999432bb7312f7ff06383a91d59d.

## Evidence collected

- Baseline: 213 existing tooling tests passed; all canonical skill, reference, version, command-parity and artifact-path validators passed. Deterministic canonical routing: 143 checks, 100% rank-1 (91/91), above the existing 95% minimum.
- Added 29 generator, validation and instruction-contract tests. Concrete review regressions include path/URL corruption, transitive workflow resource bundling, shared override review, license/source symlinks, output ancestor aliases and failed-publication restoration. Validation faults are exercised from changed source fixtures, not only tampered generated output.
- Native CLI discovery: all 38 entries (25 originals, nine workflows, four personas).
- Temporary project installations: full default and copy modes, selective ship, and a secondary agent symlink; all installed source/resource bytes compared with the generated pack. No personal global pack installation performed.
- Independent specialist reviews: code-reviewer, security-auditor and test-engineer ran in parallel as actual separate subagents, reading their installed persona instructions. They returned complete reports to the main session. Concrete correctness and security findings were fixed with reproduction tests, then independently re-reviewed. No unresolved blocking source issue remained in the recheck; generated output required rebuilding after those fixes.
- Fresh read-only CLI chat outside the checkout: loaded installed persona-web-performance-auditor; selected Quick mode with no source/URL/artifacts; reported all metrics as not measured, correctly distinguished current-context persona invocation from independent review, and read the installed checklist. It performed no browsing, installation, edits or delegation.

## Scope of these results

Instruction-contract tests establish that required instructions survive packaging. They are not live proof of all model behaviors. The independent reviews demonstrate real separate reviewer contexts and parent synthesis, not an automatic invocation of every possible ship branch. The fresh performance smoke did not perform a browser measurement.

The following remain scenario coverage to expand: actual mutating single-task/auto build runs in fixture repositories; every ship failure/tool-availability/exemption branch; supplied-metric Deep mode; and install/update behavior across every Codex host version. CI is configured for Linux, macOS and Windows; local verification alone does not claim those remote jobs passed.

Remote distribution/tag installation and source lock/update checks are recorded separately when executed. A first adapter release has no preceding adapter tag to roll back to; explicit tag reinstallation is the reproducibility mechanism. Do not claim a prior-release rollback was exercised.
