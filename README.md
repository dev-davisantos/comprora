# Sistema de Compras

Aplicação local para cadastro e acompanhamento de pedidos de compra,
fornecedores, segmentos, setores, projetos e budgets mensais.

## Conteúdo

- [Visão geral](#visão-geral)
- [Requisitos](#requisitos)
- [Executar em desenvolvimento](#executar-em-desenvolvimento)
- [Build e instalação Windows](#build-e-instalação-windows)
- [Dados e configuração](#dados-e-configuração)
- [Regras funcionais](#regras-funcionais)
- [API](#api)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Verificação e limitações conhecidas](#verificação-e-limitações-conhecidas)

## Visão geral

O projeto é composto por:

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query e
  Recharts.
- **Backend:** NestJS 11, TypeScript e TypeORM.
- **Persistência:** SQLite, com migrations TypeORM executadas na inicialização.
- **Comunicação:** API REST JSON sob o prefixo `/api`.

O sistema não cria cadastros demonstrativos. Ao iniciar com um banco vazio,
cadastre os segmentos, setores, fornecedores, projetos e budgets necessários
pela interface.

## Requisitos

- Windows para os arquivos `.bat` e para o instalador documentado aqui.
- Node.js 24 ou posterior e npm para desenvolvimento e criação do pacote.
- Dependências instaladas com `npm ci` nas pastas `backend` e `frontend`.

O pacote de instalação Windows inclui um runtime portátil do Node.js; a máquina
de destino não precisa ter Node.js ou npm instalados.

## Executar em desenvolvimento

Na raiz do repositório, instale as dependências uma vez:

```bat
cd backend
npm ci
cd ..\frontend
npm ci
cd ..
```

Depois, execute:

```bat
start-dev.bat
```

O script abre janelas separadas para os serviços e inicia o navegador quando a
API estiver saudável:

| Serviço | Endereço |
|---|---|
| Frontend Vite | `http://127.0.0.1:5173` |
| API NestJS | `http://127.0.0.1:3000/api` |
| Verificação de saúde | `http://127.0.0.1:3000/api/health` |

O Vite encaminha as requisições `/api` para a API local. A API usa a porta 3000
por padrão (`PORT`) e o frontend de desenvolvimento é configurado para esse
endereço no `vite.config.ts`.

Para iniciar os serviços manualmente:

```bat
cd backend
npm run start:dev
```

Em outro terminal:

```bat
cd frontend
npm run dev -- --host 127.0.0.1
```

## Build e instalação Windows

Para compilar os dois projetos:

```bat
cd backend
npm run build
cd ..\frontend
npm run build
```

Para criar o pacote de instalação, em uma máquina de build Windows com Node.js
24 ou posterior, execute na raiz:

```powershell
.\deploy\build-release.ps1
```

O script compila frontend e backend, prepara dependências de produção, baixa o
runtime portátil oficial do Node.js e gera:

```text
release\Sistema-de-Compras-Setup-win-x64.zip
```

Distribua o ZIP. Na máquina do usuário:

1. Extraia o arquivo ZIP.
2. Execute `install.bat`.
3. Use o atalho criado no Menu Iniciar ou na Área de Trabalho.

O instalador copia a aplicação para
`%LOCALAPPDATA%\Programs\Sistema de Compras`, inicia o serviço local e abre o
navegador em `http://127.0.0.1:4317`. O script de execução verifica
`/api/health` e informa se não conseguir iniciar, por exemplo quando a porta
4317 já estiver em uso.

Consulte também [DEPLOYMENT.md](./DEPLOYMENT.md) para os detalhes de
empacotamento e distribuição.

## Dados e configuração

### SQLite

- Em desenvolvimento, o caminho padrão é `backend/data/app.sqlite`, pois o
  launcher inicia o backend com a pasta `backend` como diretório atual.
- `DATABASE_FILE` permite indicar outro caminho absoluto para o arquivo SQLite.
- No pacote instalado, o banco fica em
  `%LOCALAPPDATA%\SistemaCompras\data\app.sqlite`, fora da pasta dos binários.
- As migrations são executadas automaticamente no início do backend.
  `synchronize` do TypeORM permanece desativado.

Para preservar os dados ao reinstalar ou atualizar, mantenha uma cópia do
arquivo `app.sqlite`. Antes de copiar o banco, encerre a aplicação para evitar
copiar o arquivo enquanto SQLite está gravando.

### Variáveis de ambiente

| Variável | Padrão/uso |
|---|---|
| `PORT` | Porta da API; padrão `3000` em desenvolvimento e `4317` no pacote |
| `DATABASE_FILE` | Caminho do banco SQLite |
| `SERVE_FRONTEND` | Quando `true`, o backend também publica o frontend compilado |
| `APP_DATA` | Diretório de dados escolhido pelo `deploy/run.bat` para instalação |

O `.env` não é carregado automaticamente pelo backend; defina as variáveis no
ambiente ou no script que inicia o processo.

## Regras funcionais

- **Pedidos:** o número do pedido Protheus é obrigatório. A aprovação exige uma
  data real de calendário; a interface aceita `DD/MM` e usa o ano da emissão
  do pedido.
- **Status:** o fluxo principal é pendente → autorizado → entregue → faturado.
  Um pedido pode ser cancelado a partir dos status que permitem essa transição,
  inclusive faturado; um pedido cancelado não pode avançar. A autorização exige
  data de aprovação.
- **Budgets:** são informados por mês e distribuídos inicialmente pelas semanas
  do mês; os valores semanais podem ser ajustados depois. O budget é um
  indicador de acompanhamento e não impede a criação de pedidos.
- **Gasto realizado:** os indicadores consideram o valor final dos pedidos
  emitidos no período e excluem pedidos cancelados.
- **Dashboard:** compara gasto e economia por mês e ano. Para o gráfico de
  consumo do budget, um mês sem budget próprio reutiliza o budget do mês
  anterior mais recente disponível; para janeiro, a busca também pode usar
  dezembro do ano anterior. Sem referência disponível, o percentual não pode
  ser calculado.
- **Cadastros:** segmentos e setores são configurados pelo usuário. Não há
  inserção de dados falsos ao iniciar o sistema.

## API

Todos os endpoints estão sob `/api`, recebem e retornam JSON, salvo operações
`DELETE` que respondem sem conteúdo.

| Recurso | Rotas principais |
|---|---|
| Saúde | `GET /api/health` |
| Segmentos | `GET`, `POST /api/segments`; `GET`, `PATCH`, `DELETE /api/segments/:id` |
| Setores | `GET`, `POST /api/sectors`; `GET`, `PATCH`, `DELETE /api/sectors/:id`; filtro opcional `segmentId` |
| Projetos | `GET`, `POST /api/projects`; `GET`, `PATCH`, `DELETE /api/projects/:id`; filtro opcional `segmentId` |
| Fornecedores | `GET`, `POST /api/suppliers`; `GET`, `PATCH`, `DELETE /api/suppliers/:id`; busca opcional `search` |
| Pedidos | `GET`, `POST /api/purchase-orders`; `GET`, `PATCH`, `DELETE /api/purchase-orders/:id` |
| Pedidos — filtros | `status`, `supplierId`, `segmentId`, `projectId`, `month=YYYY-MM` |
| Pedidos — operações | `POST /api/purchase-orders/:id/approve`; `PATCH /api/purchase-orders/:id/status`; `PUT /api/purchase-orders/:id/projects` |
| Budgets | `GET`, `POST /api/budgets`; `GET`, `PATCH`, `DELETE /api/budgets/:id`; filtro `month=YYYY-MM` |
| Budgets — mensal/semanal | `POST /api/budgets/monthly`; `GET /api/budgets/indicator?month=YYYY-MM` |
| Dashboard | `GET /api/dashboard?month=YYYY-MM` |

DTOs do backend validam os dados de entrada. Campos não previstos nos DTOs são
rejeitados. Valores monetários trafegam como strings decimais com até duas
casas, evitando perda de precisão por ponto flutuante.

## Estrutura do projeto

```text
backend/
  src/
    controllers/       Endpoints HTTP
    database/          Entidades, repositories e migrations SQLite
    dto/               Contratos e validação de entrada
    services/          Regras de negócio
    *.module.ts        Módulos NestJS por domínio
frontend/
  src/
    api/               Cliente HTTP e contratos consumidos pela UI
    components/        Layout e componentes reutilizáveis
    pages/             Telas de dashboard e cadastros
    utils/             Formatação e validações de interface
deploy/                Scripts de instalação e empacotamento Windows
release/               Artefatos locais de release (não versionados)
```

Os planos de evolução do frontend estão em [frontend/PLAN.md](./frontend/PLAN.md)
e [frontend/PLAN_V2.md](./frontend/PLAN_V2.md).

## Verificação e limitações conhecidas

- `npm run build` em `backend` compila a API.
- `npm run build` em `frontend` executa `tsc -b` e o build de produção Vite.
- Os manifests atuais não definem scripts de testes automatizados.
- Não há autenticação de usuários. A API escuta em `127.0.0.1`, e o modo
  empacotado deve ser tratado como aplicação local de usuário único; não o
  exponha diretamente em uma rede.
- O Vite pode emitir aviso de chunk JavaScript grande no build de produção. O
  build ainda termina com sucesso.
