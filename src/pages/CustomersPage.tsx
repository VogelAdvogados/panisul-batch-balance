import CustomersTab from "@/components/CustomersTab"
import { useSEO } from "@/hooks/useSEO"

export default function CustomersPage() {
  useSEO({ title: "Clientes | Gestão", description: "Gerencie seus clientes e cadastros." });
  return (
    <div className="container mx-auto py-6">
      <CustomersTab />
    </div>
  )
}