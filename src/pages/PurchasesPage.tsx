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
import { useToast } from "@/hooks/use-toast"
import { Plus, Upload, Eye, Check, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ImportNFeDialog } from "@/components/purchases/ImportNFeDialog"
import { Skeleton } from "@/components/ui/skeleton"
import { usePurchases } from "@/hooks/usePurchases"
import { useSuppliers } from "@/hooks/useSuppliers"
import { useIngredients } from "@/hooks/useIngredients"
import { useCreatePurchase } from "@/hooks/useCreatePurchase"
import { useCreateSupplier } from "@/hooks/useCreateSupplier"
import { useUpdatePurchaseStatus } from "@/hooks/useUpdatePurchaseStatus"
import { TablesInsert } from "@/integrations/supabase/types"
import { useQueryClient } from "@tanstack/react-query"
import { PurchaseForm } from "@/components/purchases/PurchaseForm"
import { SupplierForm } from "@/components/purchases/SupplierForm"

// Interface for the purchase item form, as it differs from the database type
interface PurchaseItemForm {
  ingredient_id: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function PurchasesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // State for controlling dialogs
  const [showNewPurchase, setShowNewPurchase] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [showImport, setShowImport] = useState(false)
  
  // Data fetching using react-query hooks
  const { data: purchases, isLoading: isLoadingPurchases, isError: isErrorPurchases, error: errorPurchases } = usePurchases()
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers()
  const { data: ingredients, isLoading: isLoadingIngredients } = useIngredients()

  // Mutations using react-query hooks
  const createPurchaseMutation = useCreatePurchase()
  const createSupplierMutation = useCreateSupplier()
  const updatePurchaseStatusMutation = useUpdatePurchaseStatus()

  const handleImported = () => {
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
    queryClient.invalidateQueries({ queryKey: ['suppliers'] })
  }

  const handleSupplierSubmit = (supplierData: TablesInsert<'suppliers'>) => {
    createSupplierMutation.mutate(supplierData, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Fornecedor cadastrado com sucesso." })
        setShowNewSupplier(false)
      },
      onError: (error) => {
        toast({ title: "Erro", description: `Erro ao cadastrar fornecedor: ${error.message}`, variant: "destructive" })
      }
    })
  }

  const handlePurchaseSubmit = (purchaseData: TablesInsert<'purchases'>, itemsData: Omit<TablesInsert<'purchase_items'>, 'purchase_id'>[]) => {
    createPurchaseMutation.mutate({ purchaseData, itemsData }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Compra registrada com sucesso." })
        setShowNewPurchase(false)
      },
      onError: (error) => {
        toast({ title: "Erro", description: `Erro ao registrar compra: ${error.message}`, variant: "destructive" })
      }
    })
  }

  const confirmPurchase = (purchaseId: string) => {
    updatePurchaseStatusMutation.mutate(
      { purchaseId, status: 'confirmed' },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Compra confirmada e estoque atualizado." })
        },
        onError: (error) => {
          toast({ title: "Erro", description: `Erro ao confirmar compra: ${error.message}`, variant: "destructive" })
        }
      }
    )
  }

  const addItem = () => {
    setPurchaseItems([...purchaseItems, { ingredient_id: '', quantity: 0, unit_price: 0, total_price: 0 }])
  }

  const updateItem = (index: number, field: keyof PurchaseItemForm, value: any) => {
    const updatedItems = [...purchaseItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = (updatedItems[index].quantity || 0) * (updatedItems[index].unit_price || 0)
    }
    
    setPurchaseItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pendente</Badge>
      case 'confirmed': return <Badge variant="default">Confirmada</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderTableContent = () => {
    if (isLoadingPurchases) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))
    }

    if (isErrorPurchases) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center text-red-500">
            Erro ao carregar compras: {errorPurchases.message}
          </TableCell>
        </TableRow>
      )
    }

    return purchases?.map((purchase) => (
      <TableRow key={purchase.id}>
        <TableCell>{format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
        <TableCell>{purchase.suppliers?.name || 'Não informado'}</TableCell>
        <TableCell>{purchase.nfe_number || '-'}</TableCell>
        <TableCell>R$ {purchase.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
            {purchase.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => confirmPurchase(purchase.id)}
                disabled={updatePurchaseStatusMutation.isPending}
              >
                {updatePurchaseStatusMutation.isPending && updatePurchaseStatusMutation.variables?.purchaseId === purchase.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Check className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compras</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewPurchase(true)}><Plus className="h-4 w-4 mr-2" />Nova Compra</Button>
          <Button variant="outline" onClick={() => setShowImport(true)}><Upload className="h-4 w-4 mr-2" />Importar Compra (XML/PDF)</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Compras</CardTitle>
          <CardDescription>Todas as compras registradas no sistema</CardDescription>
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
            <TableBody>{renderTableContent()}</TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showNewPurchase} onOpenChange={setShowNewPurchase}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Compra</DialogTitle>
            <DialogDescription>Registre uma nova compra de insumos</DialogDescription>
          </DialogHeader>
          <PurchaseForm
            suppliers={suppliers || []}
            ingredients={ingredients || []}
            onSubmit={handlePurchaseSubmit}
            onCancel={() => setShowNewPurchase(false)}
            isSubmitting={createPurchaseMutation.isPending}
            isLoadingSuppliers={isLoadingSuppliers}
            isLoadingIngredients={isLoadingIngredients}
            onAddNewSupplier={() => setShowNewSupplier(true)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showNewSupplier} onOpenChange={setShowNewSupplier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
            <DialogDescription>Cadastre um novo fornecedor</DialogDescription>
          </DialogHeader>
          <SupplierForm
            onSubmit={handleSupplierSubmit}
            onCancel={() => setShowNewSupplier(false)}
            isSubmitting={createSupplierMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <ImportNFeDialog open={showImport} onOpenChange={setShowImport} suppliers={suppliers || []} ingredients={ingredients || []} onImported={handleImported} />
    </div>
  )
}