import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Loader2, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomers } from "@/hooks/useCustomers";
import { useCreateCustomer } from "@/hooks/useCreateCustomer";
import { TablesInsert } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";

const CustomersTab = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TablesInsert<'customers'>>({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { toast } = useToast();
  const { data: customers, isLoading, isError, error } = useCustomers(debouncedSearchTerm);
  const createCustomerMutation = useCreateCustomer();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCustomerMutation.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Cliente adicionado com sucesso!" });
        setFormData({ name: "", email: "", phone: "", address: "" });
        setShowForm(false);
      },
      onError: (error) => {
        toast({ title: "Erro", description: `Erro ao adicionar cliente: ${error.message}`, variant: "destructive" });
      }
    });
  };

  const renderTableContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ));
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-red-500">
            Erro ao carregar clientes: {error.message}
          </TableCell>
        </TableRow>
      );
    }
    
    if (customers?.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum cliente encontrado.
                </TableCell>
            </TableRow>
        )
    }

    return customers?.map((customer) => {
      const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
      const hasWhatsApp = cleanPhone.length >= 10; // Basic check for a valid phone number

      return (
        <TableRow key={customer.id} className="hover:bg-muted/50">
          <TableCell className="font-medium">
            <Link to={`/clientes/${customer.id}`} className="hover:underline">
              {customer.name}
            </Link>
          </TableCell>
          <TableCell>{customer.email || "-"}</TableCell>
          <TableCell>{customer.phone || "-"}</TableCell>
          <TableCell>{new Date(customer.created_at).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell>
            {hasWhatsApp && (
              <Button asChild variant="ghost" size="icon">
                <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noopener noreferrer" title="Chamar no WhatsApp">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                </a>
              </Button>
            )}
          </TableCell>
        </TableRow>
      )
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Clientes
          {!isLoading && <span className="text-sm font-normal text-muted-foreground">({customers?.length || 0})</span>}
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Cliente</CardTitle>
            <CardDescription>Preencha os dados para cadastrar um novo cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea id="address" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Endereço completo do cliente..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Adicionar Cliente
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cadastrado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableContent()}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersTab;