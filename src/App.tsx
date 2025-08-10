import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Skeleton } from "./components/ui/skeleton";
import ErrorBoundary from "@/components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const IngredientsPage = lazy(() => import("./pages/IngredientsPage"));
const RecipesPage = lazy(() => import("./pages/RecipesPage"));
const ProductionPage = lazy(() => import("./pages/ProductionPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const SalesPage = lazy(() => import("./pages/SalesPage"));
const PurchasesPage = lazy(() => import("./pages/PurchasesPage"));
const ExchangesPage = lazy(() => import("./pages/ExchangesPage"));
const AccountsPayablePage = lazy(() => import("./pages/AccountsPayablePage"));
const AccountsReceivablePage = lazy(
  () => import("./pages/AccountsReceivablePage"),
);
const FinancialAccountsPage = lazy(
  () => import("./pages/FinancialAccountsPage"),
);
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <div className="flex-1">
                <header
                  id="app-header"
                  className="h-14 border-b flex items-center px-4 lg:px-6 print:hidden"
                >
                  <SidebarTrigger />
                  <div className="ml-auto">
                    <h2 className="text-lg font-semibold">Sistema Panisul</h2>
                  </div>
                </header>
                <main className="flex-1">
                  <Suspense
                    fallback={
                      <div className="p-6">
                        <Skeleton className="h-24 w-full" />
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/ingredientes" element={<IngredientsPage />} />
                      <Route path="/receitas" element={<RecipesPage />} />
                      <Route path="/producao" element={<ProductionPage />} />
                      <Route path="/clientes" element={<CustomersPage />} />
                      <Route
                        path="/clientes/:id"
                        element={<CustomerDetailPage />}
                      />
                      <Route path="/vendas" element={<SalesPage />} />
                      <Route path="/compras" element={<PurchasesPage />} />
                      <Route path="/trocas" element={<ExchangesPage />} />
                      <Route
                        path="/contas-pagar"
                        element={<AccountsPayablePage />}
                      />
                      <Route
                        path="/contas-receber"
                        element={<AccountsReceivablePage />}
                      />
                      <Route
                        path="/financeiro/contas"
                        element={<FinancialAccountsPage />}
                      />
                      <Route path="/relatorios" element={<ReportsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
