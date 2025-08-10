import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCustomer } from '@/hooks/useCustomer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare, Edit, Plus, Trash, CheckCircle2, Loader2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { useUpdateAccountReceivable } from '@/hooks/useUpdateAccountReceivable';
import { useDeleteAccountReceivable } from '@/hooks/useDeleteAccountReceivable';
import { useCreateAccountReceivable } from '@/hooks/useCreateAccountReceivable';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TablesInsert } from '@/integrations/supabase/types';
import { useAccountsReceivableLogs } from '@/hooks/useAccountsReceivableLogs';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError, error } = useCustomer(id);
  const { toast } = useToast();

  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<TablesInsert<'accounts_receivable'>, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>({
    description: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  const updateAccountReceivableMutation = useUpdateAccountReceivable();
  const deleteAccountReceivableMutation = useDeleteAccountReceivable();
  const createAccountReceivableMutation = useCreateAccountReceivable();

  const [historyAccountId, setHistoryAccountId] = useState<string | null>(null);
  const { data: historyLogs, isLoading: isLoadingHistory } = useAccountsReceivableLogs(historyAccountId ?? undefined);

  const cleanPhone = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
  const hasWhatsApp = cleanPhone.length >= 10;

  const handleMarkAsPaid = (entryId: string) => {
    const method = window.prompt(
      'Informe a forma de pagamento (ex: pix, dinheiro)',
      '',
    );
    if (!method) return;
    updateAccountReceivableMutation.mutate({
      id: entryId,
      customerId: id,
      updates: { status: 'paid', received_date: new Date().toISOString(), actual_payment_method: method }
    }, {
      onSuccess: () => toast({ title: 'Sucesso', description: 'Lançamento marcado como pago.' }),
      onError: (e) => toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    });
  };

  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      deleteAccountReceivableMutation.mutate({ id: entryId, customerId: id }, {
        onSuccess: () => toast({ title: 'Sucesso', description: 'Lançamento excluído.' }),
        onError: (e) => toast({ title: 'Erro', description: e.message, variant: 'destructive' })
      });
    }
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    createAccountReceivableMutation.mutate({ ...newEntry, customer_id: id }, {
      onSuccess: () => {
        toast({ title: 'Sucesso', description: 'Novo lançamento adicionado.' });
        setShowNewEntryDialog(false);
        setNewEntry({ description: '', amount: 0, due_date: new Date().toISOString().split('T')[0], status: 'pending' });
      },
      onError: (e) => toast({ title: 'Erro', description: e.message, variant: 'destructive' })
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Pendente</Badge>;
      case 'paid': return <Badge className="bg-green-600 text-white hover:bg-green-700">Pago</Badge>;
      case 'overdue': return <Badge variant="destructive">Vencido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="container mx-auto py-6"><Skeleton className="h-64 w-full" /></div>;
  if (isError) return <div className="container mx-auto py-6 text-red-500">Erro ao carregar cliente: {error.message}</div>;
  if (!customer) return <div className="container mx-auto py-6">Cliente não encontrado.</div>;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Link to="/clientes" className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" />Voltar</Link>

      <Card><CardHeader className="flex flex-row justify-between items-start"><div><CardTitle className="text-3xl">{customer.name}</CardTitle><CardDescription>ID: {customer.id}</CardDescription></div><div className="flex gap-2">{hasWhatsApp && (<Button asChild variant="outline" size="icon"><a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" title="Chamar no WhatsApp"><MessageSquare className="h-5 w-5 text-green-500" /></a></Button>)}<Button variant="outline" size="icon"><Edit className="h-5 w-5" /></Button></div></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{customer.email || 'N/A'}</span></div><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{customer.phone || 'N/A'}</span></div><div className="flex items-center gap-2 md:col-span-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{customer.address || 'N/A'}</span></div></CardContent></Card>

      <Tabs defaultValue="purchases">
        <TabsList><TabsTrigger value="purchases">Histórico de Compras ({customer.sales.length})</TabsTrigger><TabsTrigger value="financial">Financeiro ({customer.accounts_receivable.length})</TabsTrigger></TabsList>
        <TabsContent value="purchases"><Card><CardHeader><CardTitle>Histórico de Compras</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Itens</TableHead><TableHead>Total (R$)</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{customer.sales.map(sale => (<TableRow key={sale.id}><TableCell>{format(parseISO(sale.sale_date), 'dd/MM/yyyy')}</TableCell><TableCell>{sale.sale_items.map(item => `${item.quantity}x ${item.recipes?.name || 'N/A'}`).join(', ')}</TableCell><TableCell>{sale.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell><TableCell><Badge>{sale.status}</Badge></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></TabsContent>
        <TabsContent value="financial">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Histórico Financeiro</CardTitle>
              <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Adicionar Lançamento</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Lançamento Financeiro</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreateEntry} className="space-y-4 py-4">
                    <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={newEntry.description} onChange={(e) => setNewEntry({...newEntry, description: e.target.value})} required /></div>
                    <div className="space-y-2"><Label htmlFor="amount">Valor</Label><Input id="amount" type="number" step="0.01" value={newEntry.amount} onChange={(e) => setNewEntry({...newEntry, amount: Number(e.target.value)})} required /></div>
                    <div className="space-y-2"><Label htmlFor="due_date">Data de Vencimento</Label><Input id="due_date" type="date" value={newEntry.due_date} onChange={(e) => setNewEntry({...newEntry, due_date: e.target.value})} required /></div>
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit" disabled={createAccountReceivableMutation.isPending}>{createAccountReceivableMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor (R$)</TableHead><TableHead>Status</TableHead><TableHead>Data Pagamento</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {customer.accounts_receivable.map(ar => (
                    <TableRow key={ar.id}>
                      <TableCell>{ar.description}</TableCell>
                      <TableCell>{format(parseISO(ar.due_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{ar.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell>{getStatusBadge(ar.status)}</TableCell>
                      <TableCell>{ar.received_date ? format(parseISO(ar.received_date), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setHistoryAccountId(ar.id)}>
                          <History className="h-4 w-4" />
                        </Button>
                        {ar.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(ar.id)}
                            disabled={
                              updateAccountReceivableMutation.isPending &&
                              updateAccountReceivableMutation.variables?.id === ar.id
                            }
                          >
                            {updateAccountReceivableMutation.isPending &&
                            updateAccountReceivableMutation.variables?.id === ar.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEntry(ar.id)}
                          disabled={
                            deleteAccountReceivableMutation.isPending &&
                            deleteAccountReceivableMutation.variables?.id === ar.id
                          }
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={!!historyAccountId} onOpenChange={(open) => !open && setHistoryAccountId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Histórico da Conta</DialogTitle>
          </DialogHeader>
          {isLoadingHistory ? (
            <p>Carregando...</p>
          ) : historyLogs && historyLogs.length > 0 ? (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {historyLogs.map((log) => (
                <li key={log.changed_at} className="text-sm">
                  {format(parseISO(log.changed_at), 'dd/MM/yyyy HH:mm')} –
                  {log.old_status !== log.new_status && (
                    <span>
                      Status: {log.old_status || '-'} → {log.new_status || '-'}
                      {log.old_method !== log.new_method ? '; ' : ''}
                    </span>
                  )}
                  {log.old_method !== log.new_method && (
                    <span>
                      Método: {log.old_method || '-'} → {log.new_method || '-'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum histórico.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDetailPage;
