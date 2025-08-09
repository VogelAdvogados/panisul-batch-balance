import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Wallet, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts"
import { useCreateFinancialAccount } from "@/hooks/useCreateFinancialAccount"
import { Skeleton } from "@/components/ui/skeleton"
import { TablesInsert } from "@/integrations/supabase/types"
import { PageHeader } from "@/components/ui/PageHeader"

const FinancialAccountsPage = () => {
  const { toast } = useToast()
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false)
  const [newAccount, setNewAccount] = useState<
    TablesInsert<"financial_accounts">
  >({
    name: "",
    type: "checking",
  })

  const { data: accounts, isLoading, isError, error } = useFinancialAccounts()
  const createAccountMutation = useCreateFinancialAccount()

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault()
    createAccountMutation.mutate(newAccount, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Nova conta financeira criada." })
        setShowNewAccountDialog(false)
        setNewAccount({ name: "", type: "checking" })
      },
      onError: (err) => {
        toast({
          title: "Erro",
          description: err.message,
          variant: "destructive",
        })
      },
    })
  }

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 2 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
        </TableRow>
      ))
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={3} className="text-center text-red-500">
            Erro ao carregar contas: {error.message}
          </TableCell>
        </TableRow>
      )
    }

    return accounts?.map((account) => (
      <TableRow key={account.id}>
        <TableCell className="font-medium">{account.name}</TableCell>
        <TableCell>
          {account.type === "cash" ? "Caixa" : "Conta Corrente"}
        </TableCell>
        <TableCell className="font-semibold text-lg">
          {account.balance.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div>
      <PageHeader
        title="Contas Financeiras"
        icon={Wallet}
        actions={
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
        }
      />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Saldos Atuais</CardTitle>
            <CardDescription>
              Visão geral de suas contas e saldos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Nome da Conta</TableHead>
                    <TableHead className="min-w-[150px]">Tipo</TableHead>
                    <TableHead className="min-w-[150px]">Saldo Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderTableContent()}</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Conta Financeira</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta</Label>
              <Input
                id="name"
                value={newAccount.name}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, name: e.target.value })
                }
                placeholder="Ex: Caixa da Loja"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conta</Label>
              <Select
                value={newAccount.type}
                onValueChange={(value: "cash" | "checking") =>
                  setNewAccount({ ...newAccount, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="cash">Caixa (Dinheiro Físico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Criar Conta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FinancialAccountsPage
