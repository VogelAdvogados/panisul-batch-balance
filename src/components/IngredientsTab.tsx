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
import { Plus, Package, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useIngredients } from "@/hooks/useIngredients"
import { useCreateIngredient } from "@/hooks/useCreateIngredient"
import { useStockMovement } from "@/hooks/useStockMovement"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/PageHeader"
import { TablesInsert } from "@/integrations/supabase/types"

const IngredientsTab = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<
    Omit<TablesInsert<"ingredients">, "id" | "created_at" | "updated_at">
  >({
    name: "",
    unit: "",
    current_stock: 0,
    min_stock: 0,
    cost_per_unit: 0,
  })
  const { toast } = useToast()

  const {
    data: ingredients,
    isLoading,
    isError,
    error,
  } = useIngredients()
  const createIngredientMutation = useCreateIngredient()
  const stockMovementMutation = useStockMovement()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createIngredientMutation.mutate(formData, {
      onSuccess: () => {
        toast({
          title: "Sucesso",
          description: "Ingrediente adicionado com sucesso",
        })
        setFormData({
          name: "",
          unit: "",
          current_stock: 0,
          min_stock: 0,
          cost_per_unit: 0,
        })
        setShowForm(false)
      },
      onError: (error) => {
        toast({
          title: "Erro",
          description: `Erro ao adicionar ingrediente: ${error.message}`,
          variant: "destructive",
        })
      },
    })
  }

  const addStock = (ingredientId: string, quantity: number) => {
    stockMovementMutation.mutate(
      {
        ingredient_id: ingredientId,
        movement_type: "in",
        quantity: quantity,
        reason: "Entrada manual",
      },
      {
        onSuccess: () => {
          toast({
            title: "Sucesso",
            description: "Estoque atualizado",
          })
        },
        onError: (error) => {
          toast({
            title: "Erro",
            description: `Erro ao adicionar estoque: ${error.message}`,
            variant: "destructive",
          })
        },
      },
    )
  }

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-9 w-24" />
          </TableCell>
        </TableRow>
      ))
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center text-red-500">
            Erro ao carregar ingredientes: {error.message}
          </TableCell>
        </TableRow>
      )
    }

    return ingredients?.map((ingredient) => (
      <TableRow key={ingredient.id}>
        <TableCell className="font-medium">{ingredient.name}</TableCell>
        <TableCell>{ingredient.unit}</TableCell>
        <TableCell>
          {ingredient.current_stock.toLocaleString("pt-BR")}
        </TableCell>
        <TableCell>{ingredient.min_stock.toLocaleString("pt-BR")}</TableCell>
        <TableCell>
          {(ingredient.cost_per_unit || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>
          {ingredient.current_stock <= ingredient.min_stock ? (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Baixo
            </div>
          ) : (
            <span className="text-green-600">Normal</span>
          )}
        </TableCell>
        <TableCell>
          <Button
            size="sm"
            onClick={() => {
              const quantity = prompt("Quantidade a adicionar:")
              if (quantity && !isNaN(parseFloat(quantity))) {
                addStock(ingredient.id, parseFloat(quantity))
              }
            }}
          >
            + Estoque
          </Button>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div>
      <PageHeader
        title="Controle de Ingredientes"
        icon={Package}
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Fechar" : "Novo Ingrediente"}
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Ingrediente</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Ingrediente</Label>
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
                    <Label htmlFor="unit">Unidade</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      placeholder="kg, g, L, ml, unidade"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_stock">Estoque Inicial</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      step="0.01"
                      value={formData.current_stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          current_stock: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Estoque Mínimo</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      step="0.01"
                      value={formData.min_stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_stock: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="cost_per_unit">Custo por Unidade (R$)</Label>
                    <Input
                      id="cost_per_unit"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_unit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cost_per_unit: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Opcional. Será atualizado automaticamente por compras
                      confirmadas (custo médio).
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    disabled={createIngredientMutation.isPending}
                  >
                    {createIngredientMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Adicionar
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
            <CardTitle>Lista de Ingredientes</CardTitle>
            <CardDescription>
              Acompanhe o estoque e o custo dos seus ingredientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="min-w-[80px]">Unidade</TableHead>
                    <TableHead className="min-w-[120px]">
                      Estoque Atual
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      Estoque Mínimo
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      Custo/Unidade
                    </TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Ações</TableHead>
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

export default IngredientsTab