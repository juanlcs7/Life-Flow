import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Filter, Download, Loader2, CreditCard, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useAccounts, Account } from "@/hooks/useAccounts";
import { useFinancialGoals, FinancialGoal } from "@/hooks/useFinancialGoals";
import { useInstallments } from "@/hooks/useInstallments";
import { useSubscriptions, Subscription } from "@/hooks/useSubscriptions";
import { useInvestments } from "@/hooks/useInvestments";
import { TransactionModal } from "@/components/modals/TransactionModal";
import { AccountModal } from "@/components/finance/AccountModal";
import { FinancialGoalModal } from "@/components/finance/FinancialGoalModal";
import { InstallmentModal } from "@/components/finance/InstallmentModal";
import { SubscriptionModal } from "@/components/finance/SubscriptionModal";
import { TransferModal } from "@/components/finance/TransferModal";
import { AddToGoalModal } from "@/components/finance/AddToGoalModal";
import { TransactionFilters, TransactionFilterState } from "@/components/finance/TransactionFilters";
import { FinancialGoalsSection } from "@/components/finance/FinancialGoalsSection";
import { AccountsSection } from "@/components/finance/AccountsSection";
import { InstallmentsSection } from "@/components/finance/InstallmentsSection";
import { SubscriptionsSection } from "@/components/finance/SubscriptionsSection";
import { InvestmentsSection } from "@/components/finance/InvestmentsSection";
import { InvestmentTips } from "@/components/finance/InvestmentTips";
import { AdvancedReports } from "@/components/finance/AdvancedReports";
import { MonthSelector } from "@/components/finance/MonthSelector";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { UpgradeBanner } from "@/components/premium/UpgradeBanner";
import { Lock } from "lucide-react";

