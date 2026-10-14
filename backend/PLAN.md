# PLAN — Purchase Control System (Sistema de Compras)

> Living document. This file describes the full scope, entity structure, business rules,
> endpoints and the roadmap for migrating to Spring Boot. Code and identifiers are in
> **English only**; this documentation is in PT-BR.

---

## 1. Objective

Track company purchases and control budget spending. The system:

- Registers purchase orders (goods and services).
- Groups orders by **segment / sector / project**.
- Controls a **budget per month and week of the month** (visualization only — the budget
  does **not** block order creation).
- Shows an overview dashboard: total savings (economia), spend by segment/project,
  budget planned vs. realized.

> v1 runs locally on a single machine. No authentication, no users, no roles.

---

## 2. Stack (v1)

| Layer     | Technology |
|-----------|------------|
| Backend   | **NestJS** + TypeScript |
| ORM       | **TypeORM** (entities use decorators — closely mirrors JPA for the future Spring Boot migration) |
| Database  | **SQLite** (v1) with **migrations enabled** — no SQLite-specific types are used, so migrating to **PostgreSQL** is only a `data-source.ts` change |
| Frontend  | **React** (postponed — not part of the initial phases; UI texts in PT-BR) |
| Money     | `decimal(12,2)` in DB, `string` in DTOs on the wire — never `double`/`number` for money |
| Dates     | Simple `Date` columns (TypeORM `timestamp`/`date`) |

### Why TypeORM over Prisma?

- Decorator-based entities translate almost 1:1 to JPA annotations (`@Entity`,
  `@Column`, `@ManyToOne`), making the future Spring Boot migration nearly mechanical.
- Repository pattern matches Spring Data repositories.
- Prisma has better DX/type-safety, but a total rewrite would be needed for Java.

---

## 3. Project structure

Monorepo layout:

```
sistema-compras/
├── backend/                 # NestJS API (this PLAN lives here)
│   └── src/
│       ├── config/          # TypeORM data-source, app config
│       ├── database/
│       │   ├── entities/    # TypeORM entities
│       │   ├── enums/       # TS enums (migrate to Java enums)
│       │   └── repositories/# TypeORM repositories
│       ├── dto/             # Request/response DTOs with class-validator
│       ├── exception/       # Global exception filter + business rule errors
│       ├── services/        # Business logic
│       └── controllers/     # REST controllers
└── frontend/                # React app (future — PT-BR texts)
```

---

## 4. Entities

> Names, fields and enums in English — designed to map directly to Java classes.

### 4.1 Segment

| Field  | Type            | Notes |
|--------|-----------------|-------|
| id      | number (PK)    | auto-generated |
| name    | string         | unique |
| type    | SegmentType    | `PROJECT` or `STANDARD` |

- A segment of type `PROJECT` offers a **project picker** when creating an order.
- A segment of type `STANDARD` offers a **sector picker** plus a free-text `resource`.

```typescript
enum SegmentType { PROJECT = 'PROJECT', STANDARD = 'STANDARD' }
```

### 4.2 Sector  *(under review — kept alive until confirmed unnecessary)*

| Field    | Type    | Notes |
|----------|---------|-------|
| id       | number (PK) | |
| name     | string  | |
| segment  | Segment | many-to-one (FK `segment_id`) |

### 4.3 Project

| Field           | Type          | Notes |
|-----------------|---------------|-------|
| id              | number (PK)   | |
| name            | string        | |
| status          | ProjectStatus | |
| startDate       | Date          | |
| forecastEndDate | Date          | |
| realEndDate     | Date?         | nullable |
| budget          | decimal(12,2) | planned budget of the project |
| realCost        | decimal(12,2) | **calculated** = SUM of `finalValue` of linked orders |
| segment         | Segment       | many-to-one — projects are children of a PROJECT-type segment |
| orders          | PurchaseOrder | **many-to-many** via `OrderProject` join table |

```typescript
enum ProjectStatus { ACTIVE = 'ACTIVE', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
```

### 4.4 Supplier

| Field         | Type   | Notes |
|---------------|--------|-------|
| id            | number (PK) | |
| displayName   | string | friendly name |
| corporateName | string | razão social (may change over time) |
| cnpj          | string | **exactly 14 digits**, validated with regex, unique |

```typescript
// Stored as digits only (leading zeros preserved)
@Matches(/^\d{14}$/, { message: 'CNPJ must contain exactly 14 digits' })
cnpj: string;
```

### 4.5 PurchaseOrder

| Field              | Type              | Notes |
|--------------------|-------------------|-------|
| id                 | number (PK)       | |
| orderNumber        | number            | order sequence number |
| issueDate          | Date              | data de emissão |
| segment            | Segment           | many-to-one — **explicit** even though derivable (different meanings) |
| sector             | Sector?           | many-to-one, nullable — used when segment is STANDARD |
| resource           | string?           | free text — used when segment is STANDARD |
| description        | string            | |
| supplier           | Supplier          | many-to-one |
| requester          | string            | **free text** (no User entity in v1) |
| serviceType        | ServiceType       | purchase vs. service |
| authorizationDate  | Date?             | set when approving (`POST /:id/approve`) |
| initialValue       | decimal(12,2)     | |
| finalValue         | decimal(12,2)     | |
| status             | OrderStatus       | |
| invoiceNumber      | number?           | nota fiscal |
| paymentCondition   | PaymentCondition? | reference only — **`paymentDate` does not exist** |
| deliveryDeadline   | number            | days (prazo de entrega) |
| deliveryDate       | Date?             | |
| projects           | Project           | **many-to-many** via `OrderProject` |

