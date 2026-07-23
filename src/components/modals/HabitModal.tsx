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

interface HabitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    daily_goal: number;
    unit: string;
    icon: string;
    color: string;
  }) => Promise<void>;
  editData?: {
    id: string;
    name: string;
    daily_goal: number;
    unit: string;
    icon: string;
    color: string;
  } | null;
}

const icons = [
  { value: "Droplets", label: "💧 Água" },
  { value: "Apple", label: "🍎 Alimentação" },
  { value: "Moon", label: "🌙 Sono" },
  { value: "Dumbbell", label: "💪 Exercício" },
  { value: "Brain", label: "🧠 Meditação" },
  { value: "Footprints", label: "👣 Passos" },
  { value: "Book", label: "📚 Leitura" },
  { value: "Heart", label: "❤️ Saúde" },
];

const colors = [
  { value: "hsl(200, 80%, 55%)", label: "Azul" },
  { value: "hsl(150, 60%, 45%)", label: "Verde" },
  { value: "hsl(250, 70%, 60%)", label: "Roxo" },
  { value: "hsl(15, 90%, 60%)", label: "Laranja" },
  { value: "hsl(340, 80%, 55%)", label: "Rosa" },
  { value: "hsl(45, 90%, 55%)", label: "Amarelo" },
];

const units = [
  "copos",
  "refeições",
  "horas",
  "minutos",
  "passos",
  "páginas",
  "vezes",
];

export function HabitModal({ open, onOpenChange, onSubmit, editData }: HabitModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [unit, setUnit] = useState("");
  const [icon, setIcon] = useState("Droplets");
  const [color, setColor] = useState(colors[0].value);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setDailyGoal(editData.daily_goal.toString());
      setUnit(editData.unit);
      setIcon(editData.icon);
      setColor(editData.color);
    } else {
      setName("");
      setDailyGoal("");
      setUnit("");
      setIcon("Droplets");
      setColor(colors[0].value);
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dailyGoal || !unit) return;

    setLoading(true);
    try {
      await onSubmit({
        name,
        daily_goal: parseInt(dailyGoal),
        unit,
        icon,
        color,
      });
      setName("");
      setDailyGoal("");
      setUnit("");
      setIcon("Droplets");
      setColor(colors[0].value);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Hábito" : "Novo Hábito"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Hábito</Label>
            <Input
              id="name"
              placeholder="Ex: Beber água, Exercício, Meditação..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dailyGoal">Meta Diária</Label>
              <Input
                id="dailyGoal"
                type="number"
                min="1"
                placeholder="8"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {units.map((u) => (
                    <SelectItem key={u} value={u} className="py-3">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {icons.map((i) => (
                  <SelectItem key={i.value} value={i.value} className="py-3">
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-3 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-full transition-transform active:scale-90 ${
                    color === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
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
              className="flex-1 h-12 text-base gradient-health text-health-foreground active:scale-95"
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
