# X1 Pay

Plataforma de gestão de pagamentos, produtos, pedidos e checkout.

## Requisitos

- Node.js 18+
- PostgreSQL

## Instalação

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL, NEXTAUTH_SECRET e PAGARME_SECRET_KEY no .env

npm run db:push
npm run db:seed
npm run dev
```

## Acesso

- **Admin:** http://localhost:3000/login
- **Credenciais seed:** `admin@x1pay.com` / `admin123`
- **Checkout demo:** http://localhost:3000/checkout/produto-exemplo

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Sincroniza schema Prisma |
| `npm run db:seed` | Popula dados iniciais |
| `npm run db:studio` | Abre Prisma Studio |

## Webhooks

- Pagar.me: `POST /api/webhook/pagarme`
- Logística (Payt): `POST /api/webhook/payt/[token]`
