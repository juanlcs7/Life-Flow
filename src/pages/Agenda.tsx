import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  Clock,
  Calendar,
  Flag,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTasks, Task } from "@/hooks/useTasks";
import { useGoals } from "@/hooks/useGoals";
import { TaskModal } from "@/components/modals/TaskModal";
import { GoalModal } from "@/components/modals/GoalModal";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { downloadIcs, IcsEvent } from "@/lib/icsExport";
import { PageHeader } from "@/components/layout/PageHeader";

const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const currentDate = new Date();

const priorityColors = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-muted-foreground",
};

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const { tasks, isLoading: tasksLoading, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const { goals, isLoading: goalsLoading, addGoal } = useGoals();

  const todayTasks = tasks.filter((task) => {
    try {
      return isToday(parseISO(task.due_date));
    } catch {
      return false;
    }
  });

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handleAddTask = async (data: {
    title: string;
    due_date: string;
    due_time: string | null;
    priority: string;
    category: string;
  }) => {
    if (editingTask) {
      await updateTask({ id: editingTask.id, ...data, priority: data.priority as "low" | "medium" | "high" });
      toast.success("Tarefa atualizada!");
    } else {
      await addTask({
        ...data,
        priority: data.priority as "low" | "medium" | "high",
      });
      toast.success("Tarefa adicionada!");
    }
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    toast.success("Tarefa excluída!");
  };

  const handleOpenTaskModal = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleAddGoal = async (data: {
    title: string;
    deadline: string;
    category: string;
  }) => {
    await addGoal(data);
    toast.success("Meta adicionada!");
  };

  const handleExportCalendar = () => {
    if (tasks.length === 0) {
      toast.error("Sem tarefas para exportar");
      return;
    }
    const events: IcsEvent[] = tasks.map((t) => ({
      uid: t.id,
      title: t.title,
      date: t.due_date,
      time: t.due_time,
      description: `Categoria: ${t.category} • Prioridade: ${t.priority}`,
    }));
    downloadIcs(events, "lifeflow-agenda.ics");
    toast.success("Arquivo gerado! Importe no Google Calendar ou Outlook.", {
      description: "Google: Configurações → Importar e exportar. Outlook: Arquivo → Abrir → Importar.",
      duration: 8000,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onSubmit={handleAddTask}
        editData={editingTask}
      />
      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        onSubmit={handleAddGoal}
      />

      <PageHeader
        title="Agenda & Tarefas"
        description="Organize seu tempo, priorize o dia e mantenha seus compromissos em movimento."
        eyebrow="Planejamento"
        icon={Calendar}
        variant="tasks"
        actions={
          <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCalendar}
            className="h-10 border-white/15 bg-white/[0.07] text-white transition-transform hover:bg-white/15 hover:text-white active:scale-95"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Sincronizar com Google / Outlook
          </Button>
          <Button
            className="gradient-tasks text-tasks-foreground h-10 sm:h-9 active:scale-95 transition-transform"
            size="sm"
            onClick={handleOpenTaskModal}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
          </>
        }
      />

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="bg-muted/50 w-full sm:w-auto">
          <TabsTrigger value="today" className="flex-1 sm:flex-none text-xs sm:text-sm">Hoje</TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 sm:flex-none text-xs sm:text-sm">Calendário</TabsTrigger>
          <TabsTrigger value="goals" className="flex-1 sm:flex-none text-xs sm:text-sm">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Tasks List */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-semibold text-sm sm:text-base">
                      Tarefas de Hoje
                      <span className="ml-2 text-xs sm:text-sm font-normal text-muted-foreground">
                        ({todayTasks.filter((t) => !t.completed).length} pendentes)
                      </span>
                    </h3>
                  </div>
                  
                  {tasksLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : todayTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Nenhuma tarefa para hoje</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={handleOpenTaskModal}
                      >
                        Adicionar tarefa
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1 sm:space-y-2">
                      {todayTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                          className={cn(
                            "flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors group",
                            task.completed && "opacity-60"
                          )}
                        >
                          <button
                            className="flex-shrink-0 active:scale-90 transition-transform p-1"
                            onClick={() => toggleTask({ id: task.id, completed: !task.completed })}
                          >
                            {task.completed ? (
                              <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                                <Check className="w-3 h-3 text-success-foreground" />
                              </div>
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium text-xs sm:text-sm truncate",
                                task.completed && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                              <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded">
                                {task.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Flag className={cn("w-3 h-3", priorityColors[task.priority as keyof typeof priorityColors])} />
                            {task.due_time && (
                              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {task.due_time}
                              </div>
                            )}
                            <ContextActionMenu
                              onEdit={() => handleEditTask(task)}
                              onDelete={() => handleDeleteTask(task.id)}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            </div>

            {/* Mini Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-sm sm:text-base">
                    {currentDate.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 active:scale-90">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 active:scale-90">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {days.map((day) => (
                    <div key={day} className="text-[10px] sm:text-xs font-medium text-muted-foreground py-1 sm:py-2">
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth().map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      disabled={!day}
                      className={cn(
                        "aspect-square rounded-lg text-xs sm:text-sm flex items-center justify-center transition-colors active:scale-90",
                        !day && "invisible",
                        day === selectedDate && "gradient-primary text-primary-foreground",
                        day === currentDate.getDate() && day !== selectedDate && "bg-muted font-medium",
                        day && day !== selectedDate && "hover:bg-muted/50"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4 sm:mt-6">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-center h-48 sm:h-64 text-muted-foreground">
              <div className="text-center">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Visualização completa do calendário</p>
                <p className="text-xs sm:text-sm">Em desenvolvimento</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4 sm:mt-6">
          <div className="flex justify-end mb-4">
            <Button
              className="gradient-tasks text-tasks-foreground h-10 sm:h-9 active:scale-95 transition-transform w-full sm:w-auto"
              size="sm"
              onClick={() => setGoalModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </div>
          
          {goalsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : goals.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhuma meta definida</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setGoalModalOpen(true)}
              >
                Criar primeira meta
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{goal.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Prazo: {format(parseISO(goal.deadline), "dd MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <span className="text-[10px] sm:text-xs bg-muted px-2 py-1 rounded flex-shrink-0 ml-2">{goal.category}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full gradient-tasks rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
