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
import { format, parseISO, isBefore, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Customer {
  id: string
  name: string
}

interface Sale {
  id: string
  customer_id?: string
  sale_date: string
  total_amount: number
  customers?: Customer
}

interface AccountReceivable {
  id: string
  sale_id?: string
  customer_id?: string
  description: string
  amount: number
  due_date: string
  status: string
  received_date?: string
  customers?: Customer
  sales?: Sale
}

export default function AccountsReceivablePage() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<AccountReceivable[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'received'>('all')
  
  const [formData, setFormData] = useState({
    customer_id: '',
    sale_id: '',
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [accountsResult, customersResult, salesResult] = await Promise.all([
        supabase.from('accounts_receivable').select(`
          *,
          customers (*),
          sales (*, customers (*))
        `).order('due_date', { ascending: true }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('sales').select(`
          *,
          customers (*)
        `).order('created_at', { ascending: false })
      ])

      setAccounts(accountsResult.data || [])
      setCustomers(customersResult.data || [])
      setSales(salesResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a receber",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .insert([{
          ...formData,
          status: 'pending'
        }])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conta a receber registrada com sucesso",
      })

      setFormData({
        customer_id: '',
        sale_id: '',
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
        description: "Erro ao registrar conta a receber",
        variant: "destructive",
      })
    }
  }

  const markAsReceived = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({ 
          status: 'received',
          received_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', accountId)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Conta marcada como recebida",
      })
      fetchData()
    } catch (error) {
      console.error('Erro ao marcar como recebida:', error)
      toast({
        title: "Erro",
        description: "Erro ao marcar conta como recebida",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (account: AccountReceivable) => {
    if (account.status === 'received') {
      return <Badge variant="default">Recebido</Badge>
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
    if (filter === 'received') return account.status === 'received'
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
        <h1 className="text-3xl font-bold">Contas a Receber</h1>
        <Button onClick={() => setShowNewAccount(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
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
            <div className="text-2xl font-bold text-red-600">
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
                <SelectItem value="received">Recebidas</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber</CardTitle>
          <CardDescription>
            Gestão de todos os valores a receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Cliente</TableHead>
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
                  <TableCell>{account.customers?.name || 'Não informado'}</TableCell>
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
                        onClick={() => markAsReceived(account.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Receber
                      </Button>
                    )}
                    {account.status === 'received' && account.received_date && (
                      <span className="text-sm text-muted-foreground">
                        Recebido em {format(parseISO(account.received_date), 'dd/MM/yyyy', { locale: ptBR })}
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
            <DialogTitle>Nova Conta a Receber</DialogTitle>
            <DialogDescription>
              Registre um novo valor a receber
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Venda a prazo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
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