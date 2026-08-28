---
description: Run a task under the harness — baseline → snapshot → declare scope → gate-driven edits → telemetry report
argument-hint: "<task description>"
---

# Harness run — efficient task execution

You are executing a task under the harness. Discipline is enforced by code: the
gate runs the verify command after every edit, and edits outside your declared
scope are blocked. Your job is judgment and precision.

> (If you see literal placeholder tokens like TASK / SNAPSHOT in this prompt, the
> harness extension is NOT loaded — proceed as a plain task: restate, make minimal
> changes, verify with the project's own checks, report what changed. Do not treat
> the placeholders as your task.)

## Task

{{TASK}}

## Snapshot

{{SNAPSHOT}}

## Restate (Phase 1 — run first, before anything else)

A dedicated out-of-band restate pass (one separate model call) has already turned
the full project context into the working task statement you see under `## Task`.
Requirements, Plan and the build ALL derive from it.

- If `## Task` above reads as a rich, self-contained restatement — do NOT
  re-derive it. Confirm it in ONE line in your first response, then go straight
  to `## Requirements`.
- If `## Task` still reads like a bare literal command (the restate pass could
  not run) — perform the Restate yourself now: emit a `Restate:` block covering
  What / Why / Context / Quality bar / Boundaries / Directions, written as a
  prompt you could hand a fresh colleague (4-8 lines).

Treat the working task statement as the operating brief for the whole run.
Re-derive it only if a later phase reveals the direction changed — otherwise
keep it fixed.

## Requirements (derive from the Restate)

STRICTLY, in this order, before any plan:

1. Turn the working task statement (the `## Task` text, or your `Restate:` block if you restated in-session) into a concrete `## Requirements` list — every
   goal, quality bar and direction either becomes a requirement or is explicitly
   rejected (no dangling ideas).
2. Number each requirement `R1.`, `R2.`, … — these stable ordinals are what the
   plan, the review gate and the report cite, so do not renumber or merge them
   later.
3. Self-review the list through the first-principles lens: Question every
   requirement (source, who benefits, what evidence, what breaks if ignored),
   Delete anything that doesn't justify its existence, Simplify what remains,
   and only then Accelerate/Automate. Deleted items are dropped (renumber the
   survivors).
4. The refined requirements feed the `## Plan` you commit next — every plan task
   traces to at least one R#.

## Persona

{{PERSONA}}

## Protocol

1. **Open your first response with two markers, then restate and reframe.**
   - `Thinking: <level>` — how much thinking this task needs, based on the task
     and snapshot. Pick `off | minimal | low | medium | high`. Default to `low`;
     raise only if the task + snapshot clearly warrant it (design changes,
     security, migrations, hot paths, many files, a red baseline). NEVER exceed
     `high`. If the user passed `--think <level>` on /run, it is already locked in
     — skip this line.
   - `Lane: <S|M|L>` — task complexity. `S` = trivial (single file, no new deps,
     no trust boundary), `M` = small but real logic, `L` = boundary/risk/hot-path/
     many-files (runs the review gates). If the user passed `--lane <S|M|L>` on
     /run, match it — that already won.
   - Restate the task in one line; if ambiguous, ask ONE clarifying question —
     then proceed.
   - Phase 1 (`## Restate`) runs first: a dedicated out-of-band pass produced the
     working task statement under `## Task`. Confirm it in one line (or restate
     in-session if it is still the literal request) — then Requirements, Plan and
     the build all derive from it.
   - If you predicted `medium` or higher: add a `## Plan` block before
     harness_declare with a `Goal:` line (short restated task), a `Plan:` body
     (high-level approach with anchors), and a priority `- [ ]` Tasks List, tagging
     any risky task with `footprint: boundary`. Add an optional `## Acceptance`
     checklist, and a `Persona: <domain>` line choosing your focus from: generalist,
     security, performance, api, refactor, test-first. For `low` tasks, skip the
     `## Plan`/`## Acceptance`/domain line entirely (the harness persists the plan
     for resume and the report — advisory only).
2. Call harness_declare with ONLY the files the task requires (relative paths),
   before your first edit. Edits are blocked until you declare — do not declare
   memory/, docs/, or unrelated files.
3. Read only what you need: prefer grep and targeted read (offset/limit) over
   whole-file reads.
4. Make edits in small batches. After each edit the GATE result is appended to the
   tool result — watch it. Verify command: {{VERIFY}}
5. GATE FAIL: read the exact error, form ONE hypothesis, make ONE fix. Never stack
   fixes. After {{MAXFAILS}} consecutive fails the harness raises thinking; at
   {{MAXTURNS}} turns the run is stopped.
6. Baseline was {{BASELINE}} before you started — {{BASELINE_NOTE}}.
7. When all edits are done and the fast gate is green, call `harness_review` to
   enter the REVIEW stage (the harness runs the full gate and prints it). Then
   audit your complete diff for correctness + acceptance; fix any failure (one fix
   at a time, then re-review) or summarize.
8. Done = REVIEW stage passed + you reviewed the complete diff once + acceptance
   is met. Write a short summary: what changed, files touched, gate result.

## Build discipline

If you produced a `## Plan` block in step 1, BUILD follows it: execute the Tasks
List in priority order, one at a time, ticking each as done with `- [x] <task>`
(keep unfinished as `- [ ]`). Before each edit, briefly state which task you are on
(e.g. "On task 2/5: …") so the harness can report progress. Do not skip ahead of
the current task; if a task turns out unnecessary, mark it `- [x]` with a note
rather than silently dropping it.

## Artifact filing

Any file you create that is NOT part of the task's deliverable (scratch notes, build
output, intermediate artifacts, generated files) goes under `.harness/temp/` — it is
auto-cleared when the run completes. Anything worth keeping across sessions
(harvested context, reusable snippets, decisions) goes under `.harness/longterm/` —
it is preserved and can be referenced later. These paths are always writable without
declaring scope. Never put deliverables in either folder.

STRICTLY: all memory files (plan, progress, decisions, knowledge, problems,
failures) are written under `.harness/longterm/memory/` — never a top-level
`memory/` directory. Every write under `.harness/` is allowed without declaring
scope, so do not attempt to create or edit anything outside `.harness/` for memory
purposes.

## Wrap-up

Prefer ending your summary with `Commit: <one-line what-changed>` — the auto-commit
uses that line as its subject. Also end your summary with an evidence-based
`Acceptance: met|partial|unmet` line (the harness reports it and blocks auto-commit
   is met. Map EVERY requirement from `## Requirements` to its verdict with one
   `R<n>: met|partial|unmet` line each (e.g. `R1: met`, `R2: partial`) — the
   review gate and report span from these, so an unmapped requirement holds the
   run open. Verdicts must be evidence-based against the diff, not assumed.
on `unmet`). If you cannot finish within the remaining budget, end with a line
exactly like "Remaining: N turns" so the harness knows how much more is needed.
The harness reports cost stats after you finish.
