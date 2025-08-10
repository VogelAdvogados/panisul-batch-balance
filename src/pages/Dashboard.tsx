import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  Wallet,
  Receipt,
  AlertTriangle,
  Trophy,
  Crown
} from "lucide-react"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useSalesByPeriod, SalesPeriod } from "@/hooks/useSalesByPeriod"
import { useTopProducts } from "@/hooks/useTopProducts"
import { useTopCustomers } from "@/hooks/useTopCustomers"
import { Skeleton } from "@/components/ui/skeleton"
import { TopItemsList } from "@/components/dashboard/TopItemsList"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Link } from "react-router-dom"

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  isLoading: boolean;
  linkTo?: string;
}

const StatCard = ({ title, value, icon: Icon, description, isLoading, linkTo }: StatCardProps) => {
  const cardContent = (
    <Card className={linkTo ? "hover:border-primary/80 hover:shadow-md transition-all" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (linkTo) {
    return <Link to={linkTo}>{cardContent}</Link>;
  }

  return cardContent;
}

import { useState } from "react"

const SalesChart = ({ period }: { period: SalesPeriod }) => {
  const { data: chartData, isLoading } = useSalesByPeriod(period);

  if (isLoading) {
    return <div className="h-[300px] w-full flex items-center justify-center"><Skeleton className="h-full w-full" /></div>;
  }

  const formattedData = chartData?.map(item => ({
    ...item,
    day: format(new Date(item.day), "dd/MM", { locale: ptBR }),
    total_sales: Number(item.total_sales)
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Dia</span>
                      <span className="font-bold text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">Vendas</span>
                      <span className="font-bold">
                        {payload[0].value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="total_sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, isError, error } = useDashboardStats();
  const [salesChartPeriod, setSalesChartPeriod] = useState<SalesPeriod>('7d');
  const { data: topProducts, isLoading: isLoadingTopProducts } = useTopProducts(5);
  const { data: topCustomers, isLoading: isLoadingTopCustomers } = useTopCustomers(5);

  if (isError) {
    return <div className="p-6 text-red-500">Erro ao carregar dashboard: {error.message}</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas (Últimos 30 dias)"
          value={stats?.salesLast30Days.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || ''}
          icon={TrendingUp}
          isLoading={isLoading}
          linkTo="/vendas"
        />
        <StatCard
          title="Contas a Receber (Pendente)"
          value={stats?.pendingReceivables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || ''}
          icon={Wallet}
          isLoading={isLoading}
          linkTo="/contas-receber"
        />
        <StatCard
          title="Contas a Pagar (Pendente)"
          value={stats?.pendingPayables.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || ''}
          icon={Receipt}
          isLoading={isLoading}
          linkTo="/contas-pagar"
        />
        <StatCard
          title="Ingredientes com Estoque Baixo"
          value={stats?.lowStockCount.toString() || '0'}
          icon={AlertTriangle}
          description={`${stats?.lowStockCount || 0} iten(s) precisam de reposição`}
          isLoading={isLoading}
          linkTo="/ingredientes"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Vendas por Período</CardTitle>
              <CardDescription>
                Visão geral do total de vendas diárias.
              </CardDescription>
            </div>
            <ToggleGroup type="single" value={salesChartPeriod} onValueChange={(value: SalesPeriod) => value && setSalesChartPeriod(value)} size="sm">
              <ToggleGroupItem value="7d">7d</ToggleGroupItem>
              <ToggleGroupItem value="30d">30d</ToggleGroupItem>
              <ToggleGroupItem value="this_month">Mês</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <SalesChart period={salesChartPeriod} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" />Top 5 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopItemsList
              isLoading={isLoadingTopProducts}
              items={topProducts?.map(p => ({
                id: p.product_id,
                name: p.product_name,
                value: p.total_quantity_sold,
                linkTo: `/receitas?search=${encodeURIComponent(p.product_name)}`
              })) || []}
              valueFormatter={(val) => `${val} un.`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-blue-500" />Top 5 Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <TopItemsList
              isLoading={isLoadingTopCustomers}
              items={topCustomers?.map(c => ({
                id: c.customer_id,
                name: c.customer_name,
                value: c.total_spent,
                linkTo: `/clientes/${c.customer_id}`
              })) || []}
              valueFormatter={(val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}