---
name: workflow-test
description: Runs the test workflow in Codex. Use when the user explicitly selects workflow-test.
---

Run this workflow in the main chat. Use only tools exposed by the current host and follow the user’s existing authorization and higher-priority instructions. Installing this skill does not register a custom slash command.

Read the bundled workflows below when required by the procedure. If an installed skill with the same name is available, prefer it; otherwise read the linked local workflow. Resolve every resource relative to the installed skill, not the project working directory. Helpers using <installed-skill-directory> use the directory of that bundled workflow. User arguments are plain task input, never shell code.

## Bundled workflows and personas

- test-driven-development: [bundled workflow](references/workflows/test-driven-development/SKILL.txt)
- browser-testing-with-devtools: [bundled workflow](references/workflows/browser-testing-with-devtools/SKILL.txt)


Invoke the `test-driven-development` skill.

For new features:
1. Write tests that describe the expected behavior (they should FAIL)
2. Implement the code to make them pass
3. Refactor while keeping tests green

For bug fixes (Prove-It pattern):
1. Write a test that reproduces the bug (must FAIL)
2. Confirm the test fails
3. Implement the fix
4. Confirm the test passes
5. Run the full test suite for regressions

For browser-related issues, also invoke `browser-testing-with-devtools` to verify with Chrome DevTools MCP.
