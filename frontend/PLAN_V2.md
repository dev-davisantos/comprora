# PLAN V2 — Dashboard (Sistema de Compras)

> Plano independente para a evolução do dashboard frontend. O plano geral
> continua em `PLAN.md`; esta versão detalha as fases específicas do dashboard.
> UI em PT-BR; código, identificadores e commits em inglês (conventional
> commits).

---

## 1. Objetivo

Evoluir o dashboard existente para apresentar indicadores anuais e mensais,
além de gráficos de gastos e economia ao longo do ano e percentual mensal do
budget consumido.

- A implementação desta versão será somente no frontend; não alterar o
  backend.
- Manter o título e a aparência atual dos cartões da primeira linha.
- Reutilizar o seletor compartilhado de mês e ano, com o mês atual selecionado
  inicialmente.
- Preservar o indicador semanal de budget existente.
- Não criar nem injetar dados fictícios. Meses sem resultados devem ser
  representados com valores zero nos gráficos anuais.
- Permitir filtrar os gastos anuais por segmento e limpar o filtro pelo botão
  `X`.

## 2. Stack

| Camada       | Tecnologia |
|--------------|------------|
| Build        | Vite + React 19 + TypeScript |
| Estilos      | Tailwind CSS + shadcn/ui |
| Server state | TanStack Query v5 |
| HTTP         | `fetch` + client próprio existente |
| Gráficos     | Recharts |

Recharts será usado para os gráficos de linha e de barras, mantendo a identidade
visual existente e adaptando os gráficos a diferentes larguras de tela.

## 3. Convenções

- **Money**: os valores da API são strings decimais; formatar tooltips,
  indicadores e eixos em reais no padrão `pt-BR`.
- **Período**: o seletor compartilhado fornece mês e ano no formato `YYYY-MM`.
  O mês selecionado define os indicadores mensais e o ano selecionado define
  os indicadores e gráficos anuais.
- **Agregação anual**: buscar os resumos mensais do ano selecionado e agregar
  os valores no frontend, sem alterar o contrato da API.
- **Percentual do budget**: calcular gasto mensal dividido pelo budget de
  referência do mês, multiplicado por 100. Usar o budget do mês quando
  disponível; caso contrário, reutilizar o budget mais recente de um mês
  anterior. A busca retrocede até encontrar um budget, incluindo dezembro do
  ano anterior e, se necessário, meses anteriores. Sem qualquer budget
  anterior, não há percentual calculável e o mês deve ser indicado como sem
  referência.
- **Sinalização do budget**: percentuais até 100% são verdes; acima de 100%
  são vermelhos. Exibir uma referência visual de 100%.
- **Meses sem dados**: incluir os doze meses do ano no eixo horizontal e usar
  zero quando um mês não tiver valores retornados. No gráfico de budget, se
  nenhum budget de referência existir, não exibir percentual e indicar os meses
  sem base de cálculo.
- **Filtro de segmento**: aplicar à série anual de gastos; o botão `X` limpa a
  seleção e restaura os totais gerais. O gráfico de percentual do budget
  representa o gasto geral mensal, sem filtro de segmento.
- **Estados da interface**: reutilizar os padrões existentes de carregamento,
  erro, retry e ausência de resultados.
- **Dados**: não incluir mocks, seeds ou registros artificiais.

## 4. Estrutura e fontes de dados

Componentes e recursos frontend a reutilizar:

- `src/pages/Dashboard.tsx`: página e consultas atuais do dashboard.
- `src/components/MonthYearPicker.tsx`: seletor compartilhado de mês e ano.
- `src/components/BudgetWeeklyIndicator.tsx`: indicador semanal que será
  preservado.
- `src/api/endpoints/dashboard.ts`: endpoint atual `GET /dashboard?month=`.
- `src/api/endpoints/budgets.ts`: listagem dos budgets mensais e semanais para
  calcular e recuperar a referência de cada mês.
- `src/utils/format.ts`: formatação monetária existente.

