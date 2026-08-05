import { describe, expect, it } from "vitest";
import {
  buildBalanceForecast,
  buildDebtPayoffPlan,
  buildWeeklyFinancialSummary,
  simulatePurchase,
} from "@/lib/premiumFinancialInsights";

describe("premium financial insights", () => {
  it("builds the weekly summary and compares expenses", () => {
    const summary = buildWeeklyFinancialSummary([
      { type: "income", amount: 1000, category: "Salário", date: "2026-08-04" },
      { type: "expense", amount: 200, category: "Casa", date: "2026-08-03" },
      { type: "expense", amount: 80, category: "Lazer", date: "2026-08-01" },
      { type: "expense", amount: 200, category: "Casa", date: "2026-07-26" },
    ], new Date(2026, 7, 4));

    expect(summary).toMatchObject({ income: 1000, expenses: 280, balance: 720, transactionCount: 3 });
    expect(summary.expenseChangePercent).toBe(40);
    expect(summary.topCategory).toEqual({ name: "Casa", amount: 200 });
  });

  it("projects 30, 60 and 90 days including scheduled commitments", () => {
    const forecast = buildBalanceForecast({
      currentBalance: 1000,
      transactions: [{ type: "income", amount: 900, category: "Salário", date: "2026-08-04" }],
      commitments: [
        { amount: 100, date: "2026-08-20" },
        { amount: 250, date: "2026-10-01" },
      ],
      now: new Date(2026, 7, 4),
    });

    expect(forecast.map((item) => item.scheduledCommitments)).toEqual([100, 350, 350]);
    expect(forecast.map((item) => item.projectedBalance)).toEqual([1200, 1250, 1550]);
  });

  it("classifies the impact of a purchase", () => {
    expect(simulatePurchase({ price: 600, installments: 6, currentBalance: 2000, monthlyIncome: 4000, monthlyCommitments: 800 }).verdict).toBe("comfortable");
    expect(simulatePurchase({ price: 3000, installments: 1, currentBalance: 1000, monthlyIncome: 4000, monthlyCommitments: 800 }).verdict).toBe("risk");
  });

  it("orders debts by strategy and extra payment shortens the plan", () => {
    const debts = [
      { id: "large", name: "Cartão", balance: 5000, annualInterestRate: 24, minimumPayment: 300 },
      { id: "small", name: "Empréstimo", balance: 1000, annualInterestRate: 8, minimumPayment: 100 },
    ];
    const avalanche = buildDebtPayoffPlan(debts, 0, "avalanche");
    const snowball = buildDebtPayoffPlan(debts, 0, "snowball");
    const accelerated = buildDebtPayoffPlan(debts, 300, "avalanche");

    expect(avalanche.order).toEqual(["large", "small"]);
    expect(snowball.order).toEqual(["small", "large"]);
    expect(accelerated.months).toBeLessThan(avalanche.months);
    expect(accelerated.totalInterest).toBeLessThan(avalanche.totalInterest);
  });
});
