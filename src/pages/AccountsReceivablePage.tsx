import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Check, Calendar, DollarSign, Loader2 } from "lucide-react"
import { format, parseISO, isBefore, startOfToday } from "date-fns"
import { useSEO } from "@/hooks/useSEO"
import {
  useAccountsReceivable,
  ReceivableStatusFilter,
} from "@/hooks/useAccountsReceivable"
import { useCustomers } from "@/hooks/useCustomers"
import { useCreateAccountReceivable } from "@/hooks/useCreateAccountReceivable"
import { useUpdateAccountReceivable } from "@/hooks/useUpdateAccountReceivable"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/PageHeader"
import {
  AccountReceivableWithCustomer,
  TablesInsert,
} from "@/integrations/supabase/types"

export default function AccountsReceivablePage() {
  useSEO({
    title: "Contas a Receber | Financeiro",
    description: "Gerencie suas contas a receber, vencidos e recebidos.",
  })
  const { toast } = useToast()
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [filter, setFilter] = useState<ReceivableStatusFilter>("pending")

  const {
    data: accounts,
    isLoading,
    isError,
    error,
  } = useAccountsReceivable(filter)
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers()
  const createAccountMutation = useCreateAccountReceivable()
  const updateAccountMutation = useUpdateAccountReceivable()

  const [formData, setFormData] = useState<
    Omit<TablesInsert<"accounts_receivable">, "id" | "created_at" | "status">
  >({
    customer_id: null,
    description: "",
    amount: 0,
    due_date: new Date().toISOString().split("T")[0],
    sale_id: null,
    received_date: null,
    expected_payment_method: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAccountMutation.mutate(
      { ...formData, status: "pending" },
      {
        onSuccess: () => {
          toast({
            title: "Sucesso",
            description: "Conta a receber registrada com sucesso",
          })
          setFormData({
            customer_id: null,
            description: "",
            amount: 0,
            due_date: new Date().toISOString().split("T")[0],
            sale_id: null,
            received_date: null,
            expected_payment_method: "",
          })
          setShowNewAccount(false)
        },
        onError: (error) => {
          toast({
            title: "Erro",
            description: `Erro ao registrar conta: ${error.message}`,
            variant: "destructive",
          })
        },
      },
    )
  }

  const markAsReceived = (accountId: string) => {
    const method = window.prompt(
      "Informe a forma de pagamento (ex: pix, dinheiro)",
      "",
    )
    if (!method) return
    updateAccountMutation.mutate(
      {
        id: accountId,
        updates: {
          status: "received",
          received_date: new Date().toISOString(),
          actual_payment_method: method,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Sucesso",
            description: "Conta marcada como recebida",
          })
        },
        onError: (error) => {
          toast({
            title: "Erro",
            description: `Erro ao marcar conta como recebida: ${error.message}`,
            variant: "destructive",
          })
        },
      },
    )
  }

  const getStatusBadge = (account: AccountReceivableWithCustomer) => {
    if (account.status === "received") {
      return <Badge className="bg-green-600 hover:bg-green-700">Recebido</Badge>
    }
    const today = startOfToday()
    const dueDate = parseISO(account.due_date)
    if (isBefore(dueDate, today)) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    return <Badge variant="secondary">Pendente</Badge>
  }

  const totalPending =
    accounts
      ?.filter((account) => account.status === "pending")
      .reduce((sum, account) => sum + Number(account.amount), 0) || 0

  const totalOverdue =
    accounts
      ?.filter(
        (account) =>
          account.status === "pending" &&
          isBefore(parseISO(account.due_date), startOfToday()),
      )
      .reduce((sum, account) => sum + Number(account.amount), 0) || 0

  return (
    <div>
      <PageHeader
        title="Contas a Receber"
        icon={DollarSign}
        actions={
          <Button
            onClick={() => setShowNewAccount(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total a Receber
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalPending.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {totalOverdue.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Filtros</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <Select
                value={filter}
                onValueChange={(value: ReceivableStatusFilter) => setFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="received">Recebidas</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>
              Gestão de todos os valores a receber
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="min-w-[150px]">Cliente</TableHead>
                    <TableHead className="min-w-[120px]">Valor</TableHead>
                    <TableHead className="min-w-[120px]">Vencimento</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                      </TableRow>
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-red-500">
                        Erro ao carregar dados: {error.message}
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts?.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          {account.description}
                        </TableCell>
                        <TableCell>
                          {account.customers?.name || "Não informado"}
                        </TableCell>
                        <TableCell>
                          {Number(account.amount).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(account.due_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{getStatusBadge(account)}</TableCell>
                        <TableCell>
                          {account.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsReceived(account.id)}
                              disabled={updateAccountMutation.isPending && updateAccountMutation.variables?.id === account.id}
                            >
                              {updateAccountMutation.isPending && updateAccountMutation.variables?.id === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                              Receber
                            </Button>
                          )}
                          {account.status === "received" &&
                            account.received_date && (
                              <span className="text-sm text-muted-foreground">
                                Recebido em{" "}
                                {format(
                                  parseISO(account.received_date),
                                  "dd/MM/yyyy",
                                )}
                              </span>
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showNewAccount} onOpenChange={setShowNewAccount}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta a Receber</DialogTitle>
              <DialogDescription>
                Registre um novo valor a receber
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ex: Venda a prazo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={formData.customer_id || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customer_id: value })
                  }
                  disabled={isLoadingCustomers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Data de Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_payment_method">Forma de Pagamento</Label>
                  <Select
                    value={formData.expected_payment_method || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        expected_payment_method: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewAccount(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Registrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}