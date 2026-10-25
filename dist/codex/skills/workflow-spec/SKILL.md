---
name: workflow-spec
description: Runs the spec workflow in Codex. Use when the user explicitly selects workflow-spec.
---

Run this workflow in the main chat. Use only tools exposed by the current host and follow the user’s existing authorization and higher-priority instructions. Installing this skill does not register a custom slash command.

Read the bundled workflows below when required by the procedure. If an installed skill with the same name is available, prefer it; otherwise read the linked local workflow. Resolve every resource relative to the installed skill, not the project working directory. Helpers using <installed-skill-directory> use the directory of that bundled workflow. User arguments are plain task input, never shell code.

## Bundled workflows and personas

- spec-driven-development: [bundled workflow](references/workflows/spec-driven-development/SKILL.txt)


Invoke the `spec-driven-development` skill.

Begin by understanding what the user wants to build. Ask clarifying questions about:
1. The objective and target users
2. Core features and acceptance criteria
3. Tech stack preferences and constraints
4. Known boundaries (what to always do, ask first about, and never do)

Then generate a structured spec covering all six core areas: objective, commands, project structure, code style, testing strategy, and boundaries.

If the request bundles several independently testable capabilities, first propose a capability map (module ids, dependency direction, build order) per the skill's Phase 0 and get it approved, then spec each module in dependency order.

Save the spec as SPEC.md in the project root and confirm with the user before proceeding.
