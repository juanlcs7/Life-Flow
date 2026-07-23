import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  Search,
  Filter,
  Wallet,
  CheckSquare,
  Heart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHistoryEvents, HistoryEvent } from "@/hooks/useHistoryEvents";
import { Skeleton } from "@/components/ui/skeleton";
import type { Json } from "@/integrations/supabase/types";

type PeriodFilter = "today" | "7days" | "30days" | "month";
type EventTypeFilter = "finance" | "task" | "health";

export default function Historico() {
  const { events, todaySummary, isLoading } = useHistoryEvents();
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("7days");
  const [typeFilters, setTypeFilters] = useState<EventTypeFilter[]>(["finance", "task", "health"]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (periodFilter) {
      case "today":
        filtered = filtered.filter((e) => {
          const eventDate = new Date(e.created_at);
          return eventDate >= today;
        });
        break;
      case "7days":
        filtered = filtered.filter((e) => {
          const eventDate = new Date(e.created_at);
          return eventDate >= subDays(today, 7);
        });
        break;
      case "30days":
        filtered = filtered.filter((e) => {
          const eventDate = new Date(e.created_at);
          return eventDate >= subDays(today, 30);
        });
        break;
      case "month":
        filtered = filtered.filter((e) => {
          const eventDate = parseISO(e.created_at);
          return isWithinInterval(eventDate, {
            start: startOfMonth(selectedMonth),
            end: endOfMonth(selectedMonth),
          });
        });
        break;
    }

    // Filter by type
    filtered = filtered.filter((e) => typeFilters.includes(e.event_type as EventTypeFilter));

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, periodFilter, typeFilters, searchQuery, selectedMonth]);

  const toggleTypeFilter = (type: EventTypeFilter) => {
    setTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "finance":
        return Wallet;
      case "task":
        return CheckSquare;
      case "health":
        return Heart;
      default:
        return History;
    }
  };

  const getEventColor = (eventType: string, action: string) => {
    if (eventType === "finance") {
      if (action === "create" || action === "deposit" || action === "payment") {
        return "text-finance";
      }
      return "text-finance";
    }
    if (eventType === "task") return "text-tasks";
    if (eventType === "health") return "text-health";
    return "text-muted-foreground";
  };

  const getActionBadge = (action: string, eventType: string, metadata?: Record<string, unknown> | null) => {
    const metaType = metadata?.type as string | undefined;
    const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      create: { label: metaType === "income" ? "Receita" : metaType === "expense" ? "Despesa" : "Criado", variant: metaType === "income" ? "default" : "secondary" },
      update: { label: "Editado", variant: "outline" },
      delete: { label: "Excluído", variant: "destructive" },
      complete: { label: "Concluído", variant: "default" },
      payment: { label: "Pago", variant: "default" },
      refund: { label: "Estornado", variant: "destructive" },
      deposit: { label: "Aporte", variant: "default" },
      withdraw: { label: "Resgate", variant: "secondary" },
    };

    const config = actionLabels[action] || { label: action, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Histórico</h1>
            <p className="text-sm text-muted-foreground">Linha do tempo das suas atividades</p>
          </div>
        </div>
      </motion.div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Resumo de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10">
                <TrendingDown className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Gastos</p>
                  <p className="text-sm font-semibold text-destructive">
                    {isLoading ? <Skeleton className="h-4 w-16" /> : formatCurrency(todaySummary.expenses)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-finance/10">
                <TrendingUp className="w-5 h-5 text-finance" />
                <div>
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-sm font-semibold text-finance">
                    {isLoading ? <Skeleton className="h-4 w-16" /> : formatCurrency(todaySummary.income)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-tasks/10">
                <CheckSquare className="w-5 h-5 text-tasks" />
                <div>
                  <p className="text-xs text-muted-foreground">Tarefas</p>
                  <p className="text-sm font-semibold text-tasks">
                    {isLoading ? <Skeleton className="h-4 w-8" /> : `${todaySummary.tasksCompleted} concluídas`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-health/10">
                <Heart className="w-5 h-5 text-health" />
                <div>
                  <p className="text-xs text-muted-foreground">Hábitos</p>
                  <p className="text-sm font-semibold text-health">
                    {isLoading ? <Skeleton className="h-4 w-8" /> : `${todaySummary.habitsCompleted} concluídos`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Period Filter */}
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="month">Mês específico</SelectItem>
          </SelectContent>
        </Select>

        {/* Month Selector (when month filter is active) */}
        {periodFilter === "month" && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[100px] text-center">
              {format(selectedMonth, "MMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Type Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Tipo
              {typeFilters.length < 3 && (
                <Badge variant="secondary" className="ml-1">
                  {typeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={typeFilters.includes("finance")}
                  onCheckedChange={() => toggleTypeFilter("finance")}
                />
                <Wallet className="w-4 h-4 text-finance" />
                <span className="text-sm">Finanças</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={typeFilters.includes("task")}
                  onCheckedChange={() => toggleTypeFilter("task")}
                />
                <CheckSquare className="w-4 h-4 text-tasks" />
                <span className="text-sm">Tarefas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={typeFilters.includes("health")}
                  onCheckedChange={() => toggleTypeFilter("health")}
                />
                <Heart className="w-4 h-4 text-health" />
                <span className="text-sm">Saúde</span>
              </label>
            </div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
              <p className="text-sm text-muted-foreground/70">
                {searchQuery ? "Tente uma busca diferente" : "Suas atividades aparecerão aqui"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event, index) => {
            const Icon = getEventIcon(event.event_type);
            const eventDate = new Date(event.created_at);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="hover:shadow-md transition-shadow active:scale-[0.99]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          event.event_type === "finance"
                            ? "bg-finance/10"
                            : event.event_type === "task"
                            ? "bg-tasks/10"
                            : "bg-health/10"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${getEventColor(event.event_type, event.action)}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-sm truncate">{event.title}</h3>
                              {getActionBadge(event.action, event.event_type, event.metadata as Record<string, unknown>)}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(eventDate, "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(eventDate, "HH:mm", { locale: ptBR })}
                              </span>
                              {event.category && (
                                <Badge variant="outline" className="text-xs">
                                  {event.category}
                                </Badge>
                              )}
                              {event.account_name && (
                                <span className="text-muted-foreground">
                                  {event.account_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {event.amount !== null && event.amount !== undefined && (
                            <div className="text-right flex-shrink-0">
                              <p
                                className={`font-semibold text-sm ${
                                  event.action === "delete" || event.action === "refund" || event.action === "withdraw"
                                    ? "text-destructive"
                                    : (event.metadata as Record<string, unknown>)?.type === "income"
                                    ? "text-finance"
                                    : "text-foreground"
                                }`}
                              >
                                {(event.metadata as Record<string, unknown>)?.type === "income" ? "+" : "-"}
                                {formatCurrency(event.amount)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Results count */}
      {!isLoading && filteredEvents.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""} encontrado
          {filteredEvents.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
