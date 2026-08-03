import { describe, expect, it } from "vitest";
import type { Transaction } from "@/hooks/useTransactions";
import { calculateMonthForecast } from "@/lib/monthForecast";

const transaction = (
  id: string,
  date: string,
  type: "income" | "expense",
  amount: number,
): Transaction => ({
  id,
  user_id: "user-1",
  date,
  type,
  amount,
  category: type === "income" ? "Receita" : "Outros",
  description: "Teste",
  account_id: null,
  created_at: `${date}T12:00:00Z`,
});

describe("calculateMonthForecast", () => {
  it("projeta as despesas pelo gasto diário médio", () => {
    const result = calculateMonthForecast([
      transaction("1", "2026-07-01", "income", 3000),
      transaction("2", "2026-07-02", "expense", 100),
      transaction("3", "2026-07-10", "expense", 900),
    ], new Date(2026, 6, 10, 12));

    expect(result.elapsedDays).toBe(10);
    expect(result.totalDays).toBe(31);
    expect(result.averageDailyExpense).toBe(100);
    expect(result.projectedExpenses).toBe(3100);
    expect(result.projectedBalance).toBe(-100);
    expect(result.expectedAdditionalExpenses).toBe(2100);
  });

  it("ignora outros meses e transações futuras", () => {
    const result = calculateMonthForecast([
      transaction("1", "2026-06-30", "expense", 500),
      transaction("2", "2026-07-05", "expense", 100),
      transaction("3", "2026-07-20", "expense", 900),
    ], new Date(2026, 6, 10, 12));

    expect(result.expensesSoFar).toBe(100);
  });

  it("não multiplica parcelas e soma compromissos fixos futuros apenas uma vez", () => {
    const result = calculateMonthForecast([
      { ...transaction("1", "2026-07-01", "expense", 500), description: "Notebook (2/10)" },
      transaction("2", "2026-07-02", "expense", 100),
    ], new Date(2026, 6, 10, 12), {
      fixedExpensePatterns: [{ description: "Notebook (2/10)", amount: 500 }],
      upcomingFixedExpenses: 200,
    });

    expect(result.fixedExpensesSoFar).toBe(500);
    expect(result.variableExpensesSoFar).toBe(100);
    expect(result.projectedExpenses).toBe(1010);
    expect(result.expectedAdditionalExpenses).toBe(410);
  });

  it("aumenta a confiança conforme há gastos em mais dias", () => {
    const transactions = Array.from({ length: 7 }, (_, index) =>
      transaction(String(index), `2026-07-${String(index + 1).padStart(2, "0")}`, "expense", 10),
    );

    expect(calculateMonthForecast(transactions, new Date(2026, 6, 10, 12)).confidence).toBe("high");
  });
});
