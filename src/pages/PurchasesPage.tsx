import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Upload, Eye, Check, Loader2, ShoppingCart } from "lucide-react"
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
import { useQueryClient } from "@tanstack/react-query"
import { PurchaseForm } from "@/components/purchases/PurchaseForm"
import { SupplierForm } from "@/components/purchases/SupplierForm"
import { PageHeader } from "@/components/ui/PageHeader"
import { useSEO } from "@/hooks/useSEO"

export default function PurchasesPage() {
  useSEO({ title: "Compras | Compras", description: "Gerencie e importe compras (XML/PDF) e confirme para atualizar estoque." })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [showNewPurchase, setShowNewPurchase] = useState(false)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [showImport, setShowImport] = useState(false)

  const { data: purchases, isLoading: isLoadingPurchases, isError: isErrorPurchases, error: errorPurchases } = usePurchases()
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers()
  const { data: ingredients, isLoading: isLoadingIngredients } = useIngredients()

  const createPurchaseMutation = useCreatePurchase()
  const createSupplierMutation = useCreateSupplier()
  const updatePurchaseStatusMutation = useUpdatePurchaseStatus()

  const handleImported = () => {
    queryClient.invalidateQueries({ queryKey: ["purchases"] })
    queryClient.invalidateQueries({ queryKey: ["suppliers"] })
  }

  const handleSupplierSubmit = (supplierData: { name: string; cnpj?: string | null; email?: string | null; phone?: string | null; address?: string | null }) => {
    createSupplierMutation.mutate(supplierData, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Fornecedor cadastrado com sucesso." })
        setShowNewSupplier(false)
      },
      onError: (error) => {
        toast({ title: "Erro", description: `Erro ao cadastrar fornecedor: ${error.message}`, variant: "destructive" })
      },
    })
  }

  const handlePurchaseSubmit = (
    purchaseData: { supplier_id?: string; purchase_date?: string; nfe_number?: string; notes?: string; status?: string; total_amount?: number },
    itemsData: { ingredient_id: string; quantity: number; unit_price: number; total_price: number }[],
  ) => {
    createPurchaseMutation.mutate({ purchaseData, itemsData }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Compra registrada com sucesso." })
        setShowNewPurchase(false)
      },
      onError: (error) => {
        toast({ title: "Erro", description: `Erro ao registrar compra: ${error.message}`, variant: "destructive" })
      },
    })
  }

  const confirmPurchase = (purchaseId: string) => {
    updatePurchaseStatusMutation.mutate({ purchaseId, status: "confirmed" }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Compra confirmada e estoque atualizado." })
      },
      onError: (error) => {
        toast({ title: "Erro", description: `Erro ao confirmar compra: ${error.message}`, variant: "destructive" })
      },
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "confirmed":
        return <Badge variant="default">Confirmada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
          <TableCell colSpan={6} className="text-center text-red-500">Erro ao carregar compras: {errorPurchases?.message}</TableCell>
        </TableRow>
      )
    }

    return purchases?.map((purchase) => (
      <TableRow key={purchase.id}>
        <TableCell>{format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
        <TableCell>{purchase.suppliers?.name || 'Não informado'}</TableCell>
        <TableCell>{purchase.nfe_number || '-'}</TableCell>
        <TableCell>R$ {Number(purchase.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
        <TableCell>{getStatusBadge(purchase.status)}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
            {purchase.status === 'pending' && (
              <Button variant="outline" size="sm" onClick={() => confirmPurchase(purchase.id)} disabled={updatePurchaseStatusMutation.isPending}>
                {updatePurchaseStatusMutation.isPending && (updatePurchaseStatusMutation as any).variables?.purchaseId === purchase.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div>
      <PageHeader
        title="Compras"
        icon={ShoppingCart}
        actions={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setShowNewPurchase(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Button>
            <Button variant="outline" onClick={() => setShowImport(true)} className="w-full sm:w-auto">
              <Upload className="h-4 w-4 mr-2" />
              Importar Compra (XML/PDF)
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Compras</CardTitle>
            <CardDescription>Todas as compras registradas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px]">Data</TableHead>
                    <TableHead className="min-w-[150px]">Fornecedor</TableHead>
                    <TableHead className="min-w-[100px]">NFe</TableHead>
                    <TableHead className="min-w-[120px]">Total</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderTableContent()}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <SupplierForm onSubmit={handleSupplierSubmit} onCancel={() => setShowNewSupplier(false)} isSubmitting={createSupplierMutation.isPending} />
        </DialogContent>
      </Dialog>

      <ImportNFeDialog open={showImport} onOpenChange={setShowImport} suppliers={suppliers || []} ingredients={ingredients || []} onImported={handleImported} />
    </div>
  )
}
