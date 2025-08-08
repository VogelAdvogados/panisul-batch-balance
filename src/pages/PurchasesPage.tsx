import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Upload, Eye, Check, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ImportNFeDialog } from "@/components/purchases/ImportNFeDialog"
interface Supplier {
  id: string
  name: string
  cnpj?: string
  email?: string
  phone?: string
}

interface Ingredient {
  id: string
  name: string
  unit: string
}

interface Purchase {
  id: string
  supplier_id?: string
  purchase_date: string
  total_amount: number
  status: string
  nfe_number?: string
  notes?: string
  suppliers?: Supplier
}

interface PurchaseItem {
  ingredient_id: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function PurchasesPage() {
  const { toast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [showNewPurchase, setShowNewPurchase] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [showImport, setShowImport] = useState(false)
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    nfe_number: '',
    notes: ''
  })
  
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: ''
  })
  
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{
    ingredient_id: '',
    quantity: 0,
    unit_price: 0,
    total_price: 0
  }])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [purchasesResult, suppliersResult, ingredientsResult] = await Promise.all([
        supabase.from('purchases').select(`
          *,
          suppliers (*)
        `).order('created_at', { ascending: false }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('ingredients').select('*').order('name')
      ])

      setPurchases(purchasesResult.data || [])
      setSuppliers(suppliersResult.data || [])
      setIngredients(ingredientsResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das compras",
        variant: "destructive",
      })
    }
  }

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierForm])
        .select()
        .single()

      if (error) throw error

      setSuppliers([...suppliers, data])
      setFormData({ ...formData, supplier_id: data.id })
      setSupplierForm({ name: '', cnpj: '', email: '', phone: '', address: '' })
      setShowNewSupplier(false)
      
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao cadastrar fornecedor:', error)
      toast({
        title: "Erro",
        description: "Erro ao cadastrar fornecedor",
        variant: "destructive",
      })
    }
  }

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const totalAmount = purchaseItems.reduce((sum, item) => sum + item.total_price, 0)
      
      // Inserir compra
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          ...formData,
          total_amount: totalAmount,
          status: 'pending'
        }])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Inserir itens da compra
      const itemsToInsert = purchaseItems.map(item => ({
        purchase_id: purchase.id,
        ...item
      }))

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      toast({
        title: "Sucesso",
        description: "Compra registrada com sucesso",
      })

      // Reset form
      setFormData({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        nfe_number: '',
        notes: ''
      })
      setPurchaseItems([{
        ingredient_id: '',
        quantity: 0,
        unit_price: 0,
        total_price: 0
      }])
      setShowNewPurchase(false)
      fetchData()
    } catch (error) {
      console.error('Erro ao registrar compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao registrar compra",
        variant: "destructive",
      })
    }
  }

  const confirmPurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'confirmed' })
        .eq('id', purchaseId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Compra confirmada e estoque atualizado",
      })
      fetchData()
    } catch (error) {
      console.error('Erro ao confirmar compra:', error)
      toast({
        title: "Erro",
        description: "Erro ao confirmar compra",
        variant: "destructive",
      })
    }
  }

  const addItem = () => {
    setPurchaseItems([...purchaseItems, {
      ingredient_id: '',
      quantity: 0,
      unit_price: 0,
      total_price: 0
    }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...purchaseItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }
    
    setPurchaseItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'confirmed':
        return <Badge variant="default">Confirmada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compras</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewPurchase(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Compra
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)} className="hover-scale">
            <Upload className="h-4 w-4 mr-2" />
            Importar Compra (XML/PDF)
          </Button>
        </div>
      </div>

      {/* Lista de Compras */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Compras</CardTitle>
          <CardDescription>
            Todas as compras registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>NFe</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell>
                    {format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{purchase.suppliers?.name || 'Não informado'}</TableCell>
                  <TableCell>{purchase.nfe_number || '-'}</TableCell>
                  <TableCell>
                    R$ {purchase.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {purchase.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => confirmPurchase(purchase.id)}
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

      {/* Dialog Nova Compra */}
      <Dialog open={showNewPurchase} onOpenChange={setShowNewPurchase}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Compra</DialogTitle>
            <DialogDescription>
              Registre uma nova compra de insumos
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitPurchase} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <div className="flex gap-2">
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setShowNewSupplier(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Data da Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nfe_number">Número da NFe</Label>
                <Input
                  id="nfe_number"
                  value={formData.nfe_number}
                  onChange={(e) => setFormData({...formData, nfe_number: e.target.value})}
                  placeholder="Ex: 000123456"
                />
              </div>
            </div>

            {/* Itens da Compra */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Itens da Compra</Label>
                <Button type="button" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              {purchaseItems.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <Label>Ingrediente</Label>
                    <Select value={item.ingredient_id} onValueChange={(value) => updateItem(index, 'ingredient_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ingredient) => (
                          <SelectItem key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit})
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
                    <Label>Preço Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <Label>Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.total_price}
                      readOnly
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={purchaseItems.length === 1}
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
                placeholder="Observações sobre a compra..."
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-lg font-semibold">
                Total: R$ {purchaseItems.reduce((sum, item) => sum + item.total_price, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewPurchase(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Compra
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Fornecedor */}
      <Dialog open={showNewSupplier} onOpenChange={setShowNewSupplier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Cadastre um novo fornecedor
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitSupplier} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Nome *</Label>
              <Input
                id="supplier_name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={supplierForm.cnpj}
                  onChange={(e) => setSupplierForm({...supplierForm, cnpj: e.target.value})}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier_phone">Telefone</Label>
                <Input
                  id="supplier_phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_email">Email</Label>
              <Input
                id="supplier_email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                placeholder="fornecedor@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier_address">Endereço</Label>
              <Textarea
                id="supplier_address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                placeholder="Endereço completo..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowNewSupplier(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Cadastrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ImportNFeDialog open={showImport} onOpenChange={setShowImport} suppliers={suppliers} ingredients={ingredients} onImported={fetchData} />
    </div>
  )
}