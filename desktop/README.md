# Pedidos Express - API & Web Dashboard

API backend e dashboard web desenvolvido com Next.js para o sistema Pedidos Express. Este é o repositório principal que contém toda a lógica de negócio, banco de dados e interface administrativa.

## 🌐 Sobre o Projeto

Este é o núcleo do sistema Pedidos Express, contendo:

- 🔌 API REST completa em Next.js
- 🖥️ Dashboard web para gestão
- 💾 Banco de dados PostgreSQL com Prisma
- 🔄 Integração com WhatsApp
- 📊 Sistema de relatórios e estatísticas
- 🏪 Suporte multi-tenant
- 🖨️ Sistema de impressão de recibos

## 🛠️ Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Estilização**: Tailwind CSS
- **Autenticação**: JWT + Session
- **Cloud Storage**: AWS S3
- **NoSQL**: AWS DynamoDB (para WhatsApp)
- **Deploy**: Vercel

## 📦 Estrutura do Projeto

```
desktop/
├── app/                          # Rotas Next.js (App Router)
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticação
│   │   ├── orders/               # Pedidos
│   │   ├── bot/                  # Bot WhatsApp
│   │   ├── admin/                # Admin endpoints
│   │   └── webhook/              # Webhooks
│   ├── dashboard/                # Dashboard principal
│   ├── login/                    # Login
│   └── ...
├── components/                   # Componentes React
├── lib/                          # Bibliotecas e utilitários
│   ├── prisma.ts                 # Cliente Prisma
│   ├── auth.ts                   # Autenticação
│   ├── whatsapp-bot/             # Integração bot
│   └── ...
├── prisma/                       # Schema e migrations
│   ├── schema.prisma
│   └── migrations/
├── public/                       # Arquivos estáticos
└── scripts/                      # Scripts utilitários
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18.0 ou superior
- PostgreSQL 14+
- Conta AWS (para S3 e DynamoDB)
- Variáveis de ambiente configuradas

### Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/ryanfigueredo/pedidos-express-api.git
cd pedidos-express-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

4. Configure o banco de dados:
```bash
# Gere o cliente Prisma
npm run prisma:generate

# Execute as migrations
npm run prisma:migrate

# (Opcional) Abra o Prisma Studio
npm run prisma:studio
```

5. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build de Produção

```bash
npm run build
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/pedidos_express

# NextAuth
NEXTAUTH_SECRET=sua_secret_key
NEXTAUTH_URL=http://localhost:3000

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_S3_BUCKET=seu_bucket

# WhatsApp
WHATSAPP_ACCESS_TOKEN=seu_token
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
WHATSAPP_VERIFY_TOKEN=seu_verify_token

# DynamoDB
DYNAMODB_TABLE_NAME=pedidos-express-conversations

# Sentry (opcional)
SENTRY_DSN=sua_sentry_dsn
```

## 📋 Funcionalidades Principais

### API Endpoints

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/mobile-login` - Login mobile

#### Pedidos
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/[id]` - Detalhes do pedido
- `PUT /api/orders/[id]/status` - Atualizar status
- `POST /api/orders/[id]/request-print` - Solicitar impressão
- `GET /api/orders/stream` - Stream de pedidos (SSE)

#### Bot WhatsApp
- `POST /api/bot/webhook` - Webhook do bot
- `GET /api/bot/menu/public` - Cardápio público

#### Admin
- `GET /api/admin/stats` - Estatísticas
- `GET /api/admin/tenants` - Listar tenants
- `POST /api/admin/tenants` - Criar tenant
- `GET /api/admin/users` - Listar usuários

### Dashboard Web

- **Dashboard**: Visão geral com métricas e pedidos recentes
- **Pedidos**: Gerenciamento completo de pedidos
- **Cardápio**: Edição de itens e categorias
- **Vendas**: Relatórios e estatísticas
- **Atendimento**: Chat integrado
- **Loja**: Configurações da loja
- **Admin**: Painel administrativo (multi-tenant)

## 🗄️ Banco de Dados

O projeto utiliza Prisma ORM. Para fazer alterações no schema:

1. Edite `prisma/schema.prisma`
2. Crie uma migration:
```bash
npm run prisma:migrate
```
3. O cliente Prisma será regenerado automaticamente

## 🔐 Autenticação

O sistema utiliza NextAuth.js com JWT para autenticação. Suporta:

- Login web (email/senha)
- Login mobile (token)
- Sessões persistentes
- Multi-tenant por usuário

## 🖨️ Sistema de Impressão

- Suporte a impressoras térmicas ESC/POS
- Fila de impressão
- Histórico de impressões
- Reimpressão de recibos

## 📊 Multi-tenant

O sistema suporta múltiplos restaurantes (tenants):

- Isolamento de dados por tenant
- Configurações personalizadas por loja
- Logos e branding customizados

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outros Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- AWS App Runner
- Railway
- Render
- DigitalOcean App Platform

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Contribuição

Este é um projeto privado. Para questões ou sugestões, entre em contato com a equipe de desenvolvimento.

## 📞 Suporte

Para suporte técnico, abra uma issue no repositório.

---

**Repositório**: [pedidos-express-api](https://github.com/ryanfigueredo/pedidos-express-api)  
**Versão**: 0.1.0  
**Última atualização**: 2025
