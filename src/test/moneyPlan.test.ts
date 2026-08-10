import { describe, expect, it } from "vitest";
import { buildMoneyPlan } from "@/lib/moneyPlan";

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
});
