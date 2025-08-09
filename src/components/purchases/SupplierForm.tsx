import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { TablesInsert } from "@/integrations/supabase/types"

interface SupplierFormProps {
  onSubmit: (supplierData: TablesInsert<'suppliers'>) => void
  onCancel: () => void
  isSubmitting: boolean
}

export const SupplierForm = ({ onSubmit, onCancel, isSubmitting }: SupplierFormProps) => {
  const [supplierForm, setSupplierForm] = useState<TablesInsert<'suppliers'>>({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: ''
  })

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
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={supplierForm.email || ''} onChange={handleChange} placeholder="fornecedor@email.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Textarea id="address" value={supplierForm.address || ''} onChange={handleChange} placeholder="Endereço completo..." />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Cadastrar
        </Button>
      </div>
    </form>
  )
}
