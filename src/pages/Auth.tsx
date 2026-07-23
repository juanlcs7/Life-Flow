import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Target,
  User,
  WalletCards,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
  { icon: WalletCards, label: "Finanças sob controle" },
  { icon: CalendarDays, label: "Rotina organizada" },
  { icon: Target, label: "Metas que saem do papel" },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

      const { error } = isLogin
        ? await signIn(formData.email, formData.password)
        : await signUp(formData.email, formData.password, formData.name);

      if (error) {
        const knownMessage = error.message.includes("Invalid login credentials")
          ? "Email ou senha incorretos"
          : error.message.includes("User already registered")
            ? "Este email já está cadastrado. Tente entrar."
            : error.message;
        toast({
          title: isLogin ? "Não foi possível entrar" : "Não foi possível criar a conta",
          description: knownMessage,
          variant: "destructive",
        });
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f]">
      <div className="absolute inset-0 auth-grid opacity-30" />
      <div className="absolute -left-32 top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-cyan-400/20 blur-[120px]" />
      <div className="absolute -right-36 bottom-[-16rem] h-[38rem] w-[38rem] rounded-full bg-emerald-400/20 blur-[130px]" />

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
              Sua vida em um só fluxo
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-[-0.04em] text-white xl:text-6xl">
              Mais clareza para cuidar do que{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                realmente importa.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Planeje sua rotina, acompanhe suas finanças e transforme objetivos em progresso
              visível — todos os dias.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {highlights.map(({ icon: Icon, label }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur"
                >
                  <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                  <p className="text-sm font-medium text-slate-100">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <p className="text-sm text-slate-500">Organize hoje. Evolua todos os dias.</p>
        </section>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[470px] rounded-[2rem] border border-white/70 bg-white/[0.97] p-6 shadow-[0_32px_100px_-28px_rgba(2,12,27,.75)] backdrop-blur-xl sm:p-9"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src="/lifeflow-logo.png" alt="LifeFlow" className="h-11 w-11 object-contain" />
              <span className="font-display text-xl font-bold text-slate-900">LifeFlow</span>
            </div>

            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-teal-600">
                {isLogin ? "Que bom ter você de volta" : "Comece sua jornada"}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                {isLogin ? "Entre na sua conta" : "Crie sua conta"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {isLogin
                  ? "Continue de onde parou e veja o progresso do seu dia."
                  : "Leva menos de um minuto para começar."}
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
                <Label htmlFor="password" className="text-slate-700">Senha</Label>
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
