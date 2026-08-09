export interface FinancialHealthInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  liquidBalance: number;
  monthlyCommitments: number;
  hasIncomePlan: boolean;
  hasAccounts: boolean;
  hasBudgets: boolean;
  hasGoals: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function buildFinancialHealthScore(input: FinancialHealthInput) {
  const income = Math.max(0, input.monthlyIncome);
  const expenses = Math.max(0, input.monthlyExpenses);
  const savingsRate = income > 0 ? (income - expenses) / income : expenses > 0 ? -1 : 0;
  const reserveMonths = expenses > 0 ? input.liquidBalance / expenses : input.liquidBalance > 0 ? 3 : 0;
  const commitmentRate = income > 0 ? input.monthlyCommitments / income : input.monthlyCommitments > 0 ? 1 : 0;

  const cashflow = income <= 0 ? 5 : Math.round(clamp(15 + savingsRate * 60, 0, 30));
  const reserve = Math.round(clamp((reserveMonths / 3) * 25, 0, 25));
  const commitments = Math.round(commitmentRate <= 0.3 ? 20 : clamp(20 - ((commitmentRate - 0.3) / 0.5) * 20, 0, 20));
  const planningChecks = [input.hasIncomePlan, input.hasAccounts, input.hasBudgets, input.hasGoals];
  const planning = Math.round((planningChecks.filter(Boolean).length / planningChecks.length) * 25);
  const score = clamp(cashflow + reserve + commitments + planning, 0, 100);

  const label = score >= 80 ? "Fluxo forte" : score >= 60 ? "Boa evolução" : score >= 40 ? "Em construção" : "Precisa de atenção";
  const dimensions = [
    { id: "cashflow", label: "Fluxo do mês", score: cashflow, max: 30 },
    { id: "reserve", label: "Reserva", score: reserve, max: 25 },
    { id: "commitments", label: "Compromissos", score: commitments, max: 20 },
    { id: "planning", label: "Planejamento", score: planning, max: 25 },
  ];
  const weakest = [...dimensions].sort((a, b) => a.score / a.max - b.score / b.max)[0];
  const recommendations: Record<string, { title: string; description: string; href: string }> = {
    cashflow: { title: income <= 0 ? "Cadastre sua renda mensal" : "Ajuste o ritmo de gastos", description: income <= 0 ? "Com sua renda registrada, as projeções e decisões ficam mais precisas." : "Revise as categorias que estão consumindo mais renda neste mês.", href: "/financas" },
    reserve: { title: "Fortaleça sua reserva", description: "Defina uma meta para construir ao menos três meses do seu custo médio.", href: "/financas" },
    commitments: { title: "Reduza compromissos fixos", description: "Revise assinaturas, parcelas e dívidas que pressionam sua renda mensal.", href: "/financas" },
    planning: { title: "Complete seu plano financeiro", description: "Cadastre contas, limites por categoria e uma meta para o seu dinheiro.", href: "/financas" },
  };

  return { score, label, savingsRate, reserveMonths, commitmentRate, dimensions, recommendation: recommendations[weakest.id] };
}
