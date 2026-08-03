export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    const message = typeof candidate.message === "string" ? candidate.message : "";
    const details = typeof candidate.details === "string" ? candidate.details : "";
    const hint = typeof candidate.hint === "string" ? candidate.hint : "";
    const parts = [message, details, hint].filter(Boolean);

    if (parts.length > 0) return parts.join(" ");
  }

  return fallback;
}