O backend atual fornece o resumo do dashboard por mês e uma listagem de budgets.
Os totais anuais e as séries mensais serão obtidos consultando os meses do ano
selecionado e combinando os pedidos no frontend. Para calcular o percentual
mensal, somar o budget semanal cadastrado para cada mês; quando não houver
budget próprio, usar o budget mais recente de um mês anterior disponível na
listagem, incluindo dezembro do ano anterior. Nenhum dado será inventado.

## 5. Dashboard e endpoints

| Área | Informação | Fonte |
|------|------------|-------|
| Cabeçalho | Seletor de mês e ano, inicialmente no mês atual | `MonthYearPicker` |
| Cartão 1 | Gasto total no ano selecionado | Resumos mensais de `GET /dashboard?month=` |
| Cartão 2 | Economia total no ano selecionado | Resumos mensais de `GET /dashboard?month=` |
| Cartão 3 | Gasto total no mês selecionado | Resumo de `GET /dashboard?month=` |
| Cartão 4 | Economia total no mês selecionado | Resumo de `GET /dashboard?month=` |
| Linha 2 | Linha de gasto por mês, com filtro por segmento | Resumos mensais e `GET /segments` |
| Linha 3 — esquerda | Linha de economia por mês | Resumos mensais |
| Linha 3 — direita (Fase 4) | Colunas mensais com percentual do budget consumido | Pedidos mensais e listagem de budgets |
| Indicador existente | Budget planejado, realizado e saldo por semana | `GET /dashboard?month=` |

## 6. Fases de implementação

- [x] **0. Plano V2**: criar este documento com as decisões aprovadas e as
      fases de implementação do dashboard.
- [x] **1. Período e cartões**: substituir o seletor do dashboard pelo
      `MonthYearPicker`; apresentar gasto e economia anuais nos dois primeiros
      cartões e gasto e economia do mês selecionado nos dois cartões restantes.
- [x] **2. Gráfico anual de gastos**: adicionar gráfico de linha com os meses do
      ano no eixo horizontal e valor gasto no eixo vertical; incluir filtro por
      segmento e botão `X` para restaurar o gasto geral.
- [x] **3. Gráfico anual de economia**: adicionar gráfico de linha com a
      economia mensal do ano selecionado.
- [x] **4. Percentual mensal do budget consumido**: substituir o gráfico de
      gastos por segmento por colunas verticais, com os meses no eixo horizontal
      e o percentual gasto sobre o budget de referência no eixo vertical.
      Calcular gasto mensal / budget de referência * 100; colorir de verde até
      100% e de vermelho acima de 100%, com linha de referência em 100%.
      Quando não houver budget no próprio mês, usar o budget mais recente de um
      mês anterior, retrocedendo até encontrar um valor e incluindo dezembro
      do ano anterior para janeiro. Se não houver budget anterior disponível,
      indicar que não há referência para calcular o percentual. Manter o gráfico
      ao lado do gráfico de economia em telas grandes e abaixo dele em telas
      menores.
- [x] **5. Integração e acabamento**: preservar o indicador semanal de budget;
      validar layout responsivo, tooltips com gasto, budget e referência usada,
      eixos, filtros, carregamento, erros isolados por área, meses sem budget de
      referência e consistência dos totais. Adaptar a navegação e o layout
      compartilhado para telas estreitas, sem overflow horizontal.

Cada fase será implementada e validada individualmente. As fases dos gráficos
são separadas para facilitar revisão e confirmação progressiva.

## 7. Regra de workflow

1. Implementar **uma fase por vez**, respeitando a ordem do checklist.
2. Validar a fase concluída com o build frontend e verificações compatíveis com
   a alteração.
3. Ao final de cada fase, apresentar o resultado e pedir confirmação antes de
   iniciar a fase seguinte.
4. Após confirmação, marcar a fase concluída no checklist deste documento.
5. Não iniciar fases seguintes sem confirmação explícita do usuário.
