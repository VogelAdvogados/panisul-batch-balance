import {
  BarChart3,
  Package2,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ChefHat,
  Utensils,
  Home,
  Menu
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Compras", url: "/compras", icon: ShoppingCart },
  { title: "Ingredientes", url: "/ingredientes", icon: Package2 },
  { title: "Receitas", url: "/receitas", icon: ChefHat },
  { title: "Produção", url: "/producao", icon: Utensils },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Vendas", url: "/vendas", icon: TrendingUp },
  { title: "Trocas", url: "/trocas", icon: RefreshCw },
]

const financialItems = [
  { title: "Contas a Pagar", url: "/contas-pagar", icon: DollarSign },
  { title: "Contas a Receber", url: "/contas-receber", icon: BarChart3 },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Package2 className="h-6 w-6 text-primary" />
            {!isCollapsed && (
              <span className="font-bold text-lg text-primary">Panisul</span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Operações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Financial */}
        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}