# LifeFlow

Aplicação de organização pessoal com agenda, tarefas, hábitos, metas, finanças,
saúde, estudos e documentos.

## Requisitos

- Node.js 20 ou mais recente
- npm
- Projeto no Supabase

## Configuração

1. Copie `.env.example` para `.env`.
2. Preencha a URL, a referência e a chave publicável do Supabase.
3. Instale as dependências:

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

O servidor local usa `http://localhost:8080`.

## Verificação e produção

```bash
npm test
npm run build
npm run preview
```

Os arquivos de produção são gerados em `dist/`.

## Backend

As migrações e funções do Supabase ficam na pasta `supabase/`.

### E-mail e monitoramento em produção

- Configure um provedor SMTP próprio em **Supabase > Authentication > SMTP Settings**.
- Cadastre a URL pública e `/reset-password` nas URLs de redirecionamento do Auth.
- Para registrar erros do frontend, defina `VITE_SENTRY_DSN` na Vercel. Sem essa variável, o monitoramento permanece desativado.
- `npm run test:e2e` valida autenticação no navegador. Defina `E2E_EMAIL` e `E2E_PASSWORD` apenas com uma conta exclusiva de teste para habilitar também o login real.

Depois de atualizar o projeto, aplique as migrations antes de publicar o frontend:

```bash
npx supabase db push
```

A migration `20260803_harden_financial_core.sql` protege o estado Premium,
valida limites do plano gratuito, torna as movimentações financeiras atômicas
e agenda os débitos automáticos. A integração de pagamentos reais ainda não faz
parte desta versão.
