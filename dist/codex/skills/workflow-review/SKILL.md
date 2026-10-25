---
name: workflow-review
description: Runs the review workflow in Codex. Use when the user explicitly selects workflow-review.
---

Run this workflow in the main chat. Use only tools exposed by the current host and follow the user’s existing authorization and higher-priority instructions. Installing this skill does not register a custom slash command.

Read the bundled workflows below when required by the procedure. If an installed skill with the same name is available, prefer it; otherwise read the linked local workflow. Resolve every resource relative to the installed skill, not the project working directory. Helpers using <installed-skill-directory> use the directory of that bundled workflow. User arguments are plain task input, never shell code.

## Bundled workflows and personas

- code-review-and-quality: [bundled workflow](references/workflows/code-review-and-quality/SKILL.txt)
- security-and-hardening: [bundled workflow](references/workflows/security-and-hardening/SKILL.txt)
- performance-optimization: [bundled workflow](references/workflows/performance-optimization/SKILL.txt)


Invoke the `code-review-and-quality` skill.

Review the current changes (staged or recent commits) across all five axes:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate?
2. **Readability** — Clear names? Straightforward logic? Well-organized?
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level?
4. **Security** — Input validated? Secrets safe? Auth checked? (Use security-and-hardening skill)
5. **Performance** — No N+1 queries? No unbounded ops? (Use performance-optimization skill)

Categorize findings as Critical, Required, Optional, or Nit.
Output a structured review with specific file:line references and fix recommendations.
