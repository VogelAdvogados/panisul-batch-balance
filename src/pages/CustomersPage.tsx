import CustomersTab from "@/components/CustomersTab"
import { useSEO } from "@/hooks/useSEO"

export default function CustomersPage() {
  useSEO({
    title: "Clientes | Gestão",
    description: "Gerencie seus clientes e cadastros.",
  })
  return <CustomersTab />
}