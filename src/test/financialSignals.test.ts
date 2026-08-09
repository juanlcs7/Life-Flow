import { describe, expect, it } from "vitest";
import { buildFinancialSignals } from "@/lib/financialSignals";
import type { Transaction } from "@/hooks/useTransactions";

const transaction = (id: string, date: string, type: "income" | "expense", amount: number, category: string): Transaction => ({ id, date, type, amount, category, description: id, account_id: null, user_id: "user", created_at: `${date}T12:00:00Z`, reviewed_at: date });

describe("financial signals", () => {
  it("detects a category accelerating against the previous month", () => {
    const signals = buildFinancialSignals([
      transaction("old", "2026-07-10", "expense", 100, "Lazer"),
      transaction("new", "2026-08-05", "expense", 100, "Lazer"),
      transaction("salary", "2026-08-01", "income", 3000, "Salário"),
    ], new Date(2026, 7, 10));
    expect(signals.some((signal) => signal.id === "pace-Lazer" && signal.severity === "danger")).toBe(true);
  });

  it("detects an unusual recent expense", () => {
    const signals = buildFinancialSignals([
      transaction("a", "2026-05-01", "expense", 40, "Comida"),
      transaction("b", "2026-06-01", "expense", 45, "Comida"),
      transaction("c", "2026-07-01", "expense", 50, "Comida"),
      transaction("large", "2026-08-08", "expense", 300, "Comida"),
    ], new Date(2026, 7, 9));
    expect(signals.some((signal) => signal.id === "unusual-large")).toBe(true);
  });
});
