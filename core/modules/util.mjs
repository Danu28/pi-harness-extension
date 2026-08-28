// util.mjs — tiny shared helpers for the harness core.
/** Rough token estimate (chars/4). Good enough for budget/truncation decisions. */
export function estimateTokens(text) {
  return Math.ceil(String(text ?? "").length / 4);
}
