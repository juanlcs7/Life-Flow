import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import { Account } from "@/hooks/useAccounts";

interface TransactionFiltersProps {
  accounts: Account[];
  onFilter: (filters: TransactionFilterState) => void;
  categories: string[];
}

export interface TransactionFilterState {
  search: string;
  category: string;
  account: string;
  type: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
}

export function TransactionFilters({ accounts, onFilter, categories }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilterState>({
    search: "",
    category: "",
    account: "",
    type: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof TransactionFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: TransactionFilterState = {
      search: "",
      category: "",
      account: "",
      type: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
    };
    setFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-3">
        {/* Search bar - always visible */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar transações..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-10"
          >
            {isExpanded ? "Menos" : "Mais filtros"}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-2">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
            <Select value={filters.type} onValueChange={(v) => updateFilter("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {accounts.length > 0 && (
              <Select value={filters.account} onValueChange={(v) => updateFilter("account", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              type="number"
              placeholder="Valor mín"
              value={filters.minAmount}
              onChange={(e) => updateFilter("minAmount", e.target.value)}
            />

            <Input
              type="number"
              placeholder="Valor máx"
              value={filters.maxAmount}
              onChange={(e) => updateFilter("maxAmount", e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data início"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
