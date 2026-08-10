import { describe, expect, it } from "vitest";
import { buildSmartBudgetSuggestions } from "@/lib/smartBudget";
import type { Transaction } from "@/hooks/useTransactions";

const expense = (id: string, date: string, amount: number, category = "Mercado"): Transaction => ({ id, user_id: "user", type: "expense", amount, category, description: id, date, account_id: null, created_at: `${date}T12:00:00Z`, reviewed_at: date });

describe("smart budget", () => {
  it("uses the last three complete months and adds a safety margin", () => {
    const suggestions = buildSmartBudgetSuggestions([
      expense("july", "2026-07-10", 300),
      expense("june", "2026-06-10", 320),
      expense("may", "2026-05-10", 280),
      expense("current", "2026-08-02", 999),
    ], new Date(2026, 7, 9));
    expect(suggestions[0]).toMatchObject({ category: "Mercado", average: 300, suggestedAmount: 320, confidence: "high" });
  });

  it("requires history in at least two months", () => {
    expect(buildSmartBudgetSuggestions([expense("only", "2026-07-10", 300)], new Date(2026, 7, 9))).toEqual([]);
  });
});
