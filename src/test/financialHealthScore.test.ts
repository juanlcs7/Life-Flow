import { describe, expect, it } from "vitest";
import { buildFinancialHealthScore } from "@/lib/financialHealthScore";

describe("financial health score", () => {
  it("rewards positive cash flow, reserve and planning", () => {
    const result = buildFinancialHealthScore({ monthlyIncome: 5000, monthlyExpenses: 3000, liquidBalance: 10000, monthlyCommitments: 1000, hasIncomePlan: true, hasAccounts: true, hasBudgets: true, hasGoals: true });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("Fluxo forte");
  });

  it("points to the weakest dimension", () => {
    const result = buildFinancialHealthScore({ monthlyIncome: 5000, monthlyExpenses: 2500, liquidBalance: 0, monthlyCommitments: 500, hasIncomePlan: true, hasAccounts: true, hasBudgets: true, hasGoals: true });
    expect(result.recommendation.title).toBe("Fortaleça sua reserva");
  });
});
