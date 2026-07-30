import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountSecurity() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const emailVerified = Boolean(user?.email_confirmed_at);
  const lastAccess = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Sessão atual";

  const resetForm = () => {
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const handlePasswordChange = async () => {
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error("Use pelo menos 8 caracteres, com letras e números");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não coincidem");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      toast.error(error.message || "Não foi possível alterar a senha");
      return;
    }

    toast.success("Senha alterada com sucesso");
    setOpen(false);
    resetForm();
  };

  return (
    <>
      <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-500">Proteção</p>
            <h3 className="mt-1 font-display text-lg font-semibold">Segurança da conta</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Confira o acesso e mantenha sua senha atualizada.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              {emailVerified ? <MailCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">E-mail</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-medium">
                {emailVerified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                {emailVerified ? "Verificado" : "Pendente"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <KeyRound className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Último acesso</p>
              <p className="mt-0.5 truncate text-sm font-medium">{lastAccess}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Senha de acesso</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Ao alterar, use uma senha que não utiliza em outros serviços.</p>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => setOpen(true)}>
            <KeyRound className="mr-2 h-4 w-4" />
            Alterar senha
          </Button>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A nova senha precisa ter pelo menos 8 caracteres, incluindo letras e números.
          </p>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handlePasswordChange} disabled={saving || !password || !confirmation}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar senha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
