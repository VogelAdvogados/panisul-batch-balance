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
import { Plus, ChefHat, Trash, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRecipes } from "@/hooks/useRecipes"
import { useIngredients } from "@/hooks/useIngredients"
import { useCreateRecipe } from "@/hooks/useCreateRecipe"
import {
  RecipeWithIngredients,
  TablesInsert,
} from "@/integrations/supabase/types"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/PageHeader"

interface RecipeIngredientForm {
  ingredient_id: string
  quantity: number
}

const RecipesTab = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<
    Omit<TablesInsert<"recipes">, "id" | "created_at" | "updated_at">
  >({
    name: "",
    description: "",
    yield_quantity: 1,
    yield_unit: "unidade",
  })
  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredientForm[]
  >([])
  const { toast } = useToast()

  const { data: recipes, isLoading, isError, error } = useRecipes()
  const { data: ingredients, isLoading: isLoadingIngredients } =
    useIngredients()
  const createRecipeMutation = useCreateRecipe()

  const getRecipeCost = (recipe: RecipeWithIngredients) => {
    return recipe.recipe_ingredients.reduce((sum, ri) => {
      const qty = Number(ri.quantity) || 0
      const cost = Number(ri.ingredients?.cost_per_unit) || 0
      return sum + qty * cost
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (
      recipeIngredients.length === 0 ||
      recipeIngredients.some((ri) => !ri.ingredient_id)
    ) {
      toast({
        title: "Erro de Validação",
        description: "Adicione pelo menos um ingrediente válido à receita.",
        variant: "destructive",
      })
      return
    }

    createRecipeMutation.mutate(
      {
        recipeData: formData,
        ingredientsData: recipeIngredients,
      },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Receita criada com sucesso!" })
          setFormData({
            name: "",
            description: "",
            yield_quantity: 1,
            yield_unit: "unidade",
          })
          setRecipeIngredients([])
          setShowForm(false)
        },
        onError: (error) => {
          toast({
            title: "Erro ao Criar Receita",
            description: error.message,
            variant: "destructive",
          })
        },
      },
    )
  }

  const addIngredient = () => {
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredient_id: "", quantity: 0 },
    ])
  }

  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredientForm,
    value: string | number,
  ) => {
    const updated = [...recipeIngredients]
    updated[index] = { ...updated[index], [field]: value }
    setRecipeIngredients(updated)
  }

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
  }

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
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
          <TableCell colSpan={6} className="text-center text-red-500">
            Erro ao carregar receitas: {error.message}
          </TableCell>
        </TableRow>
      )
    }

    return recipes?.map((recipe) => {
      const totalCost = getRecipeCost(recipe)
      const yieldQty = Number(recipe.yield_quantity) || 1
      const costPerUnit = totalCost / yieldQty

      return (
        <TableRow key={recipe.id}>
          <TableCell className="font-medium">{recipe.name}</TableCell>
          <TableCell>{recipe.description}</TableCell>
          <TableCell>
            {recipe.yield_quantity} {recipe.yield_unit}
          </TableCell>
          <TableCell>
            R${" "}
            {totalCost.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TableCell>
          <TableCell>
            R${" "}
            {costPerUnit.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </TableCell>
          <TableCell>
            {new Date(recipe.created_at).toLocaleDateString("pt-BR")}
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div>
      <PageHeader
        title="Receitas"
        icon={ChefHat}
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Fechar Formulário" : "Nova Receita"}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Receita</CardTitle>
              <CardDescription>
                Preencha os detalhes da receita e adicione os ingredientes
                necessários.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Receita</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yield_quantity">Rendimento</Label>
                    <Input
                      id="yield_quantity"
                      type="number"
                      step="0.01"
                      value={formData.yield_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yield_quantity: Number(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yield_unit">Unidade do Rendimento</Label>
                    <Input
                      id="yield_unit"
                      value={formData.yield_unit}
                      onChange={(e) =>
                        setFormData({ ...formData, yield_unit: e.target.value })
                      }
                      placeholder="unidades, kg, etc"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Ingredientes</Label>
                    <Button
                      type="button"
                      onClick={addIngredient}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {recipeIngredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap gap-2 items-center"
                      >
                        <Select
                          value={ingredient.ingredient_id}
                          onValueChange={(value) =>
                            updateIngredient(index, "ingredient_id", value)
                          }
                        >
                          <SelectTrigger className="flex-1 min-w-[150px]">
                            <SelectValue
                              placeholder={
                                isLoadingIngredients
                                  ? "Carregando..."
                                  : "Selecione um ingrediente"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients?.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Qtd"
                          className="w-24"
                          value={ingredient.quantity}
                          onChange={(e) =>
                            updateIngredient(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createRecipeMutation.isPending}
                  >
                    {createRecipeMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Criar Receita
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
            <CardTitle>Lista de Receitas</CardTitle>
            <CardDescription>
              Visualize todas as suas receitas e seus custos calculados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="min-w-[120px]">Rendimento</TableHead>
                    <TableHead className="min-w-[140px]">
                      Custo Total (R$)
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      Custo/Unidade (R$)
                    </TableHead>
                    <TableHead className="min-w-[120px]">Criada em</TableHead>
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

export default RecipesTab