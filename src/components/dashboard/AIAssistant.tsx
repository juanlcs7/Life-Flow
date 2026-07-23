import { motion } from "framer-motion";
import { Sparkles, Lightbulb, TrendingUp, Heart, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestions = [
  {
    icon: Clock,
    title: "Tempo para pausas",
    description: "Você tem 3 reuniões seguidas. Que tal agendar 10 minutos de pausa entre elas?",
    action: "Agendar pausas",
    priority: "medium",
  },
  {
    icon: TrendingUp,
    title: "Meta financeira",
    description: "Você está 15% acima do orçamento em lazer. Considere reduzir para atingir sua meta.",
    action: "Ver orçamento",
    priority: "high",
  },
  {
    icon: Heart,
    title: "Lembrete de saúde",
    description: "Faltam 2 copos de água para atingir sua meta de hidratação.",
    action: "Registrar",
    priority: "low",
  },
];

export function AIAssistant() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-xl overflow-hidden shadow-card border border-border"
    >
      <div className="gradient-primary p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 backdrop-blur flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-primary-foreground">Assistente LifeFlow</h3>
            <p className="text-sm text-primary-foreground/80">Sugestões personalizadas para você</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <suggestion.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{suggestion.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
              <Button variant="link" className="h-auto p-0 mt-1 text-xs text-primary">
                {suggestion.action}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}