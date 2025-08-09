import IngredientsTab from "@/components/IngredientsTab"
import { useSEO } from "@/hooks/useSEO"

export default function IngredientsPage() {
  useSEO({ title: "Insumos | Custo Médio", description: "Controle de insumos, estoque e custo médio atualizado por compras." });
  return (
    <div className="container mx-auto py-6">
      <IngredientsTab />
    </div>
  )
}