export default function Financas() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { isPremium, canAddTransaction, canUseReports, usage, limits } = usePlan();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);
  
  // Modals
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [installmentModalOpen, setInstallmentModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [addToGoalModalOpen, setAddToGoalModalOpen] = useState(false);
  
  // Edit states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [selectedGoalForAdd, setSelectedGoalForAdd] = useState<FinancialGoal | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "", category: "", account: "", type: "", minAmount: "", maxAmount: "", startDate: "", endDate: ""
  });

  // Hooks
  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { accounts, totalBalance, isLoading: accountsLoading, addAccount, updateAccount, deleteAccount, transfer } = useAccounts();
  const { goals, totalSavings, isLoading: goalsLoading, addGoal, updateGoal, deleteGoal, addToGoal, withdrawFromGoal } = useFinancialGoals();
  const { installments, payments, monthlyImpact, isLoading: installmentsLoading, addInstallment, markPaymentPaid, deleteInstallment } = useInstallments();
  const { subscriptions, monthlyCost, upcomingRenewals, isLoading: subscriptionsLoading, addSubscription, updateSubscription, deleteSubscription, paySubscription, isPaying } = useSubscriptions();
  const [payingSubscriptionId, setPayingSubscriptionId] = useState<string | null>(null);
  const { totals: investmentTotals } = useInvestments();
  const patrimony = totalBalance + totalSavings + investmentTotals.current;

  // Current month boundaries
  const currentMonthStart = startOfMonth(selectedMonth);
  const currentMonthEnd = endOfMonth(selectedMonth);

  // Filter transactions by selected month for display
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transDate = parseISO(t.date);
      return transDate >= currentMonthStart && transDate <= currentMonthEnd;
    });
  }, [transactions, currentMonthStart, currentMonthEnd]);

  // Filtered transactions (with user filters applied on top of month filter)
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter(t => {
      if (filters.search && !t.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category && filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.type && filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.minAmount && t.amount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && t.amount > parseFloat(filters.maxAmount)) return false;
      return true;
    });
  }, [monthTransactions, filters]);

  // Calculate monthly totals (only for selected month)
  const { monthlyIncome, monthlyExpenses } = useMemo(() => {
    const income = monthTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    return { monthlyIncome: income, monthlyExpenses: expenses };
  }, [monthTransactions]);

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthTransactions = transactions.filter(t => {
        const transDate = parseISO(t.date);
        return transDate >= start && transDate <= end;
      });
      months.push({
        month: format(date, "MMM", { locale: ptBR }),
        receitas: monthTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0),
        despesas: monthTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0),
      });
    }
    return months;
  }, [transactions]);

  const categories = [...new Set(transactions.map(t => t.category))];

  // Handlers
  const handleAddTransaction = async (data: any) => {
    if (!editingTransaction && !canAddTransaction) {
      setPremiumReason(`Plano gratuito permite ${limits.transactionsPerMonth} transações por mês. Você já registrou ${usage.transactionsThisMonth}.`);
      setPremiumOpen(true);
      return;
    }
    if (editingTransaction) {
      await updateTransaction({ id: editingTransaction.id, ...data });
      toast.success("Transação atualizada!");
    } else {
      await addTransaction({ ...data, date: new Date().toISOString().split("T")[0] });
      toast.success("Transação adicionada!");
    }
    setEditingTransaction(null);
  };

  const handleAddAccount = async (data: any) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, ...data });
      toast.success("Conta atualizada!");
    } else {
      await addAccount(data);
      toast.success("Conta criada!");
    }
    setEditingAccount(null);
  };

  const handleAddGoal = async (data: any) => {
    if (editingGoal) {
      await updateGoal({ id: editingGoal.id, ...data });
      toast.success("Meta atualizada!");
    } else {
      await addGoal(data);
      toast.success("Meta criada!");
    }
    setEditingGoal(null);
  };

  const handleAddSubscription = async (data: any) => {
    if (editingSubscription) {
      await updateSubscription({ id: editingSubscription.id, ...data });
      toast.success("Assinatura atualizada!");
    } else {
      await addSubscription(data);
      toast.success("Assinatura cadastrada!");
    }
    setEditingSubscription(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} reason={premiumReason} />
      {/* Modals */}
      <TransactionModal open={transactionModalOpen} onOpenChange={setTransactionModalOpen} onSubmit={handleAddTransaction} editData={editingTransaction} accounts={accounts} />
      <AccountModal open={accountModalOpen} onOpenChange={setAccountModalOpen} onSubmit={handleAddAccount} editData={editingAccount} />
      <FinancialGoalModal open={goalModalOpen} onOpenChange={setGoalModalOpen} onSubmit={handleAddGoal} editData={editingGoal} />
      <InstallmentModal open={installmentModalOpen} onOpenChange={setInstallmentModalOpen} onSubmit={async (data) => { await addInstallment(data); toast.success("Parcelamento registrado!"); }} accounts={accounts} />
      <SubscriptionModal open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen} onSubmit={handleAddSubscription} editData={editingSubscription} accounts={accounts} />
      <TransferModal open={transferModalOpen} onOpenChange={setTransferModalOpen} onSubmit={async (data) => { await transfer(data); toast.success("Transferência realizada!"); }} accounts={accounts} />
      <AddToGoalModal open={addToGoalModalOpen} onOpenChange={setAddToGoalModalOpen} onSubmit={async (data) => { await addToGoal(data); toast.success("Valor adicionado!"); }} goal={selectedGoalForAdd} accounts={accounts} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">Finanças</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie suas receitas, despesas e orçamentos</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button className="gradient-finance text-finance-foreground h-10 px-4 active:scale-95 transition-transform" size="sm" onClick={() => { setEditingTransaction(null); setTransactionModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nova Transação
          </Button>
        </div>
      </motion.div>

      {!isPremium && !canAddTransaction && (
        <UpgradeBanner
          title={`Você atingiu o limite de ${limits.transactionsPerMonth} transações deste mês`}
          description="Faça upgrade para Premium e registre quantas quiser."
        />
      )}

      {/* Month Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        <p className="text-xs text-muted-foreground">
          Receitas e despesas são do mês selecionado. Saldo e poupança são acumulados.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Receitas", value: monthlyIncome, icon: TrendingUp, color: "bg-success/10", textColor: "text-success", monthly: true },
          { label: "Despesas", value: monthlyExpenses, icon: TrendingDown, color: "bg-destructive/10", textColor: "text-destructive", monthly: true },
          { label: "Saldo", value: totalBalance, icon: Wallet, color: "gradient-finance", textColor: totalBalance >= 0 ? "text-success" : "text-destructive", monthly: false },
          { label: "Poupança", value: totalSavings, icon: PiggyBank, color: "bg-warning/10", textColor: "text-warning", monthly: false },
          { label: "Patrimônio", value: patrimony, icon: BarChart3, color: "bg-primary/10", textColor: "text-primary", monthly: false },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
            <Card className="p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.label === "Saldo" ? "text-finance-foreground" : stat.textColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                    {stat.monthly && <span className="text-[10px] ml-1 opacity-70">(mês)</span>}
                    {!stat.monthly && <span className="text-[10px] ml-1 opacity-70">(total)</span>}
                  </p>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <p className={`text-base sm:text-xl font-bold truncate ${stat.textColor}`}>
                      {stat.value !== 0 ? `R$ ${stat.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}` : "—"}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="management">Gestão</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Chart */}
          <Card className="p-4 sm:p-5">
            <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Receitas vs Despesas</h3>
            {transactions.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm"><p>Adicione transações para ver o gráfico</p></div>
            ) : (
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={40} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR")}`} />
                    <Area type="monotone" dataKey="receitas" stroke="hsl(150, 60%, 45%)" fillOpacity={1} fill="url(#colorReceitas)" name="Receitas" />
                    <Area type="monotone" dataKey="despesas" stroke="hsl(0, 72%, 55%)" fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Filters & Transactions */}
          <TransactionFilters accounts={accounts} onFilter={setFilters} categories={categories} />
          <Card className="p-4 sm:p-5">
            <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Transações ({filteredTransactions.length})</h3>
            {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Nenhuma transação encontrada</p></div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {filteredTransactions.slice(0, 20).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                        {t.type === "income" ? <TrendingUp className="w-4 h-4 text-success" /> : <CreditCard className="w-4 h-4 text-destructive" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{t.description}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.category} • {format(parseISO(t.date), "dd MMM", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-xs sm:text-sm ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                        {t.type === "income" ? "+" : "-"}R$ {t.amount.toLocaleString("pt-BR")}
                      </p>
                      <ContextActionMenu onEdit={() => { setEditingTransaction(t); setTransactionModalOpen(true); }} onDelete={() => { deleteTransaction(t.id); toast.success("Excluído!"); }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AccountsSection accounts={accounts} totalBalance={totalBalance} isLoading={accountsLoading} onAdd={() => { setEditingAccount(null); setAccountModalOpen(true); }} onEdit={(a) => { setEditingAccount(a); setAccountModalOpen(true); }} onDelete={(id) => { deleteAccount(id); toast.success("Conta excluída!"); }} onTransfer={() => setTransferModalOpen(true)} />
            <FinancialGoalsSection goals={goals} isLoading={goalsLoading} onAdd={() => { setEditingGoal(null); setGoalModalOpen(true); }} onEdit={(g) => { setEditingGoal(g); setGoalModalOpen(true); }} onDelete={(id) => { deleteGoal(id); toast.success("Meta excluída!"); }} onAddToGoal={(g) => { setSelectedGoalForAdd(g); setAddToGoalModalOpen(true); }} onWithdraw={async (id, amount, accountId) => { await withdrawFromGoal({ id, amount, accountId }); toast.success("Valor resgatado!"); }} accounts={accounts} />
            <InstallmentsSection installments={installments} payments={payments} monthlyImpact={monthlyImpact} isLoading={installmentsLoading} onAdd={() => setInstallmentModalOpen(true)} onDelete={(id) => { deleteInstallment(id); toast.success("Parcelamento excluído!"); }} onMarkPaid={(id, paid) => { markPaymentPaid({ paymentId: id, paid }); toast.success(paid ? "Parcela paga!" : "Parcela desmarcada!"); }} />
            <SubscriptionsSection subscriptions={subscriptions} monthlyCost={monthlyCost} upcomingRenewals={upcomingRenewals} isLoading={subscriptionsLoading} onAdd={() => { setEditingSubscription(null); setSubscriptionModalOpen(true); }} onEdit={(s) => { setEditingSubscription(s); setSubscriptionModalOpen(true); }} onDelete={(id) => { deleteSubscription(id); toast.success("Assinatura excluída!"); }} onPay={async (id) => { setPayingSubscriptionId(id); try { await paySubscription(id); toast.success("Assinatura paga e debitada da conta!"); } catch (e: any) { toast.error(e.message || "Falha ao pagar"); } finally { setPayingSubscriptionId(null); } }} payingId={payingSubscriptionId} />
            <InvestmentsSection accounts={accounts} />
            <InvestmentTips patrimony={patrimony} />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {canUseReports ? (
            <AdvancedReports transactions={transactions} isLoading={isLoading} />
          ) : (
            <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <Lock className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h3 className="font-display font-semibold text-base">Relatórios avançados são Premium</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Veja gastos por categoria, evolução, comparativos e exporte relatórios.
              </p>
              <Button onClick={() => { setPremiumReason(null); setPremiumOpen(true); }}
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                Conhecer Premium
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
