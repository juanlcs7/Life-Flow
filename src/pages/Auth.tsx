import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  WalletCards,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/authErrors";
import { LifeFlowLanding } from "@/components/auth/LifeFlowLanding";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const signupSchema = loginSchema
  .extend({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const highlights = [
  { icon: WalletCards, label: "Dinheiro sem planilhas", detail: "Saldo, gastos e metas em uma visão" },
  { icon: CalendarDays, label: "Dia sem esquecimentos", detail: "Agenda, tarefas e hábitos conectados" },
  { icon: Target, label: "Planos em movimento", detail: "Clareza para decidir o próximo passo" },
];

export default function Auth() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [sendingRecovery, setSendingRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const openAuth = (login: boolean) => {
    setIsLogin(login);
    setShowAuth(true);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = (isLogin ? loginSchema : signupSchema).safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((error) => {
          if (error.path[0]) fieldErrors[String(error.path[0])] = error.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const authResult = isLogin
        ? { ...(await signIn(formData.email, formData.password)), session: null }
        : await signUp(formData.email, formData.password, formData.name);
      const { error } = authResult;

      if (error) {
        toast({
          title: isLogin ? "Não foi possível entrar" : "Não foi possível criar a conta",
          description: translateAuthError(error),
          variant: "destructive",
        });
        return;
      }

      if (!isLogin && !authResult.session) {
        setVerificationEmail(formData.email.trim().toLowerCase());
        return;
      }

      toast({
        title: isLogin ? "Bem-vindo de volta!" : "Sua conta está pronta!",
        description: isLogin
          ? "Login realizado com sucesso."
          : "Comece agora a organizar sua vida.",
      });
    } catch {
      toast({
        title: "Algo deu errado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((current) => !current);
    setErrors({});
    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    setResendingVerification(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: verificationEmail,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setResendingVerification(false);
    toast(error
      ? { title: "Não foi possível reenviar", description: translateAuthError(error), variant: "destructive" }
      : { title: "E-mail reenviado", description: "Confira também a caixa de spam." });
  };

  const handleRecovery = async () => {
    const result = z.string().email().safeParse(recoveryEmail);
    if (!result.success) {
      toast({ title: "Digite um e-mail válido", variant: "destructive" });
      return;
    }
    setSendingRecovery(true);
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingRecovery(false);
    if (error) {
      toast({ title: "Não foi possível enviar o e-mail", description: translateAuthError(error), variant: "destructive" });
      return;
    }
    setRecoverySent(true);
  };

  if (!showAuth) {
    return <LifeFlowLanding onLogin={() => openAuth(true)} onSignup={() => openAuth(false)} />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050b18]">
      <Dialog open={recoveryOpen} onOpenChange={(next) => { setRecoveryOpen(next); if (!next) { setRecoverySent(false); setRecoveryEmail(""); } }}>
        <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <DialogHeader><DialogTitle>{recoverySent ? "Confira seu e-mail" : "Recuperar acesso"}</DialogTitle></DialogHeader>
          {recoverySent ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">Enviamos um link para <strong className="text-slate-700">{recoveryEmail}</strong>. Abra o e-mail para criar uma nova senha.</p>
              <Button className="w-full bg-teal-600 text-white hover:bg-teal-700" onClick={() => setRecoveryOpen(false)}>Entendi</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">Informe o e-mail usado no LifeFlow. Você receberá um link de recuperação.</p>
              <div className="space-y-2">
                <Label htmlFor="recovery-email" className="text-slate-700">E-mail</Label>
                <Input id="recovery-email" type="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} className="h-11 border-slate-200 text-slate-950" onKeyDown={(event) => { if (event.key === "Enter") handleRecovery(); }} />
              </div>
              <Button className="w-full bg-teal-600 text-white hover:bg-teal-700" onClick={handleRecovery} disabled={sendingRecovery}>
                {sendingRecovery && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar link
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="absolute inset-0 auth-grid opacity-30" />
      <div className="absolute -left-32 top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/25 blur-[120px]" />
      <div className="absolute right-[-12rem] top-1/4 h-[32rem] w-[32rem] rounded-full bg-violet-500/20 blur-[130px]" />
      <div className="absolute -right-36 bottom-[-16rem] h-[38rem] w-[38rem] rounded-full bg-emerald-400/18 blur-[130px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden flex-col justify-between px-14 py-12 lg:flex xl:px-20 xl:py-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              <img src="/lifeflow-logo.png" alt="" className="h-9 w-9 object-contain" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">LifeFlow</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="max-w-2xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.9)]" />
              <Sparkles className="h-4 w-4" />Sua vida em um único fluxo
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-[-0.04em] text-white xl:text-6xl">
              Menos tempo administrando.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                Mais tempo vivendo.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Finanças, compromissos, hábitos e objetivos trabalhando juntos para mostrar o que importa agora — e o que vem depois.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, label, detail }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.08]"
                >
                  <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                  <p className="text-sm font-medium text-slate-100">{label}</p>
                  <p className="mt-1.5 text-[11px] leading-4 text-slate-400">{detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-300" />Comece em poucos minutos</span><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Seus dados protegidos</span></div>
        </section>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[470px] rounded-[2.25rem] border border-white/70 bg-white/[0.96] p-6 shadow-[0_38px_120px_-28px_rgba(2,12,27,.8)] backdrop-blur-2xl sm:p-9"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src="/lifeflow-logo.png" alt="LifeFlow" className="h-11 w-11 object-contain" />
              <span className="font-display text-xl font-bold text-slate-900">LifeFlow</span>
            </div>

            {verificationEmail ? (
              <div className="py-4 text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                  <MailCheck className="h-8 w-8" />
                </span>
                <p className="mt-6 text-sm font-semibold text-teal-600">Conta criada</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">Verifique seu e-mail</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Enviamos um link de confirmação para <strong className="text-slate-700">{verificationEmail}</strong>.
                  Abra a mensagem para ativar sua conta antes de entrar.
                </p>
                <div className="mt-6 space-y-3">
                  <Button className="h-12 w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white" onClick={() => { setVerificationEmail(null); setIsLogin(true); setFormData((current) => ({ ...current, password: "", confirmPassword: "" })); }}>
                    Ir para o login
                  </Button>
                  <Button variant="outline" className="h-11 w-full border-slate-200 text-slate-700" onClick={handleResendVerification} disabled={resendingVerification}>
                    {resendingVerification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Reenviar e-mail
                  </Button>
                </div>
                <p className="mt-4 text-xs text-slate-400">Não encontrou? Verifique a caixa de spam ou lixo eletrônico.</p>
              </div>
            ) : <>
            <button type="button" onClick={() => setShowAuth(false)} className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-slate-700"><ArrowLeft className="h-4 w-4" />Voltar para apresentação</button>
            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-teal-600">
                {isLogin ? "Sua central espera por você" : "Seu novo fluxo começa aqui"}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                {isLogin ? "Entre na sua conta" : "Crie sua conta"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isLogin
                  ? "Entre e veja tudo o que merece sua atenção hoje."
                  : "Crie sua conta e organize o essencial em poucos minutos."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <Field
                  id="name"
                  label="Nome"
                  icon={User}
                  placeholder="Como podemos chamar você?"
                  value={formData.name}
                  error={errors.name}
                  onChange={handleChange}
                />
              )}

              <Field
                id="email"
                label="Email"
                icon={Mail}
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                error={errors.email}
                onChange={handleChange}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700">Senha</Label>
                  {isLogin && (
                    <button type="button" onClick={() => { setRecoveryEmail(formData.email); setRecoveryOpen(true); }} className="text-xs font-medium text-teal-600 hover:text-teal-700">
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo de 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 border-slate-200 bg-slate-50/70 pl-10 pr-11 text-slate-950 placeholder:text-slate-400 focus-visible:ring-teal-500"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {!isLogin && (
                <Field
                  id="confirmPassword"
                  label="Confirmar senha"
                  icon={Check}
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita sua senha"
                  value={formData.confirmPassword}
                  error={errors.confirmPassword}
                  onChange={handleChange}
                />
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-500/20 transition hover:from-teal-600 hover:to-cyan-600"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Entrar no LifeFlow" : "Criar minha conta"}
              </Button>
            </form>

            <div className="my-6 h-px bg-slate-100" />
            <button
              type="button"
              onClick={toggleMode}
              className="w-full text-center text-sm text-slate-500 transition hover:text-slate-800"
            >
              {isLogin ? "Ainda não tem uma conta? " : "Já possui uma conta? "}
              <span className="font-semibold text-teal-600">
                {isLogin ? "Criar conta grátis" : "Entrar"}
              </span>
            </button>
            </>}
          </motion.div>
        </section>
      </div>
    </main>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  placeholder,
  value,
  error,
  onChange,
}: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-slate-700">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-12 border-slate-200 bg-slate-50/70 pl-10 text-slate-950 placeholder:text-slate-400 focus-visible:ring-teal-500"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
