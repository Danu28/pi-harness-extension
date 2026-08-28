// store.mjs — best-effort JSON array persistence (gap #2/#3/#6 stores).
import { join, dirname } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

/** Best-effort read of a JSON array under `{ [key]: [...] }`. Returns [] when
 *  missing, unreadable, or non-array. Caller does its own slicing/cap. */
export function readJsonStore(cwd, file, key) {
  try {
    const recs = JSON.parse(readFileSync(join(cwd, file), "utf8") ?? "{}")?.[key];
    return Array.isArray(recs) ? recs : [];
  } catch {
    return [];
  }
}

/** Best-effort persist of `{ [key]: arr }` (mkdir parent, swallow errors). */
export function writeJsonStore(cwd, file, key, arr) {
  try {
    mkdirSync(join(cwd, dirname(file)), { recursive: true });
    writeFileSync(join(cwd, file), JSON.stringify({ [key]: arr }, null, 2), "utf8");
  } catch {
    /* best-effort */
  }
}
