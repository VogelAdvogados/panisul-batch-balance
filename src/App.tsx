import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import IngredientsPage from "./pages/IngredientsPage";
import RecipesPage from "./pages/RecipesPage";
import ProductionPage from "./pages/ProductionPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import ExchangesPage from "./pages/ExchangesPage";
import AccountsPayablePage from "./pages/AccountsPayablePage";
import AccountsReceivablePage from "./pages/AccountsReceivablePage";
import FinancialAccountsPage from "./pages/FinancialAccountsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1">
              <header className="h-14 border-b flex items-center px-4 lg:px-6">
                <SidebarTrigger />
                <div className="ml-auto">
                  <h2 className="text-lg font-semibold">Sistema Panisul</h2>
                </div>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/ingredientes" element={<IngredientsPage />} />
                  <Route path="/receitas" element={<RecipesPage />} />
                  <Route path="/producao" element={<ProductionPage />} />
                  <Route path="/clientes" element={<CustomersPage />} />
                  <Route path="/clientes/:id" element={<CustomerDetailPage />} />
                  <Route path="/vendas" element={<SalesPage />} />
                  <Route path="/compras" element={<PurchasesPage />} />
                  <Route path="/trocas" element={<ExchangesPage />} />
                  <Route path="/contas-pagar" element={<AccountsPayablePage />} />
                  <Route path="/contas-receber" element={<AccountsReceivablePage />} />
                  <Route path="/financeiro/contas" element={<FinancialAccountsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
