# Codex persona orchestration

## Parallel fan-out with a merge step
The main workflow supplies scope, constraints, persona instructions and evidence to independent native subagents, then merges their complete reports. Personas do not delegate to other personas. Read-only reviews may run concurrently; shared edits require coordination and are excluded from the ship reviewers.

## Direct persona invocation
A persona skill in the current chat adopts its role and report format. It does not establish independent context, add tools, change permissions or replace higher-priority instructions. To obtain independent review, the main session must use actual authorized subagent tools.

## Missing capability
Disclose missing delegation or measurement tools. Do not call sequential same-context role switching parallel or fresh-context review. Report incomplete verification explicitly. The ship workflow supplies its exact BLOCKED behavior and narrowly scoped small-change exemption.

## Anti-patterns
Do not create a router persona to select other personas. Do not let personas recursively delegate. Do not invent measured results, passed checks, independent reviewers or approval. Keep the original reports and evidence visible in the synthesis.
