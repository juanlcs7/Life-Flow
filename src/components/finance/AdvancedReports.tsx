import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, Lightbulb, PieChartIcon, Loader2 } from "lucide-react";
import { Transaction } from "@/hooks/useTransactions";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdvancedReportsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))", "#8884d8", "#82ca9d", "#ffc658"];

export function AdvancedReports({ transactions, isLoading }: AdvancedReportsProps) {
  // Category spending data
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Monthly evolution data
  const monthlyEvolution = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthTransactions = transactions.filter((t) => {
        const transDate = parseISO(t.date);
        return transDate >= start && transDate <= end;
      });

      const receitas = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);
      const despesas = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);

      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      });
    }
    return months;
  }, [transactions]);

  // Top spending categories
  const topCategories = categoryData.slice(0, 5);
  const totalExpenses = categoryData.reduce((sum, c) => sum + c.value, 0);

  // AI suggestions based on data
  const suggestions = useMemo(() => {
    const tips: string[] = [];
    
    if (categoryData.length > 0) {
      const topCategory = categoryData[0];
      if (topCategory.value > totalExpenses * 0.3) {
        tips.push(`Você gasta ${((topCategory.value / totalExpenses) * 100).toFixed(0)}% em ${topCategory.name}. Considere revisar esses gastos.`);
      }
    }

    const lastTwoMonths = monthlyEvolution.slice(-2);
    if (lastTwoMonths.length === 2 && lastTwoMonths[1].despesas > lastTwoMonths[0].despesas * 1.2) {
      tips.push("Suas despesas aumentaram mais de 20% em relação ao mês anterior.");
    }

    if (lastTwoMonths.length === 2 && lastTwoMonths[1].saldo < 0) {
      tips.push("Atenção: você gastou mais do que ganhou este mês.");
    }

    if (tips.length === 0) {
      tips.push("Continue mantendo suas finanças equilibradas!");
    }

    return tips;
  }, [categoryData, monthlyEvolution, totalExpenses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Adicione transações para ver os relatórios</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-4 sm:p-5 bg-gradient-to-r from-primary/5 to-primary/10">
          <h3 className="font-display font-semibold text-sm sm:text-base mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            Sugestões de Economia
          </h3>
          <div className="space-y-2">
            {suggestions.map((tip, idx) => (
              <p key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {tip}
              </p>
            ))}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Spending by Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 sm:p-5">
            <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Gastos por Categoria</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {topCategories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Monthly Evolution Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4 sm:p-5">
            <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Evolução Mensal</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={50} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="hsl(var(--success))" name="Receitas" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" name="Despesas" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Top Spending Categories Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4 sm:p-5">
          <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Onde Você Mais Gasta</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
