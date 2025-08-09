import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Check, Calendar, DollarSign } from "lucide-react"
import { format, parseISO, isBefore, isAfter, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useSEO } from "@/hooks/useSEO"

interface Supplier {
  id: string
  name: string
}

interface Purchase {
  id: string
  supplier_id?: string
  purchase_date: string
  total_amount: number
  suppliers?: Supplier
}

interface AccountPayable {
  id: string
  purchase_id?: string
  supplier_id?: string
  description: string
  amount: number
  due_date: string
  status: string
  paid_date?: string
  suppliers?: Supplier
  purchases?: Purchase
}

export default function AccountsPayablePage() {
  useSEO({ title: "Contas a Pagar | Financeiro", description: "Gerencie suas contas a pagar, pendentes e vencidas." });
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<AccountPayable[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    purchase_id: '',
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [accountsResult, suppliersResult, purchasesResult] = await Promise.all([
        supabase.from('accounts_payable').select(`
          *,
          suppliers (*),
          purchases (*, suppliers (*))
        `).order('due_date', { ascending: true }),
        supabase.from('suppliers').select('*').order('name'),
        supabase.from('purchases').select(`
          *,
          suppliers (*)
        `).order('created_at', { ascending: false })
      ])

      setAccounts(accountsResult.data || [])
      setSuppliers(suppliersResult.data || [])
      setPurchases(purchasesResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .insert([{
          ...formData,
          status: 'pending'
        }])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conta a pagar registrada com sucesso",
      })

      setFormData({
        supplier_id: '',
        purchase_id: '',
        description: '',
        amount: 0,
        due_date: new Date().toISOString().split('T')[0]
      })
      setShowNewAccount(false)
      fetchData()
    } catch (error) {
      console.error('Erro ao registrar conta:', error)
      toast({
        title: "Erro",
        description: "Erro ao registrar conta a pagar",
        variant: "destructive",
      })
    }
  }

  const markAsPaid = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({ 
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', accountId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conta marcada como paga",
      })
      fetchData()
    } catch (error) {
      console.error('Erro ao marcar como paga:', error)
      toast({
        title: "Erro",
        description: "Erro ao marcar conta como paga",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (account: AccountPayable) => {
    if (account.status === 'paid') {
      return <Badge variant="default">Pago</Badge>
    }
    
    const today = new Date()
    const dueDate = parseISO(account.due_date)
    
    if (isBefore(dueDate, today)) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    
    if (isBefore(dueDate, addDays(today, 7))) {
      return <Badge variant="secondary">Vence em breve</Badge>
    }
    
    return <Badge variant="outline">Pendente</Badge>
  }

  const filteredAccounts = accounts.filter(account => {
    if (filter === 'all') return true
    if (filter === 'paid') return account.status === 'paid'
    if (filter === 'pending') return account.status === 'pending'
    if (filter === 'overdue') {
      return account.status === 'pending' && isBefore(parseISO(account.due_date), new Date())
    }
    return true
  })

  const totalPending = accounts
    .filter(account => account.status === 'pending')
    .reduce((sum, account) => sum + Number(account.amount), 0)

  const totalOverdue = accounts
    .filter(account => account.status === 'pending' && isBefore(parseISO(account.due_date), new Date()))
    .reduce((sum, account) => sum + Number(account.amount), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contas a Pagar</h1>
        <Button onClick={() => setShowNewAccount(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
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

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Gestão de todas as obrigações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.description}</TableCell>
                  <TableCell>{account.suppliers?.name || 'Não informado'}</TableCell>
                  <TableCell>
                    R$ {Number(account.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(account.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{getStatusBadge(account)}</TableCell>
                  <TableCell>
                    {account.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => markAsPaid(account.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    )}
                    {account.status === 'paid' && account.paid_date && (
                      <span className="text-sm text-muted-foreground">
                        Pago em {format(parseISO(account.paid_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Nova Conta */}
      <Dialog open={showNewAccount} onOpenChange={setShowNewAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
            <DialogDescription>
              Registre uma nova obrigação financeira
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Fatura de energia elétrica"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase">Compra Relacionada</Label>
              <Select value={formData.purchase_id} onValueChange={(value) => setFormData({...formData, purchase_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a compra (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {purchases.map((purchase) => (
                    <SelectItem key={purchase.id} value={purchase.id}>
                      {format(new Date(purchase.purchase_date), 'dd/MM/yyyy', { locale: ptBR })} - 
                      {purchase.suppliers?.name} - 
                      R$ {purchase.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowNewAccount(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}