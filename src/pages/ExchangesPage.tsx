import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, Eye, Check } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Sale {
  id: string
  customer_id?: string
  sale_date: string
  total_amount: number
  customers?: Customer
}

interface Recipe {
  id: string
  name: string
  yield_quantity: number
  yield_unit: string
}

interface Exchange {
  id: string
  original_sale_id?: string
  customer_id?: string
  exchange_date: string
  reason?: string
  status: string
  total_refund: number
  notes?: string
  customers?: Customer
  sales?: Sale
}

interface ExchangeItem {
  recipe_id: string
  quantity: number
  reason?: string
}

export default function ExchangesPage() {
  const { toast } = useToast()
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showNewExchange, setShowNewExchange] = useState(false)
  
  const [formData, setFormData] = useState({
    original_sale_id: '',
    customer_id: '',
    exchange_date: new Date().toISOString().split('T')[0],
    reason: '',
    total_refund: 0,
    notes: ''
  })
  
  const [exchangeItems, setExchangeItems] = useState<ExchangeItem[]>([{
    recipe_id: '',
    quantity: 0,
    reason: ''
  }])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [exchangesResult, customersResult, salesResult, recipesResult] = await Promise.all([
        supabase.from('exchanges').select(`
          *,
          customers (*),
          sales (*)
        `).order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('sales').select(`
          *,
          customers (*)
        `).order('created_at', { ascending: false }),
        supabase.from('recipes').select('*').order('name')
      ])

      setExchanges(exchangesResult.data || [])
      setCustomers(customersResult.data || [])
      setSales(salesResult.data || [])
      setRecipes(recipesResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das trocas",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Inserir troca
      const { data: exchange, error: exchangeError } = await supabase
        .from('exchanges')
        .insert([{
          ...formData,
          status: 'pending'
        }])
        .select()
        .single()

      if (exchangeError) throw exchangeError

      // Inserir itens da troca
      const itemsToInsert = exchangeItems
        .filter(item => item.recipe_id && item.quantity > 0)
        .map(item => ({
          exchange_id: exchange.id,
          ...item
        }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('exchange_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      toast({
        title: "Sucesso",
        description: "Troca registrada com sucesso",
      })

      // Reset form
      setFormData({
        original_sale_id: '',
        customer_id: '',
        exchange_date: new Date().toISOString().split('T')[0],
        reason: '',
        total_refund: 0,
        notes: ''
      })
      setExchangeItems([{
        recipe_id: '',
        quantity: 0,
        reason: ''
      }])
      setShowNewExchange(false)
      fetchData()
    } catch (error) {
      console.error('Erro ao registrar troca:', error)
      toast({
        title: "Erro",
        description: "Erro ao registrar troca",
        variant: "destructive",
      })
    }
  }

  const processExchange = async (exchangeId: string) => {
    try {
      const { error } = await supabase
        .from('exchanges')
        .update({ status: 'processed' })
        .eq('id', exchangeId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Troca processada com sucesso",
      })
      fetchData()
    } catch (error) {
      console.error('Erro ao processar troca:', error)
      toast({
        title: "Erro",
        description: "Erro ao processar troca",
        variant: "destructive",
      })
    }
  }

  const addItem = () => {
    setExchangeItems([...exchangeItems, {
      recipe_id: '',
      quantity: 0,
      reason: ''
    }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...exchangeItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setExchangeItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setExchangeItems(exchangeItems.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'processed':
        return <Badge variant="default">Processada</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trocas e Devoluções</h1>
        <Button onClick={() => setShowNewExchange(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Troca
        </Button>
      </div>

      {/* Lista de Trocas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Trocas</CardTitle>
          <CardDescription>
            Todas as trocas e devoluções registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Venda Original</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Reembolso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((exchange) => (
                <TableRow key={exchange.id}>
                  <TableCell>
                    {format(new Date(exchange.exchange_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{exchange.customers?.name || 'Não informado'}</TableCell>
                  <TableCell>
                    {exchange.sales ? 
                      `R$ ${exchange.sales.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{exchange.reason || '-'}</TableCell>
                  <TableCell>
                    R$ {exchange.total_refund.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(exchange.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {exchange.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => processExchange(exchange.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nova Troca */}
      <Dialog open={showNewExchange} onOpenChange={setShowNewExchange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Troca/Devolução</DialogTitle>
            <DialogDescription>
              Registre uma nova troca ou devolução
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="original_sale">Venda Original</Label>
                <Select value={formData.original_sale_id} onValueChange={(value) => setFormData({...formData, original_sale_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a venda" />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: ptBR })} - 
                        R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exchange_date">Data da Troca</Label>
                <Input
                  id="exchange_date"
                  type="date"
                  value={formData.exchange_date}
                  onChange={(e) => setFormData({...formData, exchange_date: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total_refund">Valor do Reembolso</Label>
                <Input
                  id="total_refund"
                  type="number"
                  step="0.01"
                  value={formData.total_refund}
                  onChange={(e) => setFormData({...formData, total_refund: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Troca</Label>
              <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produto_defeituoso">Produto Defeituoso</SelectItem>
                  <SelectItem value="produto_vencido">Produto Vencido</SelectItem>
                  <SelectItem value="insatisfacao_cliente">Insatisfação do Cliente</SelectItem>
                  <SelectItem value="erro_pedido">Erro no Pedido</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Itens da Troca */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Itens para Troca</Label>
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              {exchangeItems.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                  <div>
                    <Label>Produto</Label>
                    <Select value={item.recipe_id} onValueChange={(value) => updateItem(index, 'recipe_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Motivo Específico</Label>
                    <Input
                      value={item.reason}
                      onChange={(e) => updateItem(index, 'reason', e.target.value)}
                      placeholder="Ex: queimado, vencido..."
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={exchangeItems.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações sobre a troca..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowNewExchange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Troca
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}