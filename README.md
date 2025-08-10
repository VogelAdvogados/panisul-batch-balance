# Sistema de Gestão Panisul

Este projeto é um sistema de gestão completo, desenvolvido para uma padaria ou negócio do ramo alimentício, com o objetivo de centralizar e otimizar as operações diárias.

## Visão Geral

O sistema oferece uma interface moderna e responsiva para gerenciar as principais áreas do negócio, desde o controle de estoque de ingredientes até a gestão financeira e de clientes. A arquitetura foi refatorada para garantir performance e escalabilidade, utilizando uma stack moderna com React e Supabase.

## Funcionalidades Principais

-   **Dashboard Interativo:** Visualização rápida dos principais indicadores do negócio, como vendas, contas a pagar/receber e produtos com baixo estoque. Inclui gráficos de vendas e rankings de "Top 5" produtos e clientes.
-   **Gestão de Compras e Ingredientes:**
    -   Registro de compras de insumos.
    -   Importação de NFe (XML e PDF) para popular dados de compra automaticamente.
    -   Cálculo automático de custo médio dos ingredientes.
    -   Alerta de estoque baixo.
-   **Receitas e Produção:**
    -   Criação e gerenciamento de receitas.
    -   Cálculo de custo total e por unidade para cada receita.
    -   Registro de lotes de produção com baixa automática de ingredientes do estoque.
    -   Avisos de disponibilidade de estoque durante o planejamento da produção.
-   **Gestão de Clientes:**
    -   Cadastro e busca de clientes.
    -   Página de detalhes do cliente com histórico completo de compras e financeiro (contas a receber).
-   **Controle Financeiro Completo:**
    -   Gestão de contas a pagar e a receber.
    -   Criação de múltiplas contas financeiras (Caixa, Banco).
    -   Fluxo de pagamento de contas com baixa do saldo da conta selecionada.
    -   Relatórios financeiros.

## Stack de Tecnologia

-   **Frontend:** React, Vite, TypeScript
-   **UI:** shadcn/ui, Tailwind CSS
-   **Backend & Base de Dados:** Supabase (PostgreSQL)
-   **Gerenciamento de Estado (Frontend):** TanStack Query (React Query)

## Instalação e Execução

Para executar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

-   Node.js e npm (ou um gerenciador de pacotes compatível).
-   Uma instância do Supabase com o schema de banco de dados correspondente (ver `supabase/migrations`).

### Configuração de Ambiente

1.  **Crie um arquivo de ambiente:**
    Copie o arquivo de exemplo `.env.example` para um novo arquivo chamado `.env` na raiz do projeto.
    ```sh
    cp .env.example .env
    ```

2.  **Adicione suas credenciais do Supabase:**
    Abra o arquivo `.env` e preencha com a URL e a Chave Anônima (Anon Key) do seu projeto Supabase. Você pode encontrar esses valores no painel do seu projeto em `Configurações > API`.

### Passos

1.  **Clone o repositório:**
    ```sh
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DO_PROJETO>
    ```

2.  **Instale as dependências:**
    ```sh
    npm install
    ```

3.  **Execute o servidor de desenvolvimento:**
    ```sh
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:8080` (ou outra porta indicada no terminal).

4.  **Para build de produção:**
    ```sh
    npm run build
    ```
    Os arquivos otimizados serão gerados no diretório `dist/`.
