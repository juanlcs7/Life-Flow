import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, Loader2, CreditCard, BarChart3, Upload, History, LayoutDashboard, Landmark, ChartSpline, Sparkles, Route, ListChecks, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useAccounts, Account, type NewAccount } from "@/hooks/useAccounts";
import { useFinancialGoals, FinancialGoal, type NewFinancialGoal } from "@/hooks/useFinancialGoals";
import { useInstallments } from "@/hooks/useInstallments";
import { useSubscriptions, Subscription, type NewSubscription } from "@/hooks/useSubscriptions";
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
import { BudgetsSection } from "@/components/finance/BudgetsSection";
import { MonthSelector } from "@/components/finance/MonthSelector";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { usePlan } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { MoneyFlowIcon } from "@/components/icons/LifeFlowIcons";
import { UpgradeBanner } from "@/components/premium/UpgradeBanner";
import { Lock } from "lucide-react";
import { ImportTransactionsModal } from "@/components/finance/ImportTransactionsModal";
import type { NewTransaction } from "@/hooks/useTransactions";
import { useTransactionCategoryRules, type CategoryRuleDraft } from "@/hooks/useTransactionCategoryRules";
import { useTransactionImports } from "@/hooks/useTransactionImports";
import { ImportHistoryModal } from "@/components/finance/ImportHistoryModal";
import { MonthlyComparison } from "@/components/finance/MonthlyComparison";
import { MonthForecast } from "@/components/finance/MonthForecast";
import { PremiumFinancialSuite } from "@/components/premium/PremiumFinancialSuite";
import { IncomeSourcesSection } from "@/components/finance/IncomeSourcesSection";
import { MoneyBriefing } from "@/components/finance/MoneyBriefing";
import { useIncomeSources } from "@/hooks/useIncomeSources";
import { TransactionReviewInbox } from "@/components/finance/TransactionReviewInbox";
import { FinancialTimeline } from "@/components/finance/FinancialTimeline";
import { RecurringExpenseDetector } from "@/components/finance/RecurringExpenseDetector";
import { FinancialSignals } from "@/components/finance/FinancialSignals";
import { MoneyAllocationPlan } from "@/components/finance/MoneyAllocationPlan";
import { useBudgets } from "@/hooks/useBudgets";
import { cn } from "@/lib/utils";

type TransactionFormData = Omit<NewTransaction, "date">;

function FinanceSectionIntro({ icon: Icon, eyebrow, title, description, tone = "from-finance/15 to-primary/5" }: { icon: LucideIcon; eyebrow: string; title: string; description: string; tone?: string }) {
  return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("relative overflow-hidden rounded-[1.6rem] border border-finance/10 bg-gradient-to-r p-4 sm:p-5", tone)}>
    <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-finance/10 blur-3xl" />
    <div className="relative flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-finance/10 bg-background/60 text-finance shadow-sm"><Icon className="h-4.5 w-4.5" /></span><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-finance">{eyebrow}</p><h2 className="mt-1 font-display text-lg font-black tracking-[-.03em]">{title}</h2><p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted-foreground">{description}</p></div></div>
  </motion.div>;
}

