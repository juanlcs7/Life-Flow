import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTransactions } from "@/hooks/useTransactions";

const categoryColors: Record<string, string> = {
  "Moradia": "hsl(250, 70%, 60%)",
  "Alimentação": "hsl(175, 70%, 40%)",
  "Transporte": "hsl(15, 90%, 60%)",
  "Lazer": "hsl(140, 65%, 50%)",
  "Saúde": "hsl(200, 80%, 50%)",
  "Educação": "hsl(320, 70%, 55%)",
  "Outros": "hsl(40, 80%, 50%)",
};

export function FinanceOverview() {
  const { transactions, isLoading } = useTransactions();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

  const monthlyTransactions = transactions.filter(t => t.date >= monthStart);
  
  const totalIncome = monthlyTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpenses = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Group expenses by category
  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      const cat = t.category || "Outros";
      acc[cat] = (acc[cat] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || "hsl(220, 15%, 50%)",
  }));

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center justify-center h-48"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-card rounded-xl p-5 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Finanças do Mês</h3>
        <Link to="/financas" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver detalhes <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma transação registrada</p>
          <Link to="/financas" className="text-sm text-primary hover:underline mt-2 inline-block">
            Adicionar transação
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-32 h-32">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Sem despesas
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Receitas</span>
              </div>
              <span className="text-sm font-semibold text-success">
                R$ {totalIncome.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">Despesas</span>
              </div>
              <span className="text-sm font-semibold text-destructive">
                R$ {totalExpenses.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Saldo</span>
                <span className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {(totalIncome - totalExpenses).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
