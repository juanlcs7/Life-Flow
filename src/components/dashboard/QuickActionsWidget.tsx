import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Wallet,
  CheckSquare,
  Target,
  Heart,
  Settings2,
  X,
  GripVertical,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type QuickActionId = 
  | "add_income" 
  | "add_expense" 
  | "add_task" 
  | "add_goal" 
  | "add_habit"
  | "view_calendar";

export interface QuickAction {
  id: QuickActionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  action: () => void;
}

interface QuickActionsWidgetProps {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddTask: () => void;
  onAddGoal: () => void;
  onAddHabit: () => void;
  onViewCalendar: () => void;
}

const defaultActions: QuickActionId[] = ["add_income", "add_expense", "add_task", "add_goal"];

export function QuickActionsWidget({
  onAddIncome,
  onAddExpense,
  onAddTask,
  onAddGoal,
  onAddHabit,
  onViewCalendar,
}: QuickActionsWidgetProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [visibleActions, setVisibleActions] = useState<QuickActionId[]>(() => {
    const saved = localStorage.getItem("quick_actions_visible");
    return saved ? JSON.parse(saved) : defaultActions;
  });

  const allActions: QuickAction[] = [
    {
      id: "add_income",
      label: "Receita",
      icon: ArrowUpRight,
      color: "text-health",
      bgColor: "bg-health/10 hover:bg-health/20",
      action: onAddIncome,
    },
    {
      id: "add_expense",
      label: "Despesa",
      icon: ArrowDownRight,
      color: "text-destructive",
      bgColor: "bg-destructive/10 hover:bg-destructive/20",
      action: onAddExpense,
    },
    {
      id: "add_task",
      label: "Tarefa",
      icon: CheckSquare,
      color: "text-tasks",
      bgColor: "bg-tasks/10 hover:bg-tasks/20",
      action: onAddTask,
    },
    {
      id: "add_goal",
      label: "Meta",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10 hover:bg-primary/20",
      action: onAddGoal,
    },
    {
      id: "add_habit",
      label: "Hábito",
      icon: Heart,
      color: "text-health",
      bgColor: "bg-health/10 hover:bg-health/20",
      action: onAddHabit,
    },
    {
      id: "view_calendar",
      label: "Agenda",
      icon: Calendar,
      color: "text-info",
      bgColor: "bg-info/10 hover:bg-info/20",
      action: onViewCalendar,
    },
  ];

  const toggleAction = (actionId: QuickActionId) => {
    const newVisible = visibleActions.includes(actionId)
      ? visibleActions.filter((id) => id !== actionId)
      : [...visibleActions, actionId];
    setVisibleActions(newVisible);
    localStorage.setItem("quick_actions_visible", JSON.stringify(newVisible));
  };

  const activeActions = allActions.filter((a) => visibleActions.includes(a.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="shadow-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            {isCustomizing ? <X className="w-4 h-4" /> : <Settings2 className="w-4 h-4" />}
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <AnimatePresence mode="wait">
            {isCustomizing ? (
              <motion.div
                key="customize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-xs text-muted-foreground mb-3">
                  Escolha quais ações exibir:
                </p>
                {allActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className={cn("w-4 h-4", action.color)} />
                      <Label className="text-sm">{action.label}</Label>
                    </div>
                    <Switch
                      checked={visibleActions.includes(action.id)}
                      onCheckedChange={() => toggleAction(action.id)}
                    />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {activeActions.length > 0 ? (
                  activeActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      className={cn(
                        "flex flex-col items-center gap-1 h-auto py-3 px-2 transition-all active:scale-95",
                        action.bgColor
                      )}
                      onClick={action.action}
                    >
                      <action.icon className={cn("w-5 h-5", action.color)} />
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
                    Nenhuma ação selecionada
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
