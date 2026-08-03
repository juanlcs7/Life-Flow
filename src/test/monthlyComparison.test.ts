import { describe, expect, it } from "vitest";
import type { Transaction } from "@/hooks/useTransactions";
import { calculateMonthlyComparison } from "@/lib/monthlyComparison";

const transaction = (
  id: string,
  date: string,
  type: "income" | "expense",
  amount: number,
  category: string,
): Transaction => ({
  id,
  user_id: "user-1",
  date,
  type,
  amount,
  category,
  description: category,
  account_id: null,
  created_at: `${date}T12:00:00Z`,
});

describe("calculateMonthlyComparison", () => {
  it("compara receitas, despesas e saldo com o mês anterior", () => {
    const result = calculateMonthlyComparison([
      transaction("1", "2026-07-05", "income", 2000, "Salário"),
      transaction("2", "2026-07-10", "expense", 600, "Casa"),
      transaction("3", "2026-06-05", "income", 1000, "Salário"),
      transaction("4", "2026-06-10", "expense", 500, "Casa"),
    ], new Date(2026, 6, 15));

    expect(result.current).toMatchObject({ income: 2000, expenses: 600, balance: 1400 });
    expect(result.previous).toMatchObject({ income: 1000, expenses: 500, balance: 500 });
    expect(result.incomeChange).toBe(100);
    expect(result.expenseChange).toBe(20);
    expect(result.balanceChange).toBe(180);
  });

  it("não inventa percentual quando o mês anterior está zerado", () => {
    const result = calculateMonthlyComparison([
      transaction("1", "2026-07-05", "income", 900, "Freelance"),
    ], new Date(2026, 6, 15));

    expect(result.incomeChange).toBeNull();
    expect(result.expenseChange).toBe(0);
  });

  it("encontra a categoria com o maior aumento de despesas", () => {
    const result = calculateMonthlyComparison([
      transaction("1", "2026-07-05", "expense", 500, "Mercado"),
      transaction("2", "2026-07-06", "expense", 250, "Lazer"),
      transaction("3", "2026-06-05", "expense", 200, "Mercado"),
      transaction("4", "2026-06-06", "expense", 200, "Lazer"),
    ], new Date(2026, 6, 15));

    expect(result.largestExpenseIncrease).toMatchObject({
      category: "Mercado",
      difference: 300,
    });
  });
});

