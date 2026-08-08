import { motion, useReducedMotion } from "framer-motion";
import { Check, CheckCheck, Inbox, Loader2, Pencil, ShieldAlert, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/hooks/useTransactions";
import type { Account } from "@/hooks/useAccounts";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  onReview: (id: string) => Promise<void>;
  onReviewAll: () => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  isReviewing: boolean;
}

export function TransactionReviewInbox({ transactions, accounts, onReview, onReviewAll, onEdit, isReviewing }: Props) {
  const reduceMotion = useReducedMotion();
  const pending = transactions.filter((transaction) => !transaction.reviewed_at).slice(0, 8);
  const expenseValues = transactions.filter((transaction) => transaction.type === "expense").map((transaction) => Number(transaction.amount));
  const averageExpense = expenseValues.length ? expenseValues.reduce((total, value) => total + value, 0) / expenseValues.length : 0;

  if (pending.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center rounded-[2rem] border-dashed p-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><CheckCheck className="h-6 w-6" /></span><div><p className="font-display text-base font-extrabold">Caixa financeira em dia</p><p className="mt-1 text-xs text-muted-foreground">Nenhum lançamento novo esperando sua confirmação.</p></div></div>
        <span className="mt-4 rounded-full bg-emerald-500/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-600 sm:mt-0">Tudo revisado</span>
      </Card>
    );
  }

  return (
    <motion.section initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[2.25rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600"><Inbox className="h-5 w-5" /><span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white">{pending.length}</span></span><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-violet-600"><Sparkles className="h-3.5 w-3.5" />Revisão rápida</p><h3 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Caixa de entrada financeira</h3><p className="mt-1 text-xs text-muted-foreground">Confirme os lançamentos novos ou corrija alguma informação antes de seguir.</p></div></div>
          <Button variant="outline" size="sm" disabled={isReviewing} onClick={onReviewAll}>{isReviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}Revisar todos</Button>
        </div>

        <div className="mt-5 grid gap-2 lg:grid-cols-2">
          {pending.map((transaction) => {
            const account = accounts.find((item) => item.id === transaction.account_id);
            const unusual = transaction.type === "expense" && averageExpense > 0 && Number(transaction.amount) >= averageExpense * 2.5;
            return <div key={transaction.id} className="group flex items-center gap-3 rounded-2xl border border-border/55 bg-background/55 p-3.5 transition hover:border-primary/25 hover:bg-primary/[0.025]"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${transaction.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{unusual ? <ShieldAlert className="h-4 w-4" /> : transaction.type === "income" ? "+" : "−"}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{transaction.description}</p>{unusual && <span className="hidden rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600 sm:inline">Fora do padrão</span>}</div><p className="mt-1 truncate text-[10px] text-muted-foreground">{transaction.category} • {account?.name ?? "Sem conta"} • {format(parseISO(transaction.date), "dd MMM", { locale: ptBR })}</p></div><p className={`whitespace-nowrap text-xs font-extrabold ${transaction.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>{transaction.type === "income" ? "+" : "−"}{money(Number(transaction.amount))}</p><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(transaction)} aria-label="Editar lançamento"><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-600" disabled={isReviewing} onClick={() => onReview(transaction.id)} aria-label="Confirmar lançamento"><Check className="h-4 w-4" /></Button></div></div>;
          })}
        </div>
      </Card>
    </motion.section>
  );
}
