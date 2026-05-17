/** Estimated pricing per 1M tokens (USD) — illustrative only */
export const pricingPerMillion = {
  jockey: { input: 2.5, output: 10 },
  gemini: { input: 0.15, output: 0.6 },
} as const;

export function estimateCost(
  model: "jockey" | "gemini",
  outputTokens: number,
  inputTokens = 0
): number {
  const rates = pricingPerMillion[model];
  return (
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output
  );
}

export function formatUsd(amount: number): string {
  if (amount < 0.0001) return "< $0.0001";
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(3)}`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function estimateTokens(charCount: number): number {
  return Math.max(1, Math.ceil(charCount / 4));
}
