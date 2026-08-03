import { describe, expect, it } from "vitest";
import { activeInstallmentMonthlyImpact, isDateInMonth, monthlyEquivalent } from "@/lib/financialCalculations";

describe("financial calculations", () => {
  it("normalizes weekly and yearly subscriptions", () => {
    expect(monthlyEquivalent(100, "weekly")).toBeCloseTo(433.33, 2);
    expect(monthlyEquivalent(1200, "yearly")).toBe(100);
  });

  it("counts only dates inside the reference month without timezone drift", () => {
    const reference = new Date(2026, 7, 15);
    expect(isDateInMonth("2026-08-01", reference)).toBe(true);
    expect(isDateInMonth("2026-08-31", reference)).toBe(true);
    expect(isDateInMonth("2026-09-01", reference)).toBe(false);
  });

  it("ignores completed installment plans in monthly impact", () => {
    const installments = [
      { id: "active", installment_amount: 100 },
      { id: "done", installment_amount: 250 },
    ];
    const payments = [
      { installment_id: "active", paid: false },
      { installment_id: "done", paid: true },
    ];
    expect(activeInstallmentMonthlyImpact(installments, payments)).toBe(100);
  });
});
