import {
  createContext,
  type ComponentType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Plus,
  Receipt,
  Search,
  X,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  FilesFlowIcon,
  GoalFlowIcon,
  MoneyFlowIcon,
  PeopleFlowIcon,
  SearchFlowIcon,
  TaskFlowIcon,
} from "@/components/icons/LifeFlowIcons";
import { useTasks } from "@/hooks/useTasks";
import { useContacts } from "@/hooks/useContacts";
import { useDocuments } from "@/hooks/useDocuments";
import { usePersonalGoals } from "@/hooks/usePersonalGoals";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useTransactions } from "@/hooks/useTransactions";

type SearchSection = "Tarefas" | "Contatos" | "Documentos" | "Metas" | "Finanças";

interface SearchResult {
  id: string;
  section: SearchSection;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  searchText: string;
}

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);
const recentSearchesKey = "lifeflow_recent_searches";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function readRecentSearches(): SearchResult[] {
  try {
    return JSON.parse(localStorage.getItem(recentSearchesKey) || "[]");
  } catch {
    return [];
  }
}

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>(readRecentSearches);
  const navigate = useNavigate();

  const { tasks } = useTasks();
  const { contacts } = useContacts();
  const { documents } = useDocuments();
  const { goals: personalGoals } = usePersonalGoals();
  const { goals: financialGoals } = useFinancialGoals();
  const { transactions } = useTransactions();

  const openSearch = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const allResults = useMemo<SearchResult[]>(() => {
    const taskResults = tasks.map((task) => ({
      id: `task-${task.id}`,
      section: "Tarefas" as const,
      title: task.title,
      description: `${task.category} • ${task.completed ? "Concluída" : task.due_date}`,
      href: "/agenda",
      icon: TaskFlowIcon,
      searchText: `${task.title} ${task.category} ${task.due_date}`,
    }));

    const contactResults = contacts.map((contact) => ({
      id: `contact-${contact.id}`,
      section: "Contatos" as const,
      title: contact.name,
      description: contact.company || contact.role || contact.email || "Contato",
      href: "/contatos",
      icon: PeopleFlowIcon,
      searchText: [
        contact.name,
        contact.company,
        contact.role,
        contact.email,
        contact.phone,
      ]
        .filter(Boolean)
        .join(" "),
    }));

    const documentResults = documents.map((document) => ({
      id: `document-${document.id}`,
      section: "Documentos" as const,
      title: document.name,
      description: document.folder || "Geral",
      href: "/documentos",
      icon: FilesFlowIcon,
      searchText: [document.name, document.folder, document.notes, ...(document.tags || [])]
        .filter(Boolean)
        .join(" "),
    }));

    const personalGoalResults = personalGoals.map((goal) => ({
      id: `personal-goal-${goal.id}`,
      section: "Metas" as const,
      title: goal.title,
      description: `${goal.category} • ${goal.progress}%`,
      href: "/metas",
      icon: GoalFlowIcon,
      searchText: `${goal.title} ${goal.description || ""} ${goal.category}`,
    }));

    const financialGoalResults = financialGoals.map((goal) => ({
      id: `financial-goal-${goal.id}`,
      section: "Metas" as const,
      title: goal.name,
      description: "Meta financeira",
      href: "/metas",
      icon: GoalFlowIcon,
      searchText: `${goal.name} ${goal.notes || ""} meta financeira`,
    }));

    const transactionResults = transactions.map((transaction) => ({
      id: `transaction-${transaction.id}`,
      section: "Finanças" as const,
      title: transaction.description,
      description: `${transaction.category} • ${transaction.date}`,
      href: "/financas",
      icon: MoneyFlowIcon,
      searchText: `${transaction.description} ${transaction.category} ${transaction.date} ${transaction.amount}`,
    }));

    return [
      ...taskResults,
      ...contactResults,
      ...documentResults,
      ...personalGoalResults,
      ...financialGoalResults,
      ...transactionResults,
    ];
  }, [contacts, documents, financialGoals, personalGoals, tasks, transactions]);

  const filteredResults = useMemo(() => {
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return [];
    return allResults
      .filter((result) => normalize(result.searchText).includes(normalizedQuery))
      .slice(0, 25);
  }, [allResults, query]);

  const resultsBySection = useMemo(
    () =>
      filteredResults.reduce<Record<SearchSection, SearchResult[]>>(
        (groups, result) => {
          groups[result.section].push(result);
          return groups;
        },
        { Tarefas: [], Contatos: [], Documentos: [], Metas: [], Finanças: [] },
      ),
    [filteredResults],
  );

  const rememberResult = (result: SearchResult) => {
    const updated = [result, ...recentSearches.filter((item) => item.id !== result.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(recentSearchesKey, JSON.stringify(updated));
  };

  const selectResult = (result: SearchResult) => {
    rememberResult(result);
    setOpen(false);
    navigate(result.href);
  };

  const runAction = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(recentSearchesKey);
  };

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar tarefas, contatos, documentos..."
        />
        <CommandList className="max-h-[420px]">
          {query && filteredResults.length === 0 && (
            <CommandEmpty>Nenhum resultado para “{query}”.</CommandEmpty>
          )}

          {!query && (
            <>
              <CommandGroup heading="Atalhos">
                <CommandItem onSelect={() => runAction("/agenda?new=task")}>
                  <Plus className="mr-2 h-4 w-4 text-tasks" />
                  Nova tarefa
                  <CommandShortcut>Agenda</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runAction("/contatos?new=contact")}>
                  <PeopleFlowIcon className="mr-2 h-4 w-4 text-contacts" />
                  Novo contato
                  <CommandShortcut>Contatos</CommandShortcut>
                </CommandItem>
                <CommandItem onSelect={() => runAction("/financas")}>
                  <Receipt className="mr-2 h-4 w-4 text-finance" />
                  Abrir finanças
                  <CommandShortcut>Finanças</CommandShortcut>
                </CommandItem>
              </CommandGroup>

              {recentSearches.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup
                    heading={
                      <div className="flex items-center justify-between">
                        <span>Recentes</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            clearRecent();
                          }}
                          className="flex items-center gap-1 text-[10px] font-normal hover:text-foreground"
                        >
                          <X className="h-3 w-3" /> Limpar
                        </button>
                      </div>
                    }
                  >
                    {recentSearches.map((result) => {
                      return (
                        <CommandItem key={result.id} onSelect={() => selectResult(result)}>
                          <Clock3 className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate">{result.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {result.section}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </>
          )}

          {query &&
            (Object.keys(resultsBySection) as SearchSection[]).map((section) => {
              const sectionResults = resultsBySection[section];
              if (sectionResults.length === 0) return null;
              return (
                <CommandGroup key={section} heading={section}>
                  {sectionResults.map((result) => {
                    const Icon = result.icon;
                    return (
                      <CommandItem
                        key={result.id}
                        value={`${result.title} ${result.description} ${result.searchText}`}
                        onSelect={() => selectResult(result)}
                      >
                        <Icon className="mr-3 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{result.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {result.description}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
        </CommandList>
        <div className="flex items-center justify-between border-t px-3 py-2 text-[10px] text-muted-foreground">
          <span>Use ↑↓ para navegar e Enter para abrir</span>
          <span className="flex items-center gap-1">
            <Search className="h-3 w-3" /> Ctrl K
          </span>
        </div>
      </CommandDialog>
    </SearchContext.Provider>
  );
}

// O hook fica junto do provider para manter a API da busca em um único módulo.
export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useGlobalSearch precisa estar dentro de GlobalSearchProvider");
  return context;
}

export function GlobalSearchButton({
  compact = false,
  mobile = false,
}: {
  compact?: boolean;
  mobile?: boolean;
}) {
  const { openSearch } = useGlobalSearch();

  if (mobile) {
    return (
      <button
        type="button"
        onClick={openSearch}
        className="grid h-10 w-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted"
        aria-label="Abrir busca"
      >
        <SearchFlowIcon className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-colors hover:bg-white/[0.055] hover:text-white"
    >
      <SearchFlowIcon className="h-5 w-5 shrink-0" />
      {!compact && (
        <>
          <span className="flex-1 text-left text-sm font-medium">Buscar</span>
          <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
            Ctrl K
          </kbd>
        </>
      )}
    </button>
  );
}
