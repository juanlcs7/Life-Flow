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
