import SalesTab from "@/components/SalesTab"
import { useSEO } from "@/hooks/useSEO"

export default function SalesPage() {
  useSEO({
    title: "Vendas | Gestão",
    description: "Gerencie suas vendas e histórico de clientes.",
  })
  return <SalesTab />
}