- **economia (savings) is NOT persisted** — calculated as `initialValue - finalValue`
  and exposed only in dashboard/report DTOs.

```typescript
enum ServiceType       { PURCHASE = 'PURCHASE', SERVICE = 'SERVICE' }
enum OrderStatus       { PENDING = 'PENDING', AUTHORIZED = 'AUTHORIZED', DELIVERED = 'DELIVERED', INVOICED = 'INVOICED', CANCELLED = 'CANCELLED' }
enum PaymentCondition  { ANTECIPATED = 'ANTECIPATED', DD15 = 'DD15', DD30 = 'DD30', DD45 = 'DD45', DD60 = 'DD60' }
```

### 4.6 OrderProject (join table)

| Field   | Type          | Notes |
|---------|---------------|-------|
| order   | PurchaseOrder | many-to-one (FK) |
| project | Project       | many-to-one (FK) |

**Cardinality: N–N.** One project is composed of many orders; one order can compose
several projects.

### 4.7 Budget

| Field        | Type          | Notes |
|--------------|---------------|-------|
| id           | number (PK)   | |
| monthYear    | Date          | always day `1` (e.g. `2026-10-01`) — month/year as a date without day |
| week         | number        | **week of the month** (1–5), separate field |
| plannedValue | decimal(12,2) | |
|              |               | **unique constraint on (`monthYear`, `week`)** |

> The budget **never blocks** order creation. It is visualization only (planned vs.
> realized indicator).

---

## 5. Business rules

1. **Order creation is free** — no budget validation, no blocking. Budget exists only to
   visualize spending.
2. **Savings (economia)** = `initialValue - finalValue`, calculated at read time, exposed
   in dashboard/report DTOs only.
3. **Approval**: `POST /purchase-orders/:id/approve` sets `status = AUTHORIZED` and
   `authorizationDate = now`. Used only to mark which orders were authorized (no auth
   system).
4. **Status transitions**: `PATCH /purchase-orders/:id/status` moves the order through
   `PENDING → AUTHORIZED → DELIVERED → INVOICED` (or `CANCELLED` from any state).
5. **Project.realCost** = SUM of `finalValue` of all orders linked through `OrderProject`
   (excluding `CANCELLED`).
6. **Dashboard** aggregates: total savings, spend by segment/project/supplier, budget
   planned vs. realized per month/week.
7. **CNPJ** stored as digits-only string, 14 characters, validated by regex, unique.

---

## 6. Endpoints (REST)

```
CRUD  /segments
CRUD  /sectors
CRUD  /projects
CRUD  /suppliers

CRUD  /purchase-orders
      POST   /purchase-orders/:id/approve      # status=AUTHORIZED + authorizationDate=now
      PATCH  /purchase-orders/:id/status       # transition status
      GET    /purchase-orders                  # simple filters in query string

CRUD  /budgets

GET   /dashboard                               # savings, spend by segment/project,
                                               # budget planned vs realized
```

- Simple filters only in v1 (supplier, status, month... no complex nesting).
- All DTOs validated with `class-validator`; errors via a global exception filter
  (`exception/`).

---

## 7. Implementation phases

| Phase | Content | Status |
|-------|---------|--------|
| **0** | This `PLAN.md` | ✅ Done |
| **1** | Nest project + TypeORM + SQLite (migrations), entities, enums, repositories, base DTOs, exception handling | ⬜ Pending |
| **2** | Support CRUDs: segments, sectors, projects, suppliers | ⬜ Pending |
| **3** | Purchase orders: free creation, approve, status transitions, N–N with projects | ⬜ Pending |
| **4** | Budgets CRUD + planned vs. realized indicator | ⬜ Pending |
| **5** | Dashboard / reports (savings, spend by segment/project) | ⬜ Pending |
| **6** | React frontend (PT-BR texts) — future | ⬜ Pending |

> **Workflow:** one phase at a time. Each phase is implemented, validated (build/tests)
> and presented for approval before moving to the next.

---

## 8. Spring Boot migration guide

| TypeORM (v1) | Spring Boot / JPA |
|--------------|-------------------|
| `@Entity()` | `@Entity` + `@Table(name = "...")` |
| `@Column({ type: 'decimal', precision: 12, scale: 2 })` | `@Column(precision = 12, scale = 2)` + `BigDecimal` |
| `@ManyToOne()` | `@ManyToOne` + `@JoinColumn` |
| `@ManyToMany()` + join entity | `@ManyToMany` or `@OneToMany` on join entity |
| `@UniqueConstraint` | `@Table(uniqueConstraints = ...)` or `@Column(unique = true)` |
| Repository (TypeORM) | `JpaRepository<Entity, Long>` |
| Service class | `@Service` |
| Controller (decorators) | `@RestController` |
| DTO + class-validator | DTO + `jakarta.validation` |
| Enum (TS) | Java `enum` |
| SQLite → PostgreSQL | Change datasource config only (no DB-specific types used) |

Conventions to keep migration trivial:

- Entities stay flat and decorator-heavy (JPA-like).
- No Active Record pattern — always Data Mapper via injected repositories.
- Money as `BigDecimal` / `decimal(12,2)`; dates as simple date columns.
- All identifiers, enums, columns and endpoints in **English**.
