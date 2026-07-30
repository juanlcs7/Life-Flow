import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, MailCheck, Send, ShieldCheck } from "lucide-react";
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
  const [emailOpen, setEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [resending, setResending] = useState(false);

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

  const handleEmailChange = async () => {
    const normalizedEmail = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Digite um e-mail válido");
      return;
    }
    if (normalizedEmail === user?.email?.toLowerCase()) {
      toast.error("Este já é o e-mail da sua conta");
      return;
    }

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser(
      { email: normalizedEmail },
      { emailRedirectTo: `${window.location.origin}/configuracoes` },
    );
    setSavingEmail(false);

    if (error) {
      toast.error(error.message || "Não foi possível solicitar a alteração");
      return;
    }
    toast.success("Enviamos a confirmação para o novo e-mail");
    setEmailOpen(false);
    setNewEmail("");
  };

  const handleResendConfirmation = async () => {
    const pendingEmail = user?.new_email;
    const targetEmail = pendingEmail || user?.email;
    if (!targetEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: pendingEmail ? "email_change" : "signup",
      email: targetEmail,
      options: { emailRedirectTo: `${window.location.origin}/configuracoes` },
    });
    setResending(false);
    if (error) {
      toast.error(error.message || "Não foi possível reenviar a confirmação");
      return;
    }
    toast.success("E-mail de confirmação reenviado");
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

        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">E-mail da conta</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email}</p>
            {user?.new_email && (
              <p className="mt-1 truncate text-xs font-medium text-amber-500">Aguardando confirmação: {user.new_email}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {(!emailVerified || user?.new_email) && (
              <Button variant="ghost" size="sm" onClick={handleResendConfirmation} disabled={resending}>
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Reenviar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Alterar e-mail
            </Button>
          </div>
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

      <Dialog open={emailOpen} onOpenChange={(next) => { setEmailOpen(next); if (!next) setNewEmail(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Alterar e-mail</DialogTitle></DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            Enviaremos uma confirmação para o novo endereço. Dependendo da configuração de segurança, o Supabase também poderá confirmar a troca no e-mail atual.
          </p>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>E-mail atual</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Novo e-mail</Label>
              <Input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="novo@email.com" autoComplete="email" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEmailOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleEmailChange} disabled={savingEmail || !newEmail}>
                {savingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar confirmação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
