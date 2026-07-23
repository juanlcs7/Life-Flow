import { useMemo, useRef, useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Search,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
  Download,
  Calendar,
  AlertTriangle,
  Loader2,
  Plus,
  X,
  Tag as TagIcon,
  Filter as FilterIcon,
  Folder,
  FileType2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDocuments, DocumentRow } from "@/hooks/useDocuments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const DEFAULT_FOLDERS = ["Geral", "Comprovantes", "Contratos", "Recibos", "Pessoal", "Trabalho", "Saúde"];

type TypeKey = "pdf" | "image" | "doc" | "sheet" | "other";
const TYPE_META: Record<TypeKey, { label: string; icon: any; color: string }> = {
  pdf:   { label: "PDFs",       icon: FileText,  color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  image: { label: "Imagens",    icon: ImageIcon, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  doc:   { label: "Documentos", icon: FileText,  color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  sheet: { label: "Planilhas",  icon: FileText,  color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  other: { label: "Outros",     icon: FileIcon,  color: "bg-muted text-muted-foreground" },
};

function typeOf(mime: string | null): TypeKey {
  if (!mime) return "other";
  if (mime.startsWith("image/")) return "image";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "sheet";
  if (mime.includes("word") || mime.includes("text") || mime.includes("document")) return "doc";
  return "other";
}

function iconFor(mime: string | null) {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("word")) return FileText;
  return FileIcon;
}

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function Documentos() {
  const { documents, isLoading, upload, isUploading, remove, getSignedUrl, updateTags } = useDocuments();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"folder" | "type">("folder");
  const [folder, setFolder] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeKey | "all">("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [validityFilter, setValidityFilter] = useState<"all" | "expiring" | "expired">("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState("Geral");
  const [expiry, setExpiry] = useState("");
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const folders = useMemo(() => {
    const set = new Set(DEFAULT_FOLDERS);
    documents.forEach((d) => set.add(d.folder));
    return Array.from(set);
  }, [documents]);

  const folderCounts = useMemo(() => {
    const m: Record<string, number> = {};
    documents.forEach((d) => (m[d.folder] = (m[d.folder] || 0) + 1));
    return m;
  }, [documents]);

  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    documents.forEach((d) => {
      const t = typeOf(d.mime_type);
      m[t] = (m[t] || 0) + 1;
    });
    return m;
  }, [documents]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    documents.forEach((d) => (d.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    const today = new Date();
    return documents.filter((d) => {
      if (groupBy === "folder" && folder !== "all" && d.folder !== folder) return false;
      if (groupBy === "type" && typeFilter !== "all" && typeOf(d.mime_type) !== typeFilter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeTags.length > 0 && !activeTags.every((t) => (d.tags || []).includes(t))) return false;
      if (validityFilter !== "all") {
        if (!d.expiry_date) return false;
        const days = differenceInDays(parseISO(d.expiry_date), today);
        if (validityFilter === "expired" && days >= 0) return false;
        if (validityFilter === "expiring" && (days < 0 || days > 30)) return false;
      }
      return true;
    });
  }, [documents, groupBy, folder, typeFilter, search, activeTags, validityFilter]);

  const expiring = useMemo(() => {
    const today = new Date();
    return documents.filter((d) => {
      if (!d.expiry_date) return false;
      const days = differenceInDays(parseISO(d.expiry_date), today);
      return days >= 0 && days <= 60;
    });
  }, [documents]);

  const totalSize = documents.reduce((s, d) => s + d.size_bytes, 0);

  const addTagFromInput = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !uploadTags.includes(t)) setUploadTags([...uploadTags, t]);
    setTagInput("");
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagFromInput();
    } else if (e.key === "Backspace" && !tagInput && uploadTags.length) {
      setUploadTags(uploadTags.slice(0, -1));
    }
  };

  const toggleFilterTag = (t: string) =>
    setActiveTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const handleSubmit = async () => {
    if (!file) return toast.error("Selecione um arquivo");
    if (file.size > 20 * 1024 * 1024) return toast.error("Arquivo maior que 20 MB");
    try {
      await upload({
        file,
        folder: uploadFolder,
        expiry_date: expiry || null,
        notes: notes || null,
        tags: uploadTags,
      });
      toast.success("Documento enviado!");
      setUploadOpen(false);
      setFile(null); setExpiry(""); setNotes(""); setUploadFolder("Geral"); setUploadTags([]); setTagInput("");
    } catch (e: any) {
      toast.error(e.message || "Falha ao enviar");
    }
  };

  const handleOpen = async (doc: DocumentRow) => {
    try {
      const url = await getSignedUrl(doc.file_path);
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  const handleDelete = async (doc: DocumentRow) => {
    if (!confirm(`Excluir "${doc.name}"?`)) return;
    try {
      await remove(doc);
      toast.success("Documento excluído");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload modal */}
      <Dialog open={uploadOpen} onOpenChange={(o) => { setUploadOpen(o); if (!o) setFile(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/40 transition",
                file ? "border-success" : "border-border",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{fmtSize(file.size)}</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">PDF, imagens ou outros até 20 MB</p>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Pasta</Label>
              <Select value={uploadFolder} onValueChange={setUploadFolder}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5" /> Tags
              </Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-10 focus-within:ring-1 focus-within:ring-ring">
                {uploadTags.map((t) => (
                  <span key={t} className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => setUploadTags(uploadTags.filter((x) => x !== t))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  onBlur={addTagFromInput}
                  placeholder={uploadTags.length ? "" : "ex: imposto, urgente, 2026"}
                  className="flex-1 min-w-[100px] bg-transparent text-sm outline-none"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Enter ou vírgula para adicionar</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Validade (opcional)</Label>
                <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Observação</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: nº contrato" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setUploadOpen(false)}>Cancelar</Button>
              <Button className="flex-1" disabled={isUploading || !file} onClick={handleSubmit}>
                {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Documentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {documents.length} arquivo(s) • {fmtSize(totalSize)} armazenados
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gradient-documents text-documents-foreground active:scale-95">
          <Plus className="w-4 h-4 mr-2" />Enviar
        </Button>
      </motion.div>

      {/* Expiring alert */}
      {expiring.length > 0 && (
        <Card className="p-4 border-warning bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Documentos a vencer</p>
              <p className="text-xs text-muted-foreground">{expiring.length} documento(s) vencem em até 60 dias</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {expiring.slice(0, 4).map((d) => (
                  <span key={d.id} className="text-[11px] bg-warning/10 text-warning px-2 py-0.5 rounded">
                    {d.name} — {format(parseISO(d.expiry_date!), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Grouping toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-semibold text-sm">
          {groupBy === "folder" ? "Pastas" : "Por tipo de arquivo"}
        </h3>
        <div className="inline-flex rounded-lg border bg-card p-0.5 text-xs">
          <button
            onClick={() => setGroupBy("folder")}
            className={cn(
              "px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors active:scale-95",
              groupBy === "folder" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Folder className="w-3.5 h-3.5" /> Pastas
          </button>
          <button
            onClick={() => setGroupBy("type")}
            className={cn(
              "px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors active:scale-95",
              groupBy === "type" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileType2 className="w-3.5 h-3.5" /> Tipo
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {groupBy === "folder" ? (
          <>
            <FolderChip label="Todas" count={documents.length} active={folder === "all"} onClick={() => setFolder("all")} icon={Folder} />
            {folders.map((f) => (
              <FolderChip key={f} label={f} count={folderCounts[f] || 0} active={folder === f} onClick={() => setFolder(f)} icon={Folder} />
            ))}
          </>
        ) : (
          <>
            <FolderChip label="Todos" count={documents.length} active={typeFilter === "all"} onClick={() => setTypeFilter("all")} icon={FileType2} />
            {(Object.keys(TYPE_META) as TypeKey[]).map((t) => (
              <FolderChip
                key={t}
                label={TYPE_META[t].label}
                count={typeCounts[t] || 0}
                active={typeFilter === t}
                onClick={() => setTypeFilter(t)}
                icon={TYPE_META[t].icon}
              />
            ))}
          </>
        )}
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <TagIcon className="w-3 h-3" /> Tags
            {activeTags.length > 0 && (
              <button onClick={() => setActiveTags([])} className="ml-auto text-primary hover:underline">
                Limpar
              </button>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleFilterTag(t)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-colors active:scale-95",
                  activeTags.includes(t)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-muted/50 border-border",
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validity filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <FilterIcon className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Validade:</span>
        {(["all", "expiring", "expired"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setValidityFilter(v)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors active:scale-95",
              validityFilter === v
                ? "bg-foreground text-background border-foreground"
                : "bg-card hover:bg-muted/50 border-border",
            )}
          >
            {v === "all" ? "Todos" : v === "expiring" ? "Vencendo (30d)" : "Vencidos"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar documentos..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Nenhum documento</p>
          <p className="text-xs mt-1">Clique em "Enviar" para adicionar seu primeiro arquivo</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((doc, i) => {
            const Icon = iconFor(doc.mime_type);
            const tkey = typeOf(doc.mime_type);
            const expDays = doc.expiry_date ? differenceInDays(parseISO(doc.expiry_date), new Date()) : null;
            return (
              <motion.div key={doc.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleOpen(doc)} className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-80 transition", TYPE_META[tkey].color)}>
                      <Icon className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => handleOpen(doc)} className="text-left w-full">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{doc.name}</p>
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                        <span className="px-1.5 py-0.5 rounded bg-muted">{doc.folder}</span>
                        <span>•</span>
                        <span>{fmtSize(doc.size_bytes)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(doc.created_at), "dd MMM yyyy", { locale: ptBR })}
                        {expDays !== null && (
                          <span className={cn("ml-auto px-1.5 py-0.5 rounded", expDays < 0 ? "bg-destructive/10 text-destructive" : expDays <= 30 ? "bg-warning/10 text-warning" : "bg-muted")}>
                            {expDays < 0 ? "Vencido" : `Vence em ${expDays}d`}
                          </span>
                        )}
                      </div>
                      {(doc.tags?.length ?? 0) > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {doc.tags.slice(0, 4).map((t) => (
                            <button
                              key={t}
                              onClick={() => toggleFilterTag(t)}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition"
                            >
                              #{t}
                            </button>
                          ))}
                          {doc.tags.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => handleOpen(doc)}>
                      <Download className="w-3 h-3 mr-1" />Abrir
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(doc)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FolderChip({ label, count, active, onClick, icon: Icon = FolderOpen }: { label: string; count: number; active: boolean; onClick: () => void; icon?: any }) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border whitespace-nowrap transition-all active:scale-95",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted/50 border-border",
      )}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
      <span className={cn("text-[11px] px-1.5 rounded-full", active ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>
    </button>
  );
}