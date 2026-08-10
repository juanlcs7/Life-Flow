import { describe, expect, it } from "vitest";
import { buildFinancialReport, percentageChange } from "@/lib/financialReports";

const reference = new Date(2026, 7, 15);

describe("financial reports", () => {
  it("uses only the current month in the category breakdown", () => {
    const report = buildFinancialReport([
      { type: "expense", amount: 200, category: "Mercado", date: "2026-08-05" },
      { type: "expense", amount: 900, category: "Viagem", date: "2026-07-05" },
    ], reference);
    expect(report.categories).toEqual([{ name: "Mercado", value: 200, percent: 100 }]);
  });

  it("compares the current month with the previous month", () => {
    const report = buildFinancialReport([
      { type: "income", amount: 3000, category: "Salário", date: "2026-08-01" },
      { type: "expense", amount: 1200, category: "Casa", date: "2026-08-03" },
      { type: "income", amount: 2500, category: "Salário", date: "2026-07-01" },
      { type: "expense", amount: 1000, category: "Casa", date: "2026-07-03" },
    ], reference);
    expect(report.current.balance).toBe(1800);
    expect(report.previous.balance).toBe(1500);
    expect(report.changes.expenses).toBe(20);
  });

  it("handles a previous value of zero without producing infinity", () => {
    expect(percentageChange(500, 0)).toBe(100);
    expect(percentageChange(0, 0)).toBe(0);
  });
});
