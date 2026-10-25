# Codex adaptation specification

## Objective
Expose the fork's complete skill pack, nine lifecycle workflows and four specialist personas in Codex through native `npx skills add`. The approved implementation plan is tasks/plan.md; tasks are tracked in tasks/todo.md.

## Capabilities and acceptance
- Discover and generate all canonical skills, plus workflow-{spec,plan,build,test,constraints,review,webperf,code-simplify,ship} and persona-{code-reviewer,test-engineer,security-auditor,web-performance-auditor}.
- Preserve canonical source files. Apply Codex-specific translations and reviewed workflow overrides only while generating dist/codex/skills.
- Each installable skill carries its license, required checklists and helper assets. Wrappers bundle their required underlying workflows for selective installation; no absolute checkout paths or sibling resource dependencies.
- Command wrappers are explicitly invoked; direct personas operate in the current chat. Only real delegation provides independent contexts. Personas cannot orchestrate other personas.
- Preserve build modes and verification; webperf distinguishes measured metrics; ship aggregates independent reports and provides a rollback plan. Missing capabilities produce explicit limitations rather than fabricated evidence.
- CLI discovery, full/selective installs, copy/symlink behavior and repeatable rebuilds are checked locally. Remote install, tracked updates and tagged rollback require a pushed source/release and must be reported separately from local verification.

## Architecture and commands
Use Node.js built-ins and the existing node:test convention. `node scripts/build-codex.js` generates the committed distribution; `node scripts/validate-codex.js` checks generated parity, resource integrity and source review hashes. Add focused tests and CI without weakening upstream checks. Wrapper procedures live in adapters/codex; canonical skills stay under skills/.

## Boundaries
Do not modify upstream workflow sources to force portability. Do not change global agent configuration or install globally without an explicit installation request. Do not deploy anything as part of a ship audit. Preserve license attribution. Work in a feature branch; prepare a reviewable change. No API keys or provider API app is needed.
