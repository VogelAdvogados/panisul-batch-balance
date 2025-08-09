import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Check, Loader2, DollarSign, Calendar } from "lucide-react"
import { format, parseISO, isBefore, startOfToday } from "date-fns"
import { useSEO } from "@/hooks/useSEO"
import {
  useAccountsPayable,
  PayableStatusFilter,
} from "@/hooks/useAccountsPayable"
import { usePayBill } from "@/hooks/usePayBill"
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts"
import { Skeleton } from "@/components/ui/skeleton"
import { AccountPayableWithSupplier } from "@/integrations/supabase/types"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/ui/PageHeader"

// We can move the form to its own component later if needed
const PayBillDialog = ({
  account,
  onPay,
}: {
  account: AccountPayableWithSupplier
  onPay: (accountId: string) => void
}) => {
  const { data: financialAccounts, isLoading } = useFinancialAccounts()
  const [selectedAccount, setSelectedAccount] = useState<string>("")

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Pagar Conta</DialogTitle>
        <CardDescription>
          Selecione a conta de onde o dinheiro sairá.
        </CardDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div>
          <p>
            <strong>Descrição:</strong> {account.description}
          </p>
          <p>
            <strong>Fornecedor:</strong> {account.suppliers?.name || "N/A"}
          </p>
          <p className="text-lg font-bold">
            <strong>Valor:</strong>{" "}
            {Number(account.amount).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="financial_account">Pagar com a conta</Label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger disabled={isLoading}>
              <SelectValue
                placeholder={
                  isLoading ? "Carregando contas..." : "Selecione uma conta"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {financialAccounts?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} (Saldo:{" "}
                  {acc.balance.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button onClick={() => onPay(selectedAccount)} disabled={!selectedAccount}>
          Confirmar Pagamento
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export default function AccountsPayablePage() {
  useSEO({
    title: "Contas a Pagar | Financeiro",
    description: "Gerencie suas contas a pagar, pendentes e vencidas.",
  })
  const { toast } = useToast()
  const [filter, setFilter] = useState<PayableStatusFilter>("pending")
  const [selectedAccountToPay, setSelectedAccountToPay] =
    useState<AccountPayableWithSupplier | null>(null)

  const { data: accounts, isLoading, isError, error } = useAccountsPayable(filter)
  const payBillMutation = usePayBill()

  const handlePayBill = (financialAccountId: string) => {
    if (!selectedAccountToPay) return

    payBillMutation.mutate(
      {
        payable_id: selectedAccountToPay.id,
        account_id: financialAccountId,
      },
      {
        onSuccess: () => {
          toast({ title: "Sucesso", description: "Conta paga com sucesso!" })
          setSelectedAccountToPay(null)
        },
        onError: (err) => {
          toast({
            title: "Erro",
            description: err.message,
            variant: "destructive",
          })
        },
      },
    )
  }

  const getStatusBadge = (account: AccountPayableWithSupplier) => {
    if (account.status === "paid")
      return <Badge className="bg-green-600 hover:bg-green-700">Pago</Badge>
    const today = startOfToday()
    const dueDate = parseISO(account.due_date)
    if (isBefore(dueDate, today)) return <Badge variant="destructive">Vencido</Badge>
    return <Badge variant="secondary">Pendente</Badge>
  }

  const totalPending =
    accounts
      ?.filter((a) => a.status === "pending")
      .reduce((sum, acc) => sum + acc.amount, 0) || 0
  const totalOverdue =
    accounts
      ?.filter(
        (a) =>
          a.status === "pending" && isBefore(parseISO(a.due_date), startOfToday()),
      )
      .reduce((sum, acc) => sum + acc.amount, 0) || 0

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
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
          <TableCell colSpan={6} className="text-center text-red-500">
            Erro ao carregar contas: {error.message}
          </TableCell>
        </TableRow>
      )
    }

    return accounts?.map((account) => (
      <TableRow key={account.id}>
        <TableCell className="font-medium">{account.description}</TableCell>
        <TableCell>{account.suppliers?.name || "N/A"}</TableCell>
        <TableCell>
          {Number(account.amount).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>{format(parseISO(account.due_date), "dd/MM/yyyy")}</TableCell>
        <TableCell>{getStatusBadge(account)}</TableCell>
        <TableCell>
          {account.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAccountToPay(account)}
              disabled={
                payBillMutation.isPending &&
                payBillMutation.variables?.payable_id === account.id
              }
            >
              {payBillMutation.isPending &&
              payBillMutation.variables?.payable_id === account.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Pagar
                </>
              )}
            </Button>
          )}
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div>
      <PageHeader
        title="Contas a Pagar"
        icon={DollarSign}
        actions={
          <Button disabled className="w-full sm:w-auto">
            {" "}
            {/* TODO: Implement New Bill form */}
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
                Total Pendente
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {totalPending.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
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
                onValueChange={(v: PayableStatusFilter) => setFilter(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar</CardTitle>
            <CardDescription>
              Gestão de todas as obrigações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="min-w-[150px]">Fornecedor</TableHead>
                    <TableHead className="min-w-[120px]">Valor</TableHead>
                    <TableHead className="min-w-[120px]">Vencimento</TableHead>
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

      <Dialog
        open={!!selectedAccountToPay}
        onOpenChange={(open) => !open && setSelectedAccountToPay(null)}
      >
        {selectedAccountToPay && (
          <PayBillDialog account={selectedAccountToPay} onPay={handlePayBill} />
        )}
      </Dialog>
    </div>
  )
}