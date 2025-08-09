import IngredientsTab from "@/components/IngredientsTab"
import { useSEO } from "@/hooks/useSEO"

export default function IngredientsPage() {
  useSEO({
    title: "Ingredientes | Gestão",
    description: "Gerencie seus ingredientes e estoque.",
  })
  return <IngredientsTab />
}