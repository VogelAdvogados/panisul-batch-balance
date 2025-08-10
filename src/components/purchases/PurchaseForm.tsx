import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export interface Supplier { id: string; name: string }
export interface Ingredient { id: string; name: string; unit: string }

export interface PurchaseItemForm { ingredient_id: string; quantity: number; unit_price: number; total_price: number }
export interface PurchaseInsert { supplier_id?: string; purchase_date?: string; nfe_number?: string; notes?: string; status?: string; total_amount?: number }
export interface PurchaseItemInsert { ingredient_id: string; quantity: number; unit_price: number; total_price: number; purchase_id?: string }

interface PurchaseFormProps {
  suppliers: Supplier[]
  ingredients: Ingredient[]
  onSubmit: (purchaseData: PurchaseInsert, itemsData: Omit<PurchaseItemInsert, 'purchase_id'>[]) => void
  onCancel: () => void
  isSubmitting: boolean
  isLoadingSuppliers: boolean
  isLoadingIngredients: boolean
  onAddNewSupplier: () => void
}

export const PurchaseForm = ({ suppliers, ingredients, onSubmit, onCancel, isSubmitting, isLoadingSuppliers, isLoadingIngredients, onAddNewSupplier }: PurchaseFormProps) => {
  const [formData, setFormData] = useState<PurchaseInsert>({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    nfe_number: '',
    notes: '',
    status: 'pending',
  })

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemForm[]>([
    { ingredient_id: '', quantity: 0, unit_price: 0, total_price: 0 },
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const totalAmount = purchaseItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
    onSubmit({ ...formData, total_amount: totalAmount }, purchaseItems)
  }

  const addItem = () => setPurchaseItems([...purchaseItems, { ingredient_id: '', quantity: 0, unit_price: 0, total_price: 0 }])

  const updateItem = (index: number, field: keyof PurchaseItemForm, value: any) => {
    const updated = [...purchaseItems]
    ;(updated[index] as any)[field] = value
    if (field === 'quantity' || field === 'unit_price') {
      const q = Number(updated[index].quantity || 0)
      const u = Number(updated[index].unit_price || 0)
      updated[index].total_price = q * u
    }
    setPurchaseItems(updated)
  }

  const removeItem = (index: number) => setPurchaseItems(purchaseItems.filter((_, i) => i !== index))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplier">Fornecedor</Label>
          <div className="flex gap-2">
            <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingSuppliers ? 'Carregando...' : 'Selecione o fornecedor'} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={onAddNewSupplier}>+ Fornecedor</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Data da Compra</Label>
          <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nfe_number">Número da NFe</Label>
          <Input id="nfe_number" value={formData.nfe_number} onChange={(e) => setFormData({ ...formData, nfe_number: e.target.value })} placeholder="Ex: 000123456" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Itens da Compra</Label>
          <Button type="button" variant="outline" onClick={addItem}>Adicionar Item</Button>
        </div>
        {purchaseItems.map((item, index) => (
          <div key={index} className="grid grid-cols-5 gap-2 items-end">
            <div>
              <Label>Ingrediente</Label>
              <Select value={item.ingredient_id} onValueChange={(value) => updateItem(index, 'ingredient_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingIngredients ? 'Carregando...' : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.unit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Preço Unitário</Label>
              <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <Label>Total</Label>
              <Input type="number" step="0.01" value={item.total_price} readOnly />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)} disabled={purchaseItems.length === 1}>Remover</Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Observações sobre a compra..." />
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="text-lg font-semibold">Total: R$ {purchaseItems.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Registrar Compra'}</Button>
        </div>
      </div>
    </form>
  )
}
