# pi-harness

A self-contained runtime extension for the **pi** coding agent that runs
**multi-stage, gated agentic coding runs**: plan → build → verify → report.
Discipline is enforced by code, not by prompt: a verify gate runs after every
edit, edits outside the declared scope are blocked, and the run's acceptance
criteria are checked before anything is committed.

The harness is written as **pure, dependency-free Node.js ESM modules** (`.mjs`)
under `core/`, unit-tested with the built-in `node --test` runner — no package
managers, no third-party dependencies.

## How it works

A single `/run` command breaks a task into strict stages. Each stage carries an
operating-disciplinary "skill card", and a **verify gate** blocks forward
progress until the tree passes.

```
╔════════════╗   ╔═══════════╗   ╔══════════╗   ╔══════════╗   ╔════════════╗
║  PLAN      ║ → ║  REQUIRE  ║ → ║  BUILD    ║ → ║  REVIEW   ║ → ║  REPORT    ║
║ /run args  ║   ║ restate + ║   ║ declare   ║   ║ gate runs ║   ║ snapshot + ║
║ + snapshot ║   ║ derive Req║   ║ scope,    ║   ║ full veri ║   ║ verdicts + ║
╚════════════╝   ╚═══════════╝   ║ edit +     ║   ║ + audit   ║   ║ auto-commit║
                                ║ auto-gate  ║   ╚══════════╝   ╚════════════╝
                                ╚══════════╝
```

- **Plan** — parse `/run` args, snapshot the repo, detect the baseline.
- **Requirements → Build** — the agent restates the task, derives numbered
  requirements, declares exactly the files it will touch, and edits in small
  batches; the **verify gate re-runs after every edit**.
- **Review** — the full verification gate plus a diff audit before finishing.
- **Report** — builds a snapshot summary, maps every requirement to a verdict,
  and auto-commits with a clean subject line.

Stage-to-card mapping (e.g. planning → `first-principles`, build → `builder`,
review → `verifier`) is purely data in `core/modules/stages.mjs`.

## Install

The harness is self-contained: one directory that can be dropped into pi's
extension folder and auto-discovered via `extensions/*/index.ts`.

### From the remote (production)

```bash
./install.sh
```

Clones/pulls the source repo, copies the harness into
`~/.pi/agent/extensions/harness`, and mirrors the run protocol into pi's prompts
dir. Idempotent — a clean replace, no stale files layered on top.

```bash
# then restart pi or run:
/reload
```

### From your local working tree (development)

```bash
./install-dev.sh
```

Same install, but copies your *local* `harness/` dir instead of touching the
remote — iterate → run `./install-dev.sh` → `/reload`, without pushing.

## Verify

The development gates run a syntax check over every `.mjs` module and test file.
Run it yourself:

```bash
node --check core/harness-core.mjs && \
node --check core/modules/constants.mjs && \
node --check core/test/misc.test.mjs && \
node --check core/test/state.test.mjs
```

(That's an abridged sample — the real gate checks all of `core/**/*.mjs`.)

Then run the test suite:

```bash
node --test "core/test/*.test.mjs"
```

## Quickstart (example usage)

```js
// core/modules/report.mjs exposes a snapshot builder — pure, no pi imports.
import { buildSnapshot, reportRows } from "../harness-core.mjs";

const snap = buildSnapshot(process.cwd(), {
  verifyCmd: "node --check core/harness-core.mjs",
  baseline: "GREEN",
  task: "Example task",
});
console.table(reportRows(snap));
```

Add a new module under `core/modules/`, re-export it from the `harness-core.mjs`
barrel, and cover it with a `core/test/*.test.mjs` using `node:test` + `node:assert`.

## Repo layout

```
harness/
├── index.ts              # pi entry point — wires core logic to the agent
├── install.sh            # install/update from the remote source repo
├── install-dev.sh        # sync the local working tree, no push
├── core/
│   ├── harness-core.mjs  # pure barrel — re-exports the whole module surface
│   ├── compile-skills.mjs# compile/validate skill cards
│   ├── modules/          # pure logic, one concern per file (dependency-free)
│   │   ├── constants.mjs # CORE_VERSION, DEFAULT_CONFIG, dirs, color
│   │   ├── detect.mjs    # verify-command detection, gate results
│   │   ├── output.mjs    # token estimates, failure parsing, table rendering
│   │   ├── parse.mjs     # run-args / requirements / plan parsers
│   │   ├── report.mjs    # snapshot & report builders
│   │   ├── safety.mjs    # scope/trust-boundary enforcement
│   │   ├── stages.mjs    # stage→skill-card mapping, lane classification
│   │   ├── state.mjs     # gate cache, green state, run stats
│   │   ├── git.mjs       # porcelain, changed paths, auto-commit
│   │   ├── artifacts.mjs # .harness temp/longterm dir management
│   │   ├── thinking.mjs  # budget & stop-analysis logic
│   │   ├── store.mjs     # tiny key/value disk store
│   │   └── util.mjs      # shared micro-utilities
│   └── test/             # node --test suites, one per module
│       ├── *.test.mjs
│       └── test-utils.mjs
├── entry/                # thin pi-facing glue over core/ (ts)
│   ├── index-consts.ts   # wiring constants
│   ├── protocol.ts       # run-protocol handling
│   ├── report.ts         # final report + verdict rendering
│   ├── settle.ts         # commit/cleanup logic
│   └── thinking.ts
└── prompts/              # run protocol templates (/run protocol)
```

### Where to extend

- **New logic** → `core/modules/<name>.mjs` (pure ESM, no pi imports) +
  test in `core/test/`.
- **Expose it** → re-export from `core/harness-core.mjs`.
- **Wire to pi** → a thin wrapper in `entry/`.
- **Change a stage's skill** → edit the `STAGE_CARD` map in
  `core/modules/stages.mjs`.

## FAQ / Troubleshooting

**`/run` doesn't seem to do anything.** The extension isn't loaded. Re-run
`./install.sh` (or `install-dev.sh`) and then `/reload` in pi.

**`node --check` fails on my new module.** You imported or edited something with
a syntax error, or your file isn't ESM. Ensure the file has a `.mjs` extension
and top-level `export`s compile clean.

**`node --test` reports an import error.** A symbol you imported isn't
re-exported from `core/harness-core.mjs`. Add it to the barrel — the harness
only exposes module functions through that one file.

**My edit is blocked / "outside declared scope".** The safety gate blocks edits
to files you haven't declared. Either declare the file in your scope or don't
touch it. `.harness/` is always writable (run state); deliverables go through
declared scope.

**Install says "clone failed".** No network / the remote repo is unreachable.
Use `./install-dev.sh` (local copy) instead, or restore connectivity.

**After install, `~/.pi/agent/extensions` has an old `harness.ts`.** That's a
legacy flat-layout artifact; both install scripts clean it up automatically.

## License

MIT.