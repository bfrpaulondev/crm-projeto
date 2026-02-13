# CRM Pipeline API

API GraphQL completa para gerenciamento de CRM e Pipeline de Vendas, construída com foco em performance, segurança e escalabilidade.

## Stack Tecnológica

- **Node.js 20+** com TypeScript
- **Apollo Server 4** - Servidor GraphQL
- **Pothos** - Schema-first GraphQL builder
- **MongoDB Atlas** - Banco de dados NoSQL cloud
- **Upstash Redis** - Cache e rate limiting serverless
- **JWT** - Autenticação com access/refresh tokens
- **OpenTelemetry** - Observabilidade e tracing
- **Pino** - Logging estruturado

## Arquitetura

```
src/
├── config/              # Configurações e variáveis de ambiente
├── infrastructure/      # Conexões com MongoDB, Redis, Logger, OpenTelemetry
├── types/               # Interfaces, tipos e validações Zod
├── graphql/
│   ├── schema/          # Schema GraphQL com Pothos
│   ├── resolvers/       # Queries e Mutations
│   └── dataloaders.ts   # DataLoaders para N+1 prevention
├── repositories/        # Camada de acesso a dados
├── services/            # Lógica de negócio
├── middlewares/         # Auth, rate limiting, CORS
└── __tests__/           # Testes unitários, integração e contrato
```

## Funcionalidades

### Gestão de Entidades
- **Leads**: Criação, qualificação, conversão para oportunidades
- **Contas**: Empresas/clientes
- **Contatos**: Pessoas vinculadas às contas
- **Oportunidades**: Pipeline de vendas com estágios
- **Atividades**: Tarefas, calls, meetings, emails
- **Notas**: Anotações em entidades

### Segurança
- Autenticação JWT com refresh tokens
- Rate limiting com sliding window
- RBAC (Role-Based Access Control)
- Multi-tenancy isolado por tenantId
- Input sanitization e validação Zod
- Audit logging (append-only)

### Performance
- DataLoader para N+1 prevention
- Cursor-based pagination (Relay-style)
- Índices otimizados no MongoDB
- Cache Redis para queries frequentes
- Persisted Queries (APQ)

### Observabilidade
- Structured logging (Pino)
- Distributed tracing (OpenTelemetry + Jaeger)
- Health checks
- Metrics endpoint

## Quick Start

### Pré-requisitos
- Node.js 20+
- MongoDB Atlas (já configurado)
- Upstash Redis (já configurado)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/bfrpaulondev/crm-api.git
cd crm-api

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Crie os índices do MongoDB (primeira vez apenas)
npm run create-indexes

# Inicie em desenvolvimento
npm run dev
```

## Deploy no Render

### Opção 1: Blueprint (Recomendado)

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **New** → **Blueprint**
3. Conecte seu GitHub e selecione `bfrpaulondev/crm-api`
4. O Render detectará o `render.yaml` automaticamente
5. Configure as variáveis de ambiente manualmente:

| Variável | Valor |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://bfrpaulondev_db_user:fejwbKAe6t6QlPYg@cluster0.cy4nwmv.mongodb.net/crm_api?retryWrites=true&w=majority` |
| `UPSTASH_REDIS_REST_URL` | `https://summary-coyote-40506.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | `AZ46AAIncDIxN2Y4NTVhMGFiZDk0OTQ0YTZmOGNmODUwNTE2OWYzOXAyNDA1MDY` |
| `CORS_ORIGINS` | `https://seu-frontend.com` (ou `*` para desenvolvimento) |

6. Clique em **Apply**

### Opção 2: Manual

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **New** → **Web Service**
3. Conecte seu GitHub e selecione `bfrpaulondev/crm-api`
4. Configure:

| Campo | Valor |
|-------|-------|
| Name | `crm-api` |
| Region | Oregon (US West) |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | `Free` |

5. Adicione as variáveis de ambiente (mesma tabela acima)
6. Clique em **Create Web Service**

### Após o Deploy