export default function Financas() {
  const reduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  
  // Edit states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [suggestedSubscription, setSuggestedSubscription] = useState<Partial<NewSubscription> | null>(null);
  const [selectedGoalForAdd, setSelectedGoalForAdd] = useState<FinancialGoal | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "", category: "", account: "", type: "", minAmount: "", maxAmount: "", startDate: "", endDate: ""
  });

  // Hooks
  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, reviewTransaction, reviewAllTransactions, isReviewing } = useTransactions();
  const { categoryRules, saveCategoryRules } = useTransactionCategoryRules();
  const { imports, isLoading: importsLoading, createImport, undoImport, undoingImportId } = useTransactionImports();
  const { accounts, totalBalance, isLoading: accountsLoading, addAccount, updateAccount, deleteAccount, transfer } = useAccounts();
  const { goals, totalSavings, isLoading: goalsLoading, addGoal, updateGoal, deleteGoal, addToGoal, withdrawFromGoal } = useFinancialGoals();
  const { installments, payments, monthlyImpact, isLoading: installmentsLoading, addInstallment, markPaymentPaid, deleteInstallment } = useInstallments();
  const { subscriptions, monthlyCost, upcomingRenewals, isLoading: subscriptionsLoading, addSubscription, updateSubscription, deleteSubscription, paySubscription, isPaying } = useSubscriptions();
  const [payingSubscriptionId, setPayingSubscriptionId] = useState<string | null>(null);
  const { totals: investmentTotals } = useInvestments();
  const { activeIncomeSources, monthlyIncome: expectedMonthlyIncome } = useIncomeSources();
  const { budgets: currentBudgets } = useBudgets(selectedMonth);
  const patrimony = totalBalance + totalSavings + investmentTotals.current;

  useEffect(() => {
    if (searchParams.get("novaTransacao") !== "1") return;

    setEditingTransaction(null);
    if (canAddTransaction) {
      setTransactionModalOpen(true);
    } else {
      setPremiumReason(`Plano gratuito permite ${limits.transactionsPerMonth} transações por mês. Você já registrou ${usage.transactionsThisMonth}.`);
      setPremiumOpen(true);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("novaTransacao");
    setSearchParams(nextParams, { replace: true });
  }, [canAddTransaction, limits.transactionsPerMonth, searchParams, setSearchParams, usage.transactionsThisMonth]);

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
  const handleAddTransaction = async (data: TransactionFormData) => {
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

  const handleAddAccount = async (data: NewAccount) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, ...data });
      toast.success("Conta atualizada!");
    } else {
      await addAccount(data);
      toast.success("Conta criada!");
    }
    setEditingAccount(null);
  };

  const handleAddGoal = async (data: NewFinancialGoal) => {
    if (editingGoal) {
      await updateGoal({ id: editingGoal.id, ...data });
      toast.success("Meta atualizada!");
    } else {
      await addGoal(data);
      toast.success("Meta criada!");
    }
    setEditingGoal(null);
  };

  const handleAddSubscription = async (data: NewSubscription) => {
    if (editingSubscription) {
      await updateSubscription({ id: editingSubscription.id, ...data });
      toast.success("Assinatura atualizada!");
    } else {
      await addSubscription(data);
      toast.success("Assinatura cadastrada!");
    }
    setEditingSubscription(null);
  };

  const handleImportTransactions = async (
    items: NewTransaction[],
    rules: CategoryRuleDraft[],
    file: { name: string; type: "csv" | "ofx" },
  ) => {
    const importedIds: string[] = [];

    try {
      for (const item of items) {
        const transaction = await addTransaction({ ...item, pending_review: true });
        importedIds.push(transaction.id);
      }
    } catch (error) {
      await Promise.allSettled(importedIds.map((id) => deleteTransaction(id)));
      throw error;
    }

    let importRecordId = "";
    try {
      const importRecord = await createImport({
        fileName: file.name,
        fileType: file.type,
        transactionIds: importedIds,
        totalIncome: items.filter((item) => item.type === "income").reduce((total, item) => total + item.amount, 0),
        totalExpense: items.filter((item) => item.type === "expense").reduce((total, item) => total + item.amount, 0),
      });
      importRecordId = importRecord.id;
    } catch (error) {
      await Promise.allSettled(importedIds.map((id) => deleteTransaction(id)));
      throw new Error("Não foi possível registrar o histórico. A importação foi cancelada para manter seus dados seguros.");
    }

    if (rules.length > 0) {
      try {
        await saveCategoryRules(rules);
      } catch {
        toast.info("As transações foram importadas, mas não foi possível salvar as novas regras de categoria.");
      }
    }

    let undone = false;
    toast.success(`${items.length} transações importadas!`, {
      duration: 12000,
      action: {
        label: "Desfazer",
        onClick: async () => {
          if (undone) return;
          undone = true;

          try {
            await undoImport(importRecordId);
            toast.success("Importação desfeita.");
          } catch {
            undone = false;
            toast.error("Não foi possível desfazer toda a importação.");
          }
        },
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} reason={premiumReason} />
      {/* Modals */}
      <TransactionModal open={transactionModalOpen} onOpenChange={setTransactionModalOpen} onSubmit={handleAddTransaction} editData={editingTransaction} accounts={accounts} />
      <AccountModal open={accountModalOpen} onOpenChange={setAccountModalOpen} onSubmit={handleAddAccount} editData={editingAccount} />
      <FinancialGoalModal open={goalModalOpen} onOpenChange={setGoalModalOpen} onSubmit={handleAddGoal} editData={editingGoal} />
      <InstallmentModal open={installmentModalOpen} onOpenChange={setInstallmentModalOpen} onSubmit={async (data) => { await addInstallment(data); toast.success("Parcelamento registrado!"); }} accounts={accounts} />
      <SubscriptionModal open={subscriptionModalOpen} onOpenChange={(open) => { setSubscriptionModalOpen(open); if (!open) setSuggestedSubscription(null); }} onSubmit={handleAddSubscription} editData={editingSubscription} initialData={suggestedSubscription} accounts={accounts} />
      <TransferModal open={transferModalOpen} onOpenChange={setTransferModalOpen} onSubmit={async (data) => { await transfer(data); toast.success("Transferência realizada!"); }} accounts={accounts} />
      <AddToGoalModal open={addToGoalModalOpen} onOpenChange={setAddToGoalModalOpen} onSubmit={async (data) => { await addToGoal(data); toast.success("Valor adicionado!"); }} goal={selectedGoalForAdd} accounts={accounts} />
      <ImportTransactionsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        accounts={accounts}
        transactions={transactions}
        categoryRules={categoryRules}
        maxRows={isPremium ? undefined : Math.max(0, limits.transactionsPerMonth - usage.transactionsThisMonth)}
        onImport={handleImportTransactions}
      />
      <ImportHistoryModal
        open={importHistoryOpen}
        onOpenChange={setImportHistoryOpen}
        imports={imports}
        isLoading={importsLoading}
        undoingImportId={undoingImportId}
        onUndo={async (item) => {
          try {
            const removedCount = await undoImport(item.id);
            toast.success(`${removedCount} transaç${removedCount === 1 ? "ão removida" : "ões removidas"}. Saldos atualizados.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível desfazer a importação.");
            throw error;
          }
        }}
      />

      <PageHeader
        title="Finanças"
        description="Veja quanto entrou, quanto saiu e onde seu dinheiro está."
        eyebrow="Dinheiro"
        icon={MoneyFlowIcon}
        variant="finance"
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button variant="outline" className="h-10 min-w-0 bg-background/80 px-3 text-foreground hover:bg-muted hover:text-foreground" size="sm" onClick={() => setImportHistoryOpen(true)}>
              <History className="mr-2 h-4 w-4" />Histórico
            </Button>
            <Button variant="outline" className="h-10 min-w-0 bg-background/80 px-3 text-foreground hover:bg-muted hover:text-foreground" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />Importar arquivo
            </Button>
            <Button className="gradient-finance col-span-2 h-11 w-full px-4 text-finance-foreground shadow-sm transition-transform active:scale-[0.98] sm:h-10 sm:w-auto" size="sm" onClick={() => { setEditingTransaction(null); setTransactionModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Nova Transação
            </Button>
          </div>
        }
      />

      {!isPremium && !canAddTransaction && (
        <UpgradeBanner
          title={`Você atingiu o limite de ${limits.transactionsPerMonth} transações deste mês`}
          description="Faça upgrade para Premium e registre quantas quiser."
        />
      )}

      {/* Month Selector */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-[1.5rem] border border-finance/15 bg-gradient-to-r from-finance/[0.08] via-card to-primary/[0.045] p-3 shadow-sm sm:px-4"
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-finance/10 blur-3xl" />
        <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        <p className="relative flex items-center gap-1.5 px-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-finance" />
          Receitas e despesas são do mês selecionado. Saldo e poupança são acumulados.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[
          { label: "Receitas", value: monthlyIncome, icon: TrendingUp, color: "bg-success/10", textColor: "text-success", border: "before:bg-success", glow: "from-success/[0.08]", monthly: true },
          { label: "Despesas", value: monthlyExpenses, icon: TrendingDown, color: "bg-destructive/10", textColor: "text-destructive", border: "before:bg-destructive", glow: "from-destructive/[0.07]", monthly: true },
          { label: "Saldo", value: totalBalance, icon: Wallet, color: "bg-finance/15", textColor: totalBalance >= 0 ? "text-success" : "text-destructive", border: "before:bg-finance", glow: "from-finance/[0.1]", monthly: false },
          { label: "Poupança", value: totalSavings, icon: PiggyBank, color: "bg-warning/10", textColor: "text-warning", border: "before:bg-warning", glow: "from-warning/[0.07]", monthly: false },
          { label: "Patrimônio", value: patrimony, icon: BarChart3, color: "bg-primary/10", textColor: "text-primary", border: "before:bg-primary", glow: "from-primary/[0.08]", monthly: false },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}>
            <Card className={`group relative h-full min-h-[122px] overflow-hidden rounded-[1.35rem] border-border/60 bg-gradient-to-br ${stat.glow} via-card to-card p-4 shadow-sm transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 ${stat.border} hover:-translate-y-1 hover:border-finance/20 hover:shadow-xl motion-reduce:hover:translate-y-0 sm:p-5`}>
              <div className={`pointer-events-none absolute -right-5 -top-7 h-20 w-20 rounded-full ${stat.color} opacity-70 blur-2xl transition-transform duration-500 group-hover:scale-150`} />
              <div className="flex h-full items-center gap-3">
                <div className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${stat.color} shadow-sm ring-1 ring-white/10`}>
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
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-finance/15 bg-gradient-to-r from-card/90 via-card to-finance/[0.06] p-1.5 shadow-sm [scrollbar-width:none]">
          <TabsTrigger value="overview" className="h-10 shrink-0 gap-2 rounded-xl px-3.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><LayoutDashboard className="h-4 w-4" />Resumo</TabsTrigger>
          <TabsTrigger value="planning" className="h-10 shrink-0 gap-2 rounded-xl px-3.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><Route className="h-4 w-4" />Plano</TabsTrigger>
          <TabsTrigger value="transactions" className="h-10 shrink-0 gap-2 rounded-xl px-3.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><ListChecks className="h-4 w-4" />Lançamentos</TabsTrigger>
          <TabsTrigger value="management" className="h-10 shrink-0 gap-2 rounded-xl px-3.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><Landmark className="h-4 w-4" />Gestão</TabsTrigger>
          <TabsTrigger value="reports" className="h-10 shrink-0 gap-2 rounded-xl px-3.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-finance data-[state=active]:to-primary data-[state=active]:text-white data-[state=active]:shadow-lg"><ChartSpline className="h-4 w-4" />Relatórios</TabsTrigger>
          <TabsTrigger value="intelligence" className="h-10 shrink-0 gap-2 rounded-xl px-3.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg"><Sparkles className="h-4 w-4" />Inteligência</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <FinanceSectionIntro icon={LayoutDashboard} eyebrow="Leitura rápida" title="Seu mês em perspectiva" description="O essencial para entender onde você está, o que mudou e o que merece atenção agora." />
          <MoneyBriefing
            transactions={monthTransactions}
            totalBalance={totalBalance}
            expectedMonthlyIncome={expectedMonthlyIncome}
            payments={payments}
            subscriptions={subscriptions}
            selectedMonth={selectedMonth}
          />
          <FinancialSignals transactions={transactions} />
          <MonthlyComparison selectedMonth={selectedMonth} transactions={transactions} />
          <MonthForecast
            selectedMonth={selectedMonth}
            transactions={transactions}
            installments={installments}
            payments={payments}
            subscriptions={subscriptions}
          />
          {/* Chart */}
          <Card className="relative overflow-hidden rounded-[1.75rem] border-finance/15 bg-gradient-to-br from-card via-card to-finance/[0.055] p-4 shadow-[0_18px_50px_-36px_rgba(8,145,178,.55)] sm:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-finance/10 blur-3xl" />
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

        </TabsContent>

        <TabsContent value="planning" className="mt-4 space-y-4">
          <FinanceSectionIntro icon={Route} eyebrow="Plano do mês" title="Dê uma função ao seu dinheiro" description="Organize compromissos, limites e metas antes de decidir o que pode gastar." tone="from-emerald-500/12 to-cyan-500/5" />
          <FinancialTimeline totalBalance={totalBalance} accounts={accounts} incomeSources={activeIncomeSources} installments={installments} payments={payments} subscriptions={subscriptions} />
          <BudgetsSection selectedMonth={selectedMonth} transactions={monthTransactions} historyTransactions={transactions} />
          <MoneyAllocationPlan expectedIncome={expectedMonthlyIncome} budgets={currentBudgets} subscriptions={subscriptions} installments={installments} payments={payments} goals={goals} transactions={monthTransactions} selectedMonth={selectedMonth} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4 space-y-4">
          <FinanceSectionIntro icon={ListChecks} eyebrow="Caixa financeira" title="Revise e encontre cada lançamento" description="Importações pendentes, filtros e histórico mensal ficam reunidos aqui." tone="from-violet-500/10 to-cyan-500/5" />
          <TransactionReviewInbox transactions={transactions} accounts={accounts} onReview={async (id) => { await reviewTransaction(id); toast.success("Lançamento revisado"); }} onReviewAll={async () => { await reviewAllTransactions(); toast.success("Caixa financeira revisada"); }} onEdit={(transaction) => { setEditingTransaction(transaction); setTransactionModalOpen(true); }} isReviewing={isReviewing} />
          <TransactionFilters accounts={accounts} onFilter={setFilters} categories={categories} />
          <Card className="overflow-hidden rounded-[1.75rem] border-finance/10 bg-gradient-to-br from-card via-card to-primary/[0.035] p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-base font-semibold">Transações do período</h3><p className="mt-0.5 text-xs text-muted-foreground">{filteredTransactions.length} lançamento{filteredTransactions.length === 1 ? "" : "s"} encontrado{filteredTransactions.length === 1 ? "" : "s"}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{format(selectedMonth, "MMM yyyy", { locale: ptBR })}</span></div>
            {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : filteredTransactions.length === 0 ? <div className="py-8 text-center text-muted-foreground"><p className="text-sm">Nenhuma transação encontrada</p></div> : <div className="max-h-[34rem] space-y-1.5 overflow-y-auto pr-1">{filteredTransactions.slice(0, 30).map((transaction) => <div key={transaction.id} className="group flex items-center justify-between rounded-2xl border border-border/40 bg-background/55 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-finance/20 hover:bg-finance/[0.035] hover:shadow-md motion-reduce:hover:translate-y-0"><div className="flex min-w-0 flex-1 items-center gap-2"><div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm", transaction.type === "income" ? "bg-success/10" : "bg-destructive/10")}>{transaction.type === "income" ? <TrendingUp className="h-4 w-4 text-success" /> : <CreditCard className="h-4 w-4 text-destructive" />}</div><div className="min-w-0"><p className="truncate text-xs font-semibold sm:text-sm">{transaction.description}</p><p className="text-[10px] text-muted-foreground sm:text-xs">{transaction.category} • {format(parseISO(transaction.date), "dd MMM", { locale: ptBR })}</p></div></div><div className="flex items-center gap-2"><p className={cn("text-xs font-bold sm:text-sm", transaction.type === "income" ? "text-success" : "text-destructive")}>{transaction.type === "income" ? "+" : "-"}{transaction.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><ContextActionMenu onEdit={() => { setEditingTransaction(transaction); setTransactionModalOpen(true); }} onDelete={() => { deleteTransaction(transaction.id); toast.success("Excluído!"); }} /></div></div>)}</div>}
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-4 mt-4">
          <FinanceSectionIntro icon={Landmark} eyebrow="Estrutura financeira" title="Tudo que sustenta seu dinheiro" description="Renda, contas, parcelas, assinaturas, metas e investimentos organizados por função." tone="from-blue-500/10 to-violet-500/5" />
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2"><RecurringExpenseDetector transactions={transactions} subscriptions={subscriptions} onCreate={(suggestion) => { setEditingSubscription(null); setSuggestedSubscription(suggestion); setSubscriptionModalOpen(true); }} /></div>
            <IncomeSourcesSection accounts={accounts} />
            <AccountsSection accounts={accounts} totalBalance={totalBalance} isLoading={accountsLoading} onAdd={() => { setEditingAccount(null); setAccountModalOpen(true); }} onEdit={(a) => { setEditingAccount(a); setAccountModalOpen(true); }} onDelete={(id) => { deleteAccount(id); toast.success("Conta excluída!"); }} onTransfer={() => setTransferModalOpen(true)} />
            <FinancialGoalsSection goals={goals} isLoading={goalsLoading} onAdd={() => { setEditingGoal(null); setGoalModalOpen(true); }} onEdit={(g) => { setEditingGoal(g); setGoalModalOpen(true); }} onDelete={(id) => { deleteGoal(id); toast.success("Meta excluída!"); }} onAddToGoal={(g) => { setSelectedGoalForAdd(g); setAddToGoalModalOpen(true); }} onWithdraw={async (id, amount, accountId) => { await withdrawFromGoal({ id, amount, accountId }); toast.success("Valor resgatado!"); }} accounts={accounts} />
            <InstallmentsSection installments={installments} payments={payments} monthlyImpact={monthlyImpact} isLoading={installmentsLoading} onAdd={() => setInstallmentModalOpen(true)} onDelete={(id) => { deleteInstallment(id); toast.success("Parcelamento excluído!"); }} onMarkPaid={(id, paid) => { markPaymentPaid({ paymentId: id, paid }); toast.success(paid ? "Parcela paga!" : "Parcela desmarcada!"); }} />
            <SubscriptionsSection subscriptions={subscriptions} monthlyCost={monthlyCost} upcomingRenewals={upcomingRenewals} isLoading={subscriptionsLoading} onAdd={() => { setEditingSubscription(null); setSubscriptionModalOpen(true); }} onEdit={(s) => { setEditingSubscription(s); setSubscriptionModalOpen(true); }} onDelete={(id) => { deleteSubscription(id); toast.success("Assinatura excluída!"); }} onPay={async (id) => { setPayingSubscriptionId(id); try { await paySubscription(id); toast.success("Pagamento registrado com sucesso!"); } catch (error) { toast.error(getErrorMessage(error, "Falha ao pagar a assinatura")); } finally { setPayingSubscriptionId(null); } }} payingId={payingSubscriptionId} />
            <InvestmentsSection accounts={accounts} />
            <InvestmentTips patrimony={patrimony} />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-4">
          <FinanceSectionIntro icon={ChartSpline} eyebrow="Leitura profunda" title="Relatórios sem distrações" description="Compare períodos, encontre padrões e transforme seus dados em decisões." tone="from-sky-500/10 to-indigo-500/5" />
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

        <TabsContent value="intelligence" className="mt-4 space-y-4">
          <FinanceSectionIntro icon={Sparkles} eyebrow="LifeFlow Intelligence" title="Seu dinheiro, interpretado" description="Insights avançados para antecipar riscos, descobrir oportunidades e evoluir seu plano." tone="from-violet-500/12 to-cyan-500/5" />
          <PremiumFinancialSuite />
        </TabsContent>
      </Tabs>
    </div>
  );
}
