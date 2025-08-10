import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Factory, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useProductions } from "@/hooks/useProductions"
import { useRecipes } from "@/hooks/useRecipes"
import { useCreateProduction } from "@/hooks/useCreateProduction"
import {
  TablesInsert,
  RecipeWithIngredients,
} from "@/integrations/supabase/types"
import { format, parseISO } from "date-fns"
import { useIngredients } from "@/hooks/useIngredients"
import { AlertCircle } from "lucide-react"
import { Ingredient } from "@/types"
import { PageHeader } from "@/components/ui/PageHeader"

const ProductionInfo = ({
  recipe,
  quantity,
  allIngredients,
}: {
  recipe: RecipeWithIngredients
  quantity: number
  allIngredients: Ingredient[]
}) => {
  const totalCost =
    recipe.recipe_ingredients.reduce((sum, ri) => {
      const cost = ri.ingredients?.cost_per_unit || 0
      return sum + ri.quantity * cost
    }, 0) * quantity

  const stockWarnings = recipe.recipe_ingredients
    .map((ri) => {
      const required = ri.quantity * quantity
      const ingredientDetails = allIngredients.find(
        (ing) => ing.id === ri.ingredients?.id,
      )
      const available = ingredientDetails?.current_stock || 0
      return {
        name: ingredientDetails?.name || "Desconhecido",
        hasEnough: available >= required,
        required,
        available,
        unit: ingredientDetails?.unit || "",
      }
    })
    .filter((item) => !item.hasEnough)

  return (
    <>
      <div className="font-medium">
        Custo Total Estimado:{" "}
        <span className="text-primary">
          R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>
      {stockWarnings.length > 0 && (
        <div className="mt-2 space-y-1">
          <h4 className="font-medium flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Aviso de Estoque Insuficiente:
          </h4>
          <ul className="list-disc pl-5 text-amber-600">
            {stockWarnings.map((warning) => (
              <li key={warning.name}>
                {warning.name}: Necessário{" "}
                {warning.required.toLocaleString("pt-BR")} {warning.unit},
                disponível {warning.available.toLocaleString("pt-BR")}{" "}
                {warning.unit}.
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

const ProductionTab = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<
    Omit<TablesInsert<"productions">, "id" | "created_at">
  >({
    recipe_id: "",
    quantity_produced: 1,
    production_date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null)

  const { toast } = useToast()
  const { data: productions, isLoading, isError, error } = useProductions()
  const { data: recipes, isLoading: isLoadingRecipes } = useRecipes()
  const { data: allIngredients } = useIngredients()
  const createProductionMutation = useCreateProduction()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.recipe_id) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione uma receita.",
        variant: "destructive",
      })
      return
    }

    createProductionMutation.mutate(formData, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Produção registrada! Estoque atualizado automaticamente.",
        })
        setFormData({
          recipe_id: "",
          quantity_produced: 1,
          production_date: new Date().toISOString().split("T")[0],
          notes: "",
        })
        setShowForm(false)
      },
      onError: (err) => {
        toast({
          title: "Erro",
          description: `Erro ao registrar produção: ${err.message}`,
          variant: "destructive",
        })
      },
    })
  }

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
        </TableRow>
      ))
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="text-center text-red-500">
            Erro ao carregar produções: {error.message}
          </TableCell>
        </TableRow>
      )
    }

    return productions?.map((production) => (
      <TableRow key={production.id}>
        <TableCell>
          {format(parseISO(production.production_date), "dd/MM/yyyy")}
        </TableCell>
        <TableCell className="font-medium">
          {production.recipes?.name || "Receita não encontrada"}
        </TableCell>
        <TableCell>
          {production.quantity_produced} {production.recipes?.yield_unit || ""}
        </TableCell>
        <TableCell>{production.notes}</TableCell>
        <TableCell>
          {format(parseISO(production.created_at), "dd/MM/yyyy HH:mm")}
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div>
      <PageHeader
        title="Controle de Produção"
        icon={Factory}
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Fechar" : "Nova Produção"}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nova Produção</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipe_id">Receita</Label>
                    <Select
                      value={formData.recipe_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, recipe_id: value })
                        setSelectedRecipe(
                          recipes?.find((r) => r.id === value) || null,
                        )
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingRecipes
                              ? "Carregando..."
                              : "Selecione uma receita"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes?.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity_produced">
                      Quantidade Produzida
                    </Label>
                    <Input
                      id="quantity_produced"
                      type="number"
                      step="1"
                      min="1"
                      value={formData.quantity_produced}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity_produced: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="production_date">Data de Produção</Label>
                    <Input
                      id="production_date"
                      type="date"
                      value={formData.production_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          production_date: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Observações sobre a produção..."
                  />
                </div>

                {selectedRecipe && (
                  <Card className="mt-4 p-4 bg-muted/50">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-base">
                        Detalhes da Produção
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-sm space-y-2">
                      <ProductionInfo
                        recipe={selectedRecipe}
                        quantity={formData.quantity_produced}
                        allIngredients={allIngredients || []}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={createProductionMutation.isPending}
                  >
                    {createProductionMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Registrar Produção
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Produções</CardTitle>
            <CardDescription>
              Lista de todas as produções registradas no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">
                      Data Produção
                    </TableHead>
                    <TableHead className="min-w-[150px]">Receita</TableHead>
                    <TableHead className="min-w-[120px]">Quantidade</TableHead>
                    <TableHead className="min-w-[200px]">Observações</TableHead>
                    <TableHead className="min-w-[120px]">
                      Registrado em
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderTableContent()}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProductionTab