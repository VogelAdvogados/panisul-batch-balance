import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users, ShoppingCart, Factory } from "lucide-react";
import IngredientsTab from "@/components/IngredientsTab";
import RecipesTab from "@/components/RecipesTab";
import ProductionTab from "@/components/ProductionTab";
import CustomersTab from "@/components/CustomersTab";
import SalesTab from "@/components/SalesTab";

const Index = () => {
  const [activeTab, setActiveTab] = useState("ingredients");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">
            🥖 Panisul - Sistema de Gestão
          </h1>
          <p className="text-center text-muted-foreground">
            Controle completo para sua mini fábrica de pães
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ingredientes
            </TabsTrigger>
            <TabsTrigger value="recipes" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Receitas
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Produção
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Vendas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-6">
            <IngredientsTab />
          </TabsContent>

          <TabsContent value="recipes" className="mt-6">
            <RecipesTab />
          </TabsContent>

          <TabsContent value="production" className="mt-6">
            <ProductionTab />
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <SalesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
