import { describe, expect, it } from "vitest";
import { buildMoneyPlan, calculateSafeToSpend, simulatePurchaseImpact } from "@/lib/moneyPlan";

describe("money plan", () => {
  it("does not double count commitments already covered by a category budget", () => {
    const plan = buildMoneyPlan({ income: 5000, commitments: [{ category: "Streaming", amount: 100 }], budgets: [{ category: "Streaming", amount: 250 }, { category: "Mercado", amount: 800 }], goals: [] });
    expect(plan.fixed).toBe(100);
    expect(plan.variable).toBe(950);
    expect(plan.unassigned).toBe(3950);
  });

  it("reserves the monthly amount required by goals", () => {
    const plan = buildMoneyPlan({ income: 3000, commitments: [], budgets: [], goals: [{ name: "Viagem", remaining: 1200, monthsRemaining: 4 }] });
    expect(plan.goals).toBe(300);
    expect(plan.unassigned).toBe(2700);
  });

  it("turns the remaining flexible money into a safe daily amount", () => {
    const safe = calculateSafeToSpend({ unassigned: 300, variableBudget: 900, variableSpent: 600, daysRemaining: 10 });
    expect(safe.available).toBe(600);
    expect(safe.daily).toBe(60);
  });

  it("never recommends spending money when the plan is overallocated", () => {
    const safe = calculateSafeToSpend({ unassigned: -200, variableBudget: 500, variableSpent: 700, daysRemaining: 5 });
    expect(safe.available).toBe(0);
    expect(safe.daily).toBe(0);
  });

  it("simulates how a purchase changes the daily allowance", () => {
    const simulation = simulatePurchaseImpact({ amount: 300, available: 1200, daysRemaining: 10 });
    expect(simulation.remaining).toBe(900);
    expect(simulation.dailyBefore).toBe(120);
    expect(simulation.dailyAfter).toBe(90);
    expect(simulation.status).toBe("caution");
  });

  it("warns when a purchase is greater than the safe available money", () => {
    const simulation = simulatePurchaseImpact({ amount: 1300, available: 1200, daysRemaining: 10 });
    expect(simulation.remaining).toBe(0);
    expect(simulation.status).toBe("risk");
  });
});
