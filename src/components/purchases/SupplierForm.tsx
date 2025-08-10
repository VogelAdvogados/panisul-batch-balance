import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export interface SupplierInsert { name: string; cnpj?: string | null; email?: string | null; phone?: string | null; address?: string | null }

interface SupplierFormProps {
  onSubmit: (supplierData: SupplierInsert) => void
  onCancel: () => void
  isSubmitting: boolean
}

export const SupplierForm = ({ onSubmit, onCancel, isSubmitting }: SupplierFormProps) => {
  const [supplierForm, setSupplierForm] = useState<SupplierInsert>({ name: '', cnpj: '', email: '', phone: '', address: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(supplierForm)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSupplierForm({ ...supplierForm, [e.target.id]: e.target.value })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={supplierForm.name} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" value={supplierForm.cnpj || ''} onChange={handleChange} placeholder="00.000.000/0000-00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={supplierForm.phone || ''} onChange={handleChange} placeholder="(11) 99999-9999" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={supplierForm.email || ''} onChange={handleChange} placeholder="fornecedor@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" value={supplierForm.address || ''} onChange={handleChange} placeholder="Rua Exemplo, 123" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" placeholder="Notas internas (opcional)" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  )
}
