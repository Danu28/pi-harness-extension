# Implementation Plan — Harness Cleanup (audit findings #1–#3)

**Source:** audit of the pi-harness-runtime extension (`index.ts`, `entry/`, `core/`,
`prompts/`, install scripts) — 7.2k LOC scanned, verified against the live suite
(`node --test "core/test/*.test.mjs"` → 111 pass / 0 fail).

**Constraint (hard):** zero functional impact. Every removal below was confirmed
unused by a whole-repo reference scan (`index.ts` + all `entry/*.ts` + all 11 test
files). None of these reach a runtime code path. The gate suite must stay green
before and after every task.

**Out of scope (deliberately not in this plan):** the audit also flagged the
install.sh / install-dev.sh duplication (~15 duplicated lines). It is excluded —
both scripts live in different dirs and self-contained files are more robust to
layout surprises; the risk/benefit does not justify the refactor.

---

## Task 1 — Delete 14 dead barrel re-exports in `core/harness-core.mjs`

**What:** remove these `export { X } from "./modules/…"` lines from the three
"Batch" re-export blocks:

```
ACCEPT_VERDICTS, AI_CAP, LANES, PERSONA_TAXONOMY, SCRIPT_NAMES, THINK_LEVELS,
findFilesByExt, findProjectJsFiles, fmt, gitDiff, loadScripts, repoRoot, tscCommand, saveGateCache
```

**Why safe:** none of these names are imported from the barrel by `index.ts`,
`entry/*.ts`, or the test files. Each still exists in its own module:
- `saveGateCache` — called directly by `recordGreen` in `state.mjs`
- `gitDiff` — imported directly by `report.mjs` from `./git.mjs`
- `AI_CAP` / `LANES` / `THINK_LEVELS` / `PERSONA_TAXONOMY` — imported by `parse.mjs` directly from `./constants.mjs`
- `findFilesByExt`, `findProjectJsFiles`, `loadScripts`, `repoRoot`, `tscCommand` — used internally within `detect.mjs`
- `fmt` — used internally within `report.mjs`
- `ACCEPT_VERDICTS`, `SCRIPT_NAMES` — defined but referenced nowhere at runtime

Only the barrel re-export lines are removed; module definitions are untouched.

- verify: `node --test "core/test/*.test.mjs"` → still 111 pass / 0 fail; grep confirms the 14 names no longer appear in `core/harness-core.mjs` (footprint: none)

## Task 2 — Delete unused imports in the entry layer

**What:** remove four imports that are never referenced at their call site:
- `reportColor` — no call site outside the import [`index.ts:85`]
- `autoCommit`, `verifyTier` — imported at [`entry/index-consts.ts:5`] but only the `autoCommit: boolean` field and `verifyTier` type are used, not the functions. Remove them from the import statement only (keep CORE_VERSION).
- `color`, `tail` — [`entry/report.ts:3`]; `{ color: false }` is an options object key, not the `color` symbol; `tail` appears only inside a string literal.
- `ExtensionAPI` — type import [`entry/settle.ts:3`], never used (only `ExtensionCommandContext` is).

**Why safe:** all four are import-statement-only references; removing them cannot
change behavior.

- verify: `node --test "core/test/*.test.mjs"` still green; `tsc`/`jiti` load of `index.ts` + the touched `entry` files shows no "declared but never used" errors (footprint: none)

## Task 3 — Fix stale test-runner comments (all 11 test files)

**What:** in each of `core/test/{artifacts,detect,git,misc,output,parse,report,safety,stages,state,thinking}.test.mjs`, replace the header line
`// Unit tests for the pure harness core. Run: node --test harness-core.test.mjs`
with the correct invocation: `// Run: node --test "core/test/*.test.mjs"`.

**Why:** `harness-core.test.mjs` no longer exists — the suite is split per module
and the directory glob is the real entry point. Cosmetic (comment-only), keeps the
"how to run" hint honest.

- verify: header line updated in all 11 files; `node --test "core/test/*.test.mjs"` still green (footprint: none)

---

## Do not cut (checked and must stay)

These are referenced by tests or cross-module and were confirmed NOT dead:
`probe`, `gitPorcelain`, `statusFromPorcelain`, `setFromPorcelain`, `taskTerms`,
`taskScore`, `symbolsForFile`, `changedFileHeads`, `extractFailures`, `gateCacheKey`,
`globToRegExp`, `loadGateCache`, `parseTestFailures`, `shq`, `stripAcceptanceBlocks`,
`TEMP_DIR`, `LONGTERM_DIR`.

Runtime-loaded assets (`core/compile-skills.mjs`, `core/skillcards/`, `prompts/run.md`)
and the `getAgentDir()` legacy-install fallbacks are also untouched.

## Risk Notes
None. No network, auth, user-input, DB, or filesystem writes outside the existing
extension dirs; no runtime code paths are modified (Tasks 1–2 remove dead references,
Task 3 is comment-only). Verify gate is the syntax checker + unit suite.

## Acceptance
- [x] All three tasks specified in dependency order with exact verify checks and footprint tags
- [x] Every removal traces to a confirmed-unused reference (no behavioral change)
- [x] No task touches runtime behavior; suite stays green
- [x] Speculative refactors (install-script dedup) explicitly excluded with reasoning