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
import { PageHeader } from "@/components/layout/PageHeader";
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

      <PageHeader
        title="Finanças"
        description="Gerencie receitas, despesas e patrimônio com uma visão clara do seu mês."
        eyebrow="Vida financeira"
        icon={Wallet}
        variant="finance"
        actions={
          <Button className="gradient-finance text-finance-foreground h-10 px-4 active:scale-95 transition-transform" size="sm" onClick={() => { setEditingTransaction(null); setTransactionModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nova Transação
          </Button>
        }
      />

      {!isPremium && !canAddTransaction && (
        <UpgradeBanner
          title={`Você atingiu o limite de ${limits.transactionsPerMonth} transações deste mês`}
          description="Faça upgrade para Premium e registre quantas quiser."
        />
      )}

      {/* Month Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 p-2 sm:px-3">
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        <p className="px-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          Receitas e despesas são do mês selecionado. Saldo e poupança são acumulados.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[
          { label: "Receitas", value: monthlyIncome, icon: TrendingUp, color: "bg-success/10", textColor: "text-success", border: "before:bg-success", glow: "from-success/[0.08]", monthly: true },
          { label: "Despesas", value: monthlyExpenses, icon: TrendingDown, color: "bg-destructive/10", textColor: "text-destructive", border: "before:bg-destructive", glow: "from-destructive/[0.07]", monthly: true },
          { label: "Saldo", value: totalBalance, icon: Wallet, color: "bg-finance/15", textColor: totalBalance >= 0 ? "text-success" : "text-destructive", border: "before:bg-finance", glow: "from-finance/[0.1]", monthly: false },
          { label: "Poupança", value: totalSavings, icon: PiggyBank, color: "bg-warning/10", textColor: "text-warning", border: "before:bg-warning", glow: "from-warning/[0.07]", monthly: false },
          { label: "Patrimônio", value: patrimony, icon: BarChart3, color: "bg-primary/10", textColor: "text-primary", border: "before:bg-primary", glow: "from-primary/[0.08]", monthly: false },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
            <Card className={`relative h-full min-h-[112px] overflow-hidden border-border/70 bg-gradient-to-br ${stat.glow} via-card to-card p-4 shadow-sm transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 ${stat.border} hover:-translate-y-0.5 hover:border-border hover:shadow-md sm:p-5`}>
              <div className="flex h-full items-center gap-3">
                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                    <span className="ml-1 text-[9px] uppercase tracking-wider opacity-60">{stat.monthly ? "mês" : "total"}</span>
                  </p>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <p className={`mt-1 truncate text-lg font-bold tracking-tight sm:text-xl ${stat.textColor}`}>
                      {stat.value !== 0 ? stat.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
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
        <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl border border-border/60 bg-card/60 p-1 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="management" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Gestão</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-lg px-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Chart */}
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.025] p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Fluxo financeiro</p>
                <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">Receitas vs Despesas</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Evolução dos últimos sete meses</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/45 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" />Receitas</span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-destructive" />Despesas</span>
                <span className={`border-l border-border pl-3 text-xs font-semibold ${monthlyIncome - monthlyExpenses >= 0 ? "text-success" : "text-destructive"}`}>
                  {monthlyIncome - monthlyExpenses >= 0 ? "+" : ""}{(monthlyIncome - monthlyExpenses).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </div>
            {transactions.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-center text-muted-foreground">
                <BarChart3 className="mb-2 h-7 w-7 opacity-40" />
                <p className="text-sm">Adicione transações para visualizar sua evolução</p>
              </div>
            ) : (
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(150, 60%, 45%)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(0, 72%, 55%)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="4 6" stroke="hsl(var(--border))" opacity={0.7} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={11} dy={8} />
                    <YAxis axisLine={false} tickLine={false} stroke="hsl(var(--muted-foreground))" fontSize={10} width={48} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                    <Tooltip cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px", boxShadow: "0 12px 30px hsl(220 30% 5% / .22)" }} formatter={(value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                    <Area type="monotone" dataKey="receitas" stroke="hsl(150, 60%, 45%)" strokeWidth={2.25} fillOpacity={1} fill="url(#colorReceitas)" name="Receitas" />
                    <Area type="monotone" dataKey="despesas" stroke="hsl(0, 72%, 55%)" strokeWidth={2.25} fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Filters & Transactions */}
          <TransactionFilters accounts={accounts} onFilter={setFilters} categories={categories} />
          <Card className="overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">Transações recentes</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{filteredTransactions.length} lançamento{filteredTransactions.length === 1 ? "" : "s"} no período</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{format(selectedMonth, "MMM yyyy", { locale: ptBR })}</span>
            </div>
            {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Nenhuma transação encontrada</p></div>
            ) : (
              <div className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
                {filteredTransactions.slice(0, 20).map(t => (
                  <div key={t.id} className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/25 p-3 transition-all hover:border-border/70 hover:bg-muted/45">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.type === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                        {t.type === "income" ? <TrendingUp className="w-4 h-4 text-success" /> : <CreditCard className="w-4 h-4 text-destructive" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold sm:text-sm">{t.description}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t.category} • {format(parseISO(t.date), "dd MMM", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-bold sm:text-sm ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                        {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
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
