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
import { Plus, ShoppingCart, Trash, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSales } from "@/hooks/useSales"
import { useCustomers } from "@/hooks/useCustomers"
import { useRecipes } from "@/hooks/useRecipes"
import { useCreateSale } from "@/hooks/useCreateSale"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/PageHeader"
import { Tables, TablesInsert, RecipeWithIngredients } from "@/integrations/supabase/types"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"

type SaleItemForm = Omit<TablesInsert<"sale_items">, "sale_id">

const SalesTab = () => {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<
    Omit<TablesInsert<"sales">, "id" | "created_at" | "total_amount">
  >({
    customer_id: null,
    sale_date: new Date().toISOString().split("T")[0],
    status: "completed",
    notes: "",
  })
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([])
  const { toast } = useToast()

  const { data: sales, isLoading: isLoadingSales } = useSales()
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers()
  const { data: recipes, isLoading: isLoadingRecipes } = useRecipes()
  const createSaleMutation = useCreateSale()

  const getRecipeCost = (recipe: RecipeWithIngredients) => {
    return recipe.recipe_ingredients.reduce((sum, ri) => {
      const qty = Number(ri.quantity) || 0
      const cost = Number(ri.ingredients?.cost_per_unit) || 0
      return sum + qty * cost
    }, 0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (saleItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda",
        variant: "destructive",
      })
      return
    }

    createSaleMutation.mutate(
      { saleData: formData, itemsData: saleItems },
      {
        onSuccess: () => {
          toast({
            title: "Sucesso",
            description: "Venda registrada! Estoque atualizado.",
          })
          setFormData({
            customer_id: null,
            sale_date: new Date().toISOString().split("T")[0],
            status: "completed",
            notes: "",
          })
          setSaleItems([])
          setShowForm(false)
        },
        onError: (error) => {
          toast({
            title: "Erro",
            description: `Erro ao criar venda: ${error.message}`,
            variant: "destructive",
          })
        },
      },
    )
  }

  const addItem = () => {
    setSaleItems([
      ...saleItems,
      { recipe_id: "", quantity: 1, unit_price: 0, total_price: 0 },
    ])
  }

  const updateItem = (
    index: number,
    field: keyof SaleItemForm,
    value: string | number,
  ) => {
    const updated = [...saleItems]
    const item = { ...updated[index], [field]: value }
    
    if (field === "quantity" || field === "unit_price") {
      item.total_price = (item.quantity || 0) * (item.unit_price || 0)
    } else if (field === "recipe_id") {
      const recipe = recipes?.find((r) => r.id === value)
      const costPerUnit = recipe
        ? getRecipeCost(recipe) / (Number(recipe.yield_quantity) || 1)
        : 0
      item.unit_price = costPerUnit * 1.5 // default markup
      item.total_price = (item.quantity || 0) * (item.unit_price || 0)
    }
    
    updated[index] = item
    setSaleItems(updated)
  }

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: Tables<'sales'>['status']) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600 hover:bg-green-700">Concluída</Badge>
      case 'pending': return <Badge variant="secondary">Pendente</Badge>
      case 'canceled': return <Badge variant="destructive">Cancelada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const totalSale = saleItems.reduce((sum, item) => sum + (item.total_price || 0), 0)

  return (
    <div>
      <PageHeader
        title="Vendas"
        icon={ShoppingCart}
        actions={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? "Fechar" : "Nova Venda"}
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nova Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Cliente (Opcional)</Label>
                    <Select
                      value={formData.customer_id || ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customer_id: value })
                      }
                    >
                      <SelectTrigger disabled={isLoadingCustomers}>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers?.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_date">Data da Venda</Label>
                    <Input
                      id="sale_date"
                      type="date"
                      value={formData.sale_date}
                      onChange={(e) =>
                        setFormData({ ...formData, sale_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "completed" | "pending" | "canceled") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Itens da Venda</Label>
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>

                  {saleItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap gap-2 mb-2 items-end"
                    >
                      <div className="flex-1 min-w-full sm:min-w-[150px] space-y-2">
                        <Label>Produto</Label>
                        <Select
                          value={item.recipe_id}
                          onValueChange={(value) =>
                            updateItem(index, "recipe_id", value)
                          }
                          disabled={isLoadingRecipes}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
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
                      <div className="w-24 space-y-2">
                        <Label>Qtd</Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        <Label>Preço Un.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(index, "unit_price", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        <Label>Total</Label>
                        <Input
                          type="number"
                          value={item.total_price.toFixed(2)}
                          disabled
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {saleItems.length > 0 && (
                    <div className="text-right mt-4 font-bold text-lg">
                      <span>Total da Venda:</span>
                      <span className="text-primary ml-2">
                        {totalSale.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Observações sobre a venda..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={createSaleMutation.isPending}>
                    {createSaleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Registrar Venda
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
            <CardTitle>Histórico de Vendas</CardTitle>
            <CardDescription>
              Lista de todas as vendas registradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Data</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[120px]">Total</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Registrado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSales ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    sales?.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {format(parseISO(sale.sale_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>
                          {sale.customers?.name || "Cliente avulso"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sale.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(sale.status)}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(sale.created_at), "dd/MM/yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SalesTab