import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateAuthError } from "@/lib/authErrors";

export default function ResetPassword() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#07111f]"><Loader2 className="h-7 w-7 animate-spin text-cyan-300" /></div>;
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
      toast.error(translateAuthError(error, "Não foi possível definir a nova senha."));
      return;
    }
    setFinished(true);
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#07111f] p-4">
      <div className="absolute inset-0 auth-grid opacity-30" />
      <div className="absolute -left-32 top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/20 blur-[120px]" />
      <div className="absolute -right-36 bottom-[-16rem] h-[38rem] w-[38rem] rounded-full bg-emerald-400/20 blur-[130px]" />

      <section className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/[0.97] p-7 shadow-[0_32px_100px_-28px_rgba(2,12,27,.75)] sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <img src="/lifeflow-logo.png" alt="LifeFlow" className="h-11 w-11 object-contain" />
          <span className="font-display text-xl font-bold text-slate-900">LifeFlow</span>
        </div>

        {finished ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-display text-2xl font-bold text-slate-950">Senha atualizada</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sua nova senha já está valendo. Você pode continuar para o LifeFlow.</p>
            <Button className="mt-6 h-11 w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white" onClick={async () => { await signOut(); navigate("/auth", { replace: true }); }}>
              Ir para o login
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-teal-600">Recuperação de acesso</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-950">Crie uma nova senha</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use pelo menos 8 caracteres, incluindo letras e números.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-700">Nova senha</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input id="new-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 border-slate-200 bg-slate-50/70 pl-10 pr-11 text-slate-950" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700">Confirmar nova senha</Label>
                <Input id="confirm-password" type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-12 border-slate-200 bg-slate-50/70 text-slate-950" autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={saving || !password || !confirmation} className="h-12 w-full bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar nova senha
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