Sua API estará disponível em: `https://crm-api.onrender.com`

Endpoints:
- GraphQL: `https://crm-api.onrender.com/graphql`
- Health: `https://crm-api.onrender.com/health`
- Ready: `https://crm-api.onrender.com/ready`

## Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `MONGODB_URI` | ✅ | Connection string do MongoDB Atlas |
| `UPSTASH_REDIS_REST_URL` | ✅ | URL do Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Token do Upstash Redis |
| `JWT_SECRET` | ✅ | Secret para access token (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Secret para refresh token (min 32 chars) |
| `CORS_ORIGINS` | ❌ | Origins permitidas (padrão: `*`) |
| `PORT` | ❌ | Porta do servidor (padrão: `4000`) |

## API Reference

### Endpoint
```
POST /graphql
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Queries Principais

```graphql
# Listar leads com paginação
query Leads($first: Int, $after: String, $filter: LeadFilterInput) {
  leads(first: $first, after: $after, filter: $filter) {
    edges {
      node { id name email status score }
    }
    pageInfo { hasNextPage endCursor }
  }
}

# Buscar oportunidade por ID
query Opportunity($id: ID!) {
  opportunity(id: $id) {
    id name value stage probability expectedCloseDate
    account { id name }
    contacts { id name email }
  }
}

# Dashboard com métricas
query Dashboard {
  dashboard {
    totalLeads
    qualifiedLeads
    totalOpportunities
    totalValue
    wonValue
    pipelineByStage {
      stage
      count
      value
    }
  }
}
```

### Mutations Principais

```graphql
# Criar lead
mutation CreateLead($input: CreateLeadInput!) {
  createLead(input: $input) {
    id name email company phone source status score
  }
}

# Qualificar lead
mutation QualifyLead($id: ID!, $score: Int!) {
  qualifyLead(id: $id, score: $score) {
    id status score qualifiedAt
  }
}

# Converter lead em oportunidade
mutation ConvertLead($id: ID!, $input: ConvertLeadInput!) {
  convertLead(id: $id, input: $input) {
    lead { id status convertedAt }
    opportunity { id name value }
    account { id name }
  }
}

# Criar oportunidade
mutation CreateOpportunity($input: CreateOpportunityInput!) {
  createOpportunity(input: $input) {
    id name value stage probability expectedCloseDate
  }
}

# Fechar oportunidade (ganha/perdida)
mutation CloseOpportunity($id: ID!, $won: Boolean!, $reason: String) {
  closeOpportunity(id: $id, won: $won, reason: $reason) {
    id status closedAt actualCloseDate lossReason
  }
}
```

### Autenticação

```graphql
# Login
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    refreshToken
    user { id name email role }
  }
}

# Refresh token
mutation RefreshToken($token: String!) {
  refreshToken(token: $token) {
    accessToken
    refreshToken
  }
}
```

## Testes

```bash
# Todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Apenas unitários
npm run test:unit

# Apenas integração
npm run test:integration
```

## Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build para produção
npm start            # Inicia servidor produção
npm test             # Executa testes
npm run lint         # ESLint
npm run create-indexes # Cria índices MongoDB
```

## RBAC - Controle de Acesso

| Role | Permissões |
|------|------------|
| `ADMIN` | Acesso total, gestão de usuários |
| `MANAGER` | CRUD todas entidades, relatórios |
| `SALES_REP` | CRUD próprios leads/oportunidades |
| `READ_ONLY` | Apenas leitura |

## Próximos Passos

Antes de ir para produção:

1. **Altere os JWT Secrets** - Gere strings aleatórias de 64 caracteres
2. **Configure CORS** - Defina a URL do seu frontend
3. **Crie os índices** - Execute `npm run create-indexes` após o deploy
4. **Configure storage** - Para uploads, configure AWS S3

## Contato

**Bruno Paulon**
- GitHub: [@bfrpaulondev](https://github.com/bfrpaulondev)
- Email: bfrpaulondev@gmail.com

---

Desenvolvido por Bruno Paulon
