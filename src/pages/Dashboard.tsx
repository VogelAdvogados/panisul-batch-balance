import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { 
  Package2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  AlertTriangle,
  ShoppingCart,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DashboardStats {
  totalIngredients: number
  lowStockIngredients: number
  totalCustomers: number
  totalSales: number
  totalRevenue: number
  pendingPayables: number
  pendingReceivables: number
  totalProductions: number
}

interface RecentActivity {
  type: string
  description: string
  date: string
  amount?: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalIngredients: 0,
    lowStockIngredients: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalRevenue: 0,
    pendingPayables: 0,
    pendingReceivables: 0,
    totalProductions: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Buscar estatísticas
      const [
        ingredientsResult,
        customersResult,
        salesResult,
        payablesResult,
        receivablesResult,
        productionsResult
      ] = await Promise.all([
        supabase.from('ingredients').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('accounts_payable').select('*').eq('status', 'pending'),
        supabase.from('accounts_receivable').select('*').eq('status', 'pending'),
        supabase.from('productions').select('*')
      ])

      // Calcular estatísticas
      const ingredients = ingredientsResult.data || []
      const lowStock = ingredients.filter(ing => ing.current_stock <= ing.min_stock)
      const sales = salesResult.data || []
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
      const payables = payablesResult.data || []
      const receivables = receivablesResult.data || []

      setStats({
        totalIngredients: ingredients.length,
        lowStockIngredients: lowStock.length,
        totalCustomers: customersResult.data?.length || 0,
        totalSales: sales.length,
        totalRevenue,
        pendingPayables: payables.reduce((sum, p) => sum + Number(p.amount), 0),
        pendingReceivables: receivables.reduce((sum, r) => sum + Number(r.amount), 0),
        totalProductions: productionsResult.data?.length || 0
      })

      // Buscar atividades recentes
      const activities: RecentActivity[] = []
      
      // Vendas recentes
      const recentSales = sales.slice(-5).map(sale => ({
        type: 'sale',
        description: `Venda realizada`,
        date: sale.created_at,
        amount: Number(sale.total_amount)
      }))

      // Produções recentes
      const recentProductions = (productionsResult.data || []).slice(-3).map(prod => ({
        type: 'production',
        description: `Produção realizada`,
        date: prod.created_at
      }))

      setRecentActivities([...recentSales, ...recentProductions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 8))

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Carregando dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={fetchDashboardData} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ingredientes</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIngredients}</div>
            {stats.lowStockIngredients > 0 && (
              <div className="flex items-center space-x-1 text-sm text-red-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{stats.lowStockIngredients} com estoque baixo</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProductions} produções realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Financeiro</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(stats.pendingReceivables - stats.pendingPayables).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="text-green-600">
                + R$ {stats.pendingReceivables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
              </div>
              <div className="text-red-600">
                - R$ {stats.pendingPayables.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a pagar
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Alertas de Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>
              Ingredientes com estoque baixo ou zerado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStockIngredients === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os estoques estão adequados</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-600">
                  {stats.lowStockIngredients} ingrediente(s) com estoque baixo
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Ver detalhes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center space-x-2">
                      {activity.type === 'sale' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      )}
                      <span className="text-sm">{activity.description}</span>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <p className="text-sm font-medium">
                          R$ {activity.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}