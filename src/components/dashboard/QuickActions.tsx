import { motion } from "framer-motion";
import { Plus, DollarSign, CheckSquare, Droplets, FileText, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Nova despesa", icon: DollarSign, color: "bg-finance/10 text-finance hover:bg-finance/20" },
  { label: "Nova tarefa", icon: CheckSquare, color: "bg-tasks/10 text-tasks hover:bg-tasks/20" },
  { label: "Registrar hábito", icon: Droplets, color: "bg-health/10 text-health hover:bg-health/20" },
  { label: "Novo documento", icon: FileText, color: "bg-documents/10 text-documents hover:bg-documents/20" },
  { label: "Novo contato", icon: UserPlus, color: "bg-contacts/10 text-contacts hover:bg-contacts/20" },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl p-5 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Ações Rápidas</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${action.color}`}
          >
            <action.icon className="w-5 h-5" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}