import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet, PiggyBank, CreditCard, Banknote } from "lucide-react";
import { Account } from "@/hooks/useAccounts";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Account, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  editData?: Account | null;
}

const accountTypes = [
  { value: "checking", label: "Conta Corrente", icon: Banknote },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "wallet", label: "Carteira", icon: Wallet },
  { value: "credit_card", label: "Cartão de Crédito", icon: CreditCard },
];

const colors = [
  { value: "bg-primary", label: "Primário" },
  { value: "bg-success", label: "Verde" },
  { value: "bg-warning", label: "Amarelo" },
  { value: "bg-destructive", label: "Vermelho" },
  { value: "bg-info", label: "Azul" },
];

export function AccountModal({ open, onOpenChange, onSubmit, editData }: AccountModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"checking" | "savings" | "wallet" | "credit_card">("checking");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState("bg-primary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setType(editData.type);
      setBalance(editData.balance.toString());
      setColor(editData.color);
    } else {
      setName("");
      setType("checking");
      setBalance("");
      setColor("bg-primary");
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !balance) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        balance: parseFloat(balance),
        color,
        icon: accountTypes.find(t => t.value === type)?.icon.name || "Wallet",
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Conta" : "Nova Conta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Conta</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank, Carteira..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Inicial</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full ${c.value} ${
                    color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
