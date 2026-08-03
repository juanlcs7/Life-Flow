import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, MapPinOff } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="grid min-h-[65vh] place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <MapPinOff className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Erro 404</p>
        <h1 className="mt-2 font-display text-xl font-semibold">Esta página não existe</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          O endereço <span className="font-medium text-foreground">{location.pathname}</span> não foi encontrado no LifeFlow.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
