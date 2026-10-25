---
name: workflow-webperf
description: Runs the webperf workflow in Codex. Use when the user explicitly selects workflow-webperf.
---

Run this workflow in the main chat. Use only tools exposed by the current host and follow the user’s existing authorization and higher-priority instructions. Installing this skill does not register a custom slash command.

Read the bundled workflows below when required by the procedure. If an installed skill with the same name is available, prefer it; otherwise read the linked local workflow. Resolve every resource relative to the installed skill, not the project working directory. Helpers using <installed-skill-directory> use the directory of that bundled workflow. User arguments are plain task input, never shell code.

## Bundled workflows and personas

- performance-optimization: [bundled workflow](references/workflows/performance-optimization/SKILL.txt)
- browser-testing-with-devtools: [bundled workflow](references/workflows/browser-testing-with-devtools/SKILL.txt)
- web-performance-auditor: [persona instructions](references/personas/web-performance-auditor.md)


`workflow-webperf` targets web applications specifically. Do not use it for utility libraries, CLIs, or server-only code with no browser-facing output.

## Determine the mode

**Deep mode** — activate when any of these is available:
- A Lighthouse JSON report file (e.g. `npx lighthouse <url> --output json --output-path ./report.json`, or `npx -p chrome-devtools-mcp chrome-devtools lighthouse_audit --output-format=json` from the Chrome DevTools MCP CLI)
- A PageSpeed Insights JSON response (includes Lighthouse + CrUX)
- A CrUX API response (requires `CRUX_API_KEY` or `GOOGLE_API_KEY`)
- A DevTools performance trace
- A live URL plus the `chrome-devtools` MCP server configured in the harness (the agent can capture metrics directly via `lighthouse_audit` and `performance_*` tools)
- The Chrome DevTools MCP CLI invoked locally (via `npx -p chrome-devtools-mcp chrome-devtools <tool>` or after `npm i -g chrome-devtools-mcp`) — the user runs commands like `chrome-devtools lighthouse_audit --output-format=json` and passes the JSON output to the agent

**Quick mode** — default when none of the above are available. The agent scans source code for structural anti-patterns and labels every finding as `potential impact`.

## Run the audit

Use native subagent tools, when available and authorized, to delegate a read-only review with the bundled web-performance-auditor instructions. If delegation is unavailable, apply those instructions in the current chat and explicitly label the review as single-context. Pass the reviewer:

- The files, components, or diff under review
- Any artifact paths (Lighthouse JSON, PSI JSON, CrUX response, trace) or pasted JSON content
- The target URL or page name when known
- A note on which mode you expect (Quick or Deep), so the agent surfaces missing inputs if Deep was intended

The subagent returns a scorecard (only populated with sourced values), a ranked list of findings, positive observations, and proactive recommendations.

## Output

Return the full audit report to the user. No synthesis or merge step is needed — this is a single-persona command.
