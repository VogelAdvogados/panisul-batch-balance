import {
  BarChart3,
  ChefHat,
  DollarSign,
  FileText,
  Home,
  Landmark,
  Package2,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  { title: "Contas Financeiras", url: "/financeiro/contas", icon: Landmark },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
]

export function AppSidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    // Exact match for homepage, otherwise check for prefix
    return path === "/" ? currentPath === "/" : currentPath.startsWith(path)
  }

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-primary group-data-[collapsible=icon]:hidden">
            Panisul
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive(item.url)}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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