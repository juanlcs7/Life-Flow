import { Card } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Shield, Coins, Sparkles } from "lucide-react";

interface Props {
  patrimony: number;
}

interface Tip {
  title: string;
  description: string;
  icon: typeof Lightbulb;
  tone: string;
}

function getTips(p: number): Tip[] {
  if (p <= 0) {
    return [
      {
        title: "Comece pela reserva de emergência",
        description: "Antes de investir, junte de 3 a 6 meses dos seus gastos em uma conta com liquidez diária (ex: Tesouro Selic ou CDB de liquidez diária a 100% do CDI).",
        icon: Shield, tone: "text-info",
      },
      {
        title: "Automatize um aporte mensal",
        description: "Mesmo R$ 50 por mês criam o hábito. O mais importante no início é a constância, não o valor.",
        icon: Sparkles, tone: "text-warning",
      },
    ];
  }
  if (p < 5000) {
    return [
      {
        title: "Foque em renda fixa segura",
        description: "Com patrimônio inicial, priorize Tesouro Selic e CDBs de bancos grandes com FGC. Liquidez e segurança valem mais que rentabilidade alta agora.",
        icon: Shield, tone: "text-info",
      },
      {
        title: "Monte sua reserva de emergência",
        description: "Mantenha o equivalente a 3-6 meses de despesas em produtos com liquidez diária antes de partir para investimentos de prazo maior.",
        icon: Coins, tone: "text-success",
      },
      {
        title: "Estude antes de diversificar",
        description: "Use este momento para aprender sobre renda variável com simulações, sem comprometer capital ainda.",
        icon: Lightbulb, tone: "text-warning",
      },
    ];
  }
  if (p < 30000) {
    return [
      {
        title: "Diversifique em renda fixa",
        description: "Distribua entre Tesouro IPCA+ (proteção contra inflação), CDBs prefixados e LCIs/LCAs isentas de IR para prazos maiores.",
        icon: Shield, tone: "text-info",
      },
      {
        title: "Experimente fundos imobiliários",
        description: "Aloque 10-20% em FIIs de tijolo e papel para começar a receber renda passiva mensal isenta de IR.",
        icon: TrendingUp, tone: "text-success",
      },
      {
        title: "Pequena exposição em variável",
        description: "Considere até 10% em ETFs amplos (BOVA11, IVVB11) para começar a se expor à bolsa de forma diversificada.",
        icon: Sparkles, tone: "text-warning",
      },
    ];
  }
  if (p < 100000) {
    return [
      {
        title: "Estratégia 60/30/10",
        description: "Sugestão: 60% renda fixa (Tesouro IPCA+, CDBs, LCIs), 30% renda variável (ações, ETFs, FIIs) e 10% em caixa/oportunidades.",
        icon: TrendingUp, tone: "text-success",
      },
      {
        title: "Diversifique geograficamente",
        description: "Considere ETFs internacionais (IVVB11, WRLD11) para reduzir risco país e se expor ao dólar.",
        icon: Sparkles, tone: "text-info",
      },
      {
        title: "Reavalie seu plano de aposentadoria",
        description: "Avalie PGBL/VGBL pelo benefício fiscal se você faz declaração completa do IR.",
        icon: Coins, tone: "text-warning",
      },
    ];
  }
  if (p < 500000) {
    return [
      {
        title: "Diversificação avançada",
        description: "Considere alocar em ações pagadoras de dividendos, ETFs setoriais, fundos multimercado e debêntures incentivadas (isentas de IR).",
        icon: TrendingUp, tone: "text-success",
      },
      {
        title: "Exposição internacional relevante",
        description: "20-30% em ativos no exterior (ETFs globais, BDRs, ou conta em corretora internacional) reduz risco e diversifica moedas.",
        icon: Sparkles, tone: "text-info",
      },
      {
        title: "Planejamento tributário",
        description: "Com este patrimônio, vale conversar com um assessor para otimizar IR e estruturar uma carteira de longo prazo.",
        icon: Lightbulb, tone: "text-warning",
      },
    ];
  }
  return [
    {
      title: "Carteira institucional",
      description: "Considere previdência privada com taxas baixas, fundos exclusivos, COE e debêntures incentivadas para otimização fiscal.",
      icon: Shield, tone: "text-info",
    },
    {
      title: "Patrimônio internacional",
      description: "Diversifique 30-40% em ativos no exterior (ETFs, REITs, treasuries) para proteção cambial e exposição global.",
      icon: Sparkles, tone: "text-success",
    },
    {
      title: "Planejamento sucessório",
      description: "Estruture holding familiar, seguros e fundos exclusivos para gestão eficiente e planejamento de sucessão.",
      icon: Lightbulb, tone: "text-warning",
    },
  ];
}

export function InvestmentTips({ patrimony }: Props) {
  const tips = getTips(patrimony);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-card to-primary/5 border-primary/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-sm sm:text-base">Dicas para o seu perfil</h3>
          <p className="text-xs text-muted-foreground">
            Sugestões baseadas no seu patrimônio atual: <span className="font-medium text-foreground">{fmt(patrimony)}</span>
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {tips.map((t, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/60 border border-border/50">
            <t.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${t.tone}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">
        Estas sugestões são apenas educativas e não constituem recomendação de investimento.
      </p>
    </Card>
  );
}