# PLAN — Frontend (Sistema de Compras)

> Documento vivo e **independente** do plano do backend (`backend/PLAN.md`).
> UI em PT-BR; código, identificadores e commits em inglês (conventional
> commits).

---

## 1. Objetivo

SPA React que consome a API REST do backend (`backend/`, porta 3000) para
acompanhar gastos e controlar budget. Telas: dashboard, pedidos de compra,
budgets, projetos, fornecedores, segmentos/setores.

- v1 local, **sem autenticação** (backend não expõe usuários/roles).
- O budget **nunca bloqueia** criação de pedido — visualização apenas.

## 2. Stack

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Build        | Vite + React 19 + TypeScript      |
| Estilos      | **Tailwind CSS + shadcn/ui**      |
| Roteamento   | react-router v7                   |
| Server state | TanStack Query v5                 |
| Forms        | react-hook-form + zod             |
| HTTP         | `fetch` + client próprio          |
| Dev          | proxy Vite `/api` → `localhost:3000` |

### Por que proxy (e não CORS)?

Mesma origem em dev; zero mudança no backend; em produção basta servir o
build estático atrás do mesmo proxy.

## 3. Convenções

- **Money**: API devolve `string` (`"1234.56"`); exibição `R$ 1.234,56`
  (`Intl.NumberFormat`); input envia sempre 2 casas decimais, vírgula
  convertida para ponto.
- **Datas**: API devolve ISO (`"2026-10-01T00:00:00.000Z"`); exibição
  `dd/mm/aaaa`; inputs `type="date"` enviam `YYYY-MM-DD`.
- **Mês**: MonthPicker envia `YYYY-MM`.
- **Erros**: toast global usando o shape único do backend
  (`{ statusCode, message }`); mensagens de regra de negócio vêm em inglês —
  mapear para PT-BR nos casos conhecidos (ex.: "already exists" → "já existe").
- **Enums na UI**: `status`, `type`, `serviceType`, `paymentCondition`
  traduzidos via mapa de labels PT-BR (`utils/labels.ts`).

## 4. Estrutura

```
frontend/
├── vite.config.ts            # proxy /api → localhost:3000
├── src/
│   ├── main.tsx / App.tsx    # router + QueryClient + ToastProvider
│   ├── api/
│   │   ├── client.ts         # fetch + erro tipado
│   │   ├── types/            # espelham DTOs do backend
│   │   └── endpoints/        # um módulo por recurso
│   ├── components/           # Layout, DataTable, MoneyInput, MonthPicker,
│   │                         # StatusBadge, ConfirmDialog, EmptyState, Toaster
│   ├── pages/                # Dashboard, PurchaseOrders, Budgets, Projects,
│   │                         # Suppliers, Segments
│   └── utils/                # formatMoney, formatDate, labels (PT-BR)
```

## 5. Telas → endpoints

| Rota           | Tela         | Endpoints |
|----------------|--------------|-----------|
| `/`            | Dashboard    | `GET /dashboard?month=` |
| `/pedidos`     | Pedidos      | CRUD `/purchase-orders`, `POST /:id/approve`, `PATCH /:id/status`, `PUT /:id/projects` |
| `/orcamentos`  | Budgets      | CRUD `/budgets`, `GET /budgets/indicator?month=` |
| `/projetos`    | Projetos     | CRUD `/projects` |
| `/fornecedores`| Fornecedores | CRUD `/suppliers` (`?search=`) |
| `/segmentos`   | Segmentos    | CRUD `/segments`, CRUD `/sectors` (`?segmentId=`) |

Regra do form de pedido: segmento `PROJECT` → seletor de projeto (vinculado
após criar via `PUT /:id/projects`); `STANDARD` → seletor de setor +
`resource`.

Dashboard usa barras CSS (sem lib de gráficos); upgrade opcional: recharts.

## 6. Fases de implementação

- [x] 1. Scaffold: Vite + React + TS + Tailwind + shadcn/ui, proxy, Layout
      com nav, API client, TanStack Query, toast, types dos DTOs
- [x] 2. Suppliers: CRUD + busca + validação CNPJ (14 dígitos)
- [x] 3. Segments: CRUD de segmento + setores aninhados
- [x] 4. Projects: CRUD + barra budget vs realCost
- [x] 5. Purchase orders: lista com filtros (status/fornecedor/segmento/projeto/mês)
- [x] 6. Purchase orders: formulário criar/editar + vincular projetos
- [ ] 7. Purchase orders: aprovar + transições de status (com confirmação)
- [ ] 8. Budgets: CRUD + indicador semanal (planned/realized/remaining)
- [ ] 9. Dashboard: cards + rankings + indicador do mês
- [ ] 10. Polish: estados vazios, loading, mensagens de erro amigáveis

Cada fase = 1 commit conventional (inglês) + validação (build + smoke manual
com backend em `npm run start:dev`).

## 7. Regra de workflow (obrigatória)

1. Implementar **uma fase por vez**.
2. Ao final da fase: validar (build + smoke) e **pedir confirmação** antes de
   seguir para a próxima.
3. Ao confirmar, marcar a fase concluída no checklist da seção 6 (`- [x]`) e
   commitar a atualização do PLAN.md junto.
4. Nenhuma fase seguinte começa sem a confirmação do usuário.
