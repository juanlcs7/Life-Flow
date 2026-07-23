import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Account } from "@/hooks/useAccounts";
import { Wallet, Banknote, PiggyBank, CreditCard } from "lucide-react";

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    account_id: string | null;
  }) => Promise<void>;
  editData?: {
    id: string;
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    account_id?: string | null;
  } | null;
  accounts: Account[];
}

const categories = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Lazer",
  "Saúde",
  "Educação",
  "Receita",
  "Outros",
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Banknote,
  savings: PiggyBank,
  wallet: Wallet,
  credit_card: CreditCard,
};

export function TransactionModal({ open, onOpenChange, onSubmit, editData, accounts }: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState<string>("");

  useEffect(() => {
    if (editData) {
      setDescription(editData.description);
      setAmount(editData.amount.toString());
      setType(editData.type);
      setCategory(editData.category);
      setAccountId(editData.account_id || "");
    } else {
      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("");
      setAccountId("");
    }
  }, [editData, open]);

  const selectedAccount = accounts.find(a => a.id === accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    setLoading(true);
    try {
      await onSubmit({
        description,
        amount: parseFloat(amount),
        type,
        category,
        account_id: accountId || null,
      });
      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("");
      setAccountId("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Transação" : "Nova Transação"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário, Aluguel, Supermercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "income" ? "default" : "outline"}
                className={`${type === "income" ? "bg-success hover:bg-success/90" : ""} flex-1 h-12 text-base active:scale-95`}
                onClick={() => setType("income")}
              >
                Receita
              </Button>
              <Button
                type="button"
                variant={type === "expense" ? "default" : "outline"}
                className={`${type === "expense" ? "bg-destructive hover:bg-destructive/90" : ""} flex-1 h-12 text-base active:scale-95`}
                onClick={() => setType("expense")}
              >
                Despesa
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="py-3">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conta (opcional)</Label>
            <Select value={accountId || "none"} onValueChange={(val) => setAccountId(val === "none" ? "" : val)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none" className="py-3">
                  Sem conta vinculada
                </SelectItem>
                {accounts.map((acc) => {
                  const IconComponent = iconMap[acc.type] || Wallet;
                  return (
                    <SelectItem key={acc.id} value={acc.id} className="py-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{acc.name}</span>
                        <span className="text-muted-foreground text-xs ml-1">
                          (R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Saldo atual: R$ {selectedAccount.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-base active:scale-95"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base gradient-finance text-finance-foreground active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                />
              ) : editData ? (
                "Salvar"
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}