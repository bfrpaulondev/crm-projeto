# CRM Pipeline Frontend

Aplicação frontend moderna para o CRM Pipeline, construída com Next.js 15, React 19, TypeScript e Apollo Client. Desenvolvida com foco em UX/UI profissional, acessibilidade e design responsivo.

## Stack Tecnológica

- **Next.js 15** - App Router, Server Components
- **React 19** - Hooks, Context API
- **TypeScript** - Type safety completo
- **Apollo Client** - GraphQL client com cache
- **Tailwind CSS 4** - Utility-first CSS
- **shadcn/ui** - Componentes acessíveis
- **Recharts** - Gráficos e visualizações
- **React Hook Form + Zod** - Formulários com validação
- **Lucide React** - Ícones

## Arquitetura

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   │   ├── login/         # Página de login
│   │   └── register/      # Página de registro
│   ├── (dashboard)/       # Rotas autenticadas
│   │   ├── page.tsx       # Dashboard principal
│   │   ├── leads/         # Gestão de leads
│   │   ├── pipeline/      # Pipeline Kanban
│   │   └── settings/      # Configurações
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Redirect root
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── layout/            # Header, Sidebar, MobileNav
│   ├── dashboard/         # MetricCard, PipelineBoard, Charts
│   └── forms/             # LoginForm, RegisterForm, LeadForm
├── lib/
│   ├── apollo/            # Apollo Client configuration
│   ├── auth/              # Auth context e hooks
│   └── graphql/           # GraphQL client nativo
├── hooks/                 # Custom hooks (useToast, useMobile)
└── types/                 # TypeScript interfaces
```

## Funcionalidades

### Autenticação
- Login com email/senha
- Registro com criação de tenant
- JWT tokens com refresh automático
- Proteção de rotas autenticadas

### Dashboard
- Cards de métricas (leads, oportunidades, pipeline)
- Gráfico de pipeline por estágio
- Tabela de leads recentes
- Ações rápidas

### Gestão de Leads
- Listagem com paginação
- Filtros por status
- Criação e edição
- Visualização detalhada

### Pipeline Kanban
- Visualização de oportunidades por estágio
- Drag and drop para mover entre estágios
- Resumo de valores por coluna

### UX/UI
- Design moderno com gradientes
- Tema escuro por padrão
- Totalmente responsivo (mobile-first)
- Animações suaves
- Feedback visual (loading, error, success)

## Quick Start

### Pré-requisitos
- Node.js 20+
- npm, yarn, ou bun

### Instalação

```bash
# Clone o repositório
git clone https://github.com/bfrpaulondev/crm-projeto.git
cd crm-projeto

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite o .env.local com a URL da API

# Inicie em desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
# .env.local para desenvolvimento local
NEXT_PUBLIC_GRAPHQL_API_URL=http://localhost:4000/graphql

# .env.production para produção
NEXT_PUBLIC_GRAPHQL_API_URL=https://crm-api-89lh.onrender.com/graphql
```

## Deploy na Vercel

### 1. Preparação
O projeto já está configurado para deploy na Vercel:

- `next.config.ts` otimizado
- `.env.production` com variáveis de produção
- Build command: `next build`
- Output: standalone

### 2. Deploy

1. Acesse [Vercel](https://vercel.com)
2. Clique em **New Project**
3. Importe o repositório `bfrpaulondev/crm-projeto`
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Adicione variáveis de ambiente:
   - `NEXT_PUBLIC_GRAPHQL_API_URL` = `https://crm-api-89lh.onrender.com/graphql`

6. Clique em **Deploy**

### 3. Domínio Customizado (Opcional)
Após o deploy, configure um domínio customizado nas configurações do projeto na Vercel.

## Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento (localhost:3000)
npm run build    # Build para produção
npm run start    # Inicia servidor produção
npm run lint     # ESLint check
```

## API GraphQL

A aplicação consome a API GraphQL disponível em:
- **Produção**: https://crm-api-89lh.onrender.com/graphql
- **Repositório**: https://github.com/bfrpaulondev/crm-api

### Principais Queries

```graphql
query Me {
  me { id email firstName lastName role }
}

query Leads($first: Int, $filter: LeadFilterInput) {
  leads(first: $first, filter: $filter) {
    edges { node { id firstName lastName email status } }
    pageInfo { hasNextPage totalCount }
  }
}

query Dashboard {
  me { id }
  leads(first: 5) {
    edges { node { id firstName lastName email status } }
  }
}
```

### Principais Mutations

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    user { id email firstName lastName role }
    tenant { id name slug plan }
  }
}

mutation Register($input: RegisterInput!) {
  register(input: $input) {
    accessToken
    user { id email }
    tenant { id name }
  }
}

mutation CreateLead($input: CreateLeadInput!) {
  createLead(input: $input) {
    id firstName lastName email status
  }
}
```

## Design Patterns & Clean Code

Este projeto segue princípios de Clean Code e SOLID:

- **Single Responsibility**: Componentes com uma única responsabilidade
- **Open/Closed**: Componentes extensíveis via props e composition
- **Dependency Injection**: Context API para dependências compartilhadas
- **Interface Segregation**: Tipos específicos para cada contexto
- **DRY (Don't Repeat Yourself)**: Componentes reutilizáveis
- **Composition over Inheritance**: Compound components pattern

## Acessibilidade

- Componentes shadcn/ui seguem WCAG 2.1
- Labels e ARIA attributes
- Navegação por teclado
- Focus management
- Contraste adequado

## Contato

**Bruno Paulon**
- GitHub: [@bfrpaulondev](https://github.com/bfrpaulondev)
- Email: bfrpaulondev@gmail.com

---

Desenvolvido por Bruno Paulon
