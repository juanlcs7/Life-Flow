import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from "date-fns";

export function monthlyEquivalent(amount: number, frequency: "weekly" | "monthly" | "yearly") {
  if (frequency === "weekly") return amount * 52 / 12;
  if (frequency === "yearly") return amount / 12;
  return amount;
}

export function isDateInMonth(date: string, reference: Date) {
  return isWithinInterval(parseISO(date), {
    start: startOfMonth(reference),
    end: endOfMonth(reference),
  });
}

export function activeInstallmentMonthlyImpact(
  installments: Array<{ id: string; installment_amount: number }>,
  payments: Array<{ installment_id: string; paid: boolean }>,
) {
  const activeIds = new Set(payments.filter((payment) => !payment.paid).map((payment) => payment.installment_id));
  return installments
    .filter((installment) => activeIds.has(installment.id))
    .reduce((sum, installment) => sum + installment.installment_amount, 0);
}
