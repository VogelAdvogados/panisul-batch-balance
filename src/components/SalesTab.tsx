import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ShoppingCart, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
}

interface Recipe {
  id: string;
  name: string;
  yield_unit: string;
}

interface Sale {
  id: string;
  customer_id: string;
  sale_date: string;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
  customers?: Customer;
}

interface SaleItem {
  recipe_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  recipe_name?: string;
}

const SalesTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    sale_date: new Date().toISOString().split('T')[0],
    status: "concluida",
    notes: ""
  });
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const { toast } = useToast();

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        customers (
          id,
          name
        )
      `)
      .order("sale_date", { ascending: false });
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar vendas",
        variant: "destructive"
      });
    } else {
      setSales(data || []);
    }
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name")
      .order("name");
    
    if (!error) {
      setCustomers(data || []);
    }
  };

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, name, yield_unit")
      .order("name");
    
    if (!error) {
      setRecipes(data || []);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchRecipes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda",
        variant: "destructive"
      });
      return;
    }

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total_price, 0);

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        customer_id: formData.customer_id || null,
        sale_date: formData.sale_date,
        total_amount: totalAmount,
        status: formData.status,
        notes: formData.notes
      })
      .select()
      .single();

    if (saleError) {
      toast({
        title: "Erro",
        description: "Erro ao criar venda",
        variant: "destructive"
      });
      return;
    }

    const itemsData = saleItems.map(item => ({
      sale_id: sale.id,
      recipe_id: item.recipe_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(itemsData);

    if (itemsError) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar itens da venda",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Venda registrada! Estoque atualizado automaticamente."
      });
      setFormData({
        customer_id: "",
        sale_date: new Date().toISOString().split('T')[0],
        status: "concluida",
        notes: ""
      });
      setSaleItems([]);
      setShowForm(false);
      fetchSales();
    }
  };

  const addItem = () => {
    setSaleItems([...saleItems, { recipe_id: "", quantity: 0, unit_price: 0, total_price: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalcular total_price se quantidade ou preço unitário mudou
    if (field === "quantity" || field === "unit_price") {
      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    }
    
    setSaleItems(updated);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const totalSale = saleItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          Vendas
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nova Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="customer_id">Cliente (Opcional)</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({...formData, customer_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
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
                <div>
                  <Label htmlFor="sale_date">Data da Venda</Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Itens da Venda</Label>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                
                {saleItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-end">
                    <div className="flex-1">
                      <Label>Produto</Label>
                      <Select
                        value={item.recipe_id}
                        onValueChange={(value) => updateItem(index, "recipe_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {recipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id}>
                              {recipe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label>Qtd</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-24">
                      <Label>Preço Un.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-24">
                      <Label>Total</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.total_price.toFixed(2)}
                        disabled
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {saleItems.length > 0 && (
                  <div className="text-right mt-2">
                    <strong>Total da Venda: R$ {totalSale.toFixed(2)}</strong>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações sobre a venda..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Registrar Venda</Button>
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
          <CardTitle>Histórico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Registrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{new Date(sale.sale_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{sale.customers?.name || "Cliente avulso"}</TableCell>
                  <TableCell className="font-medium">R$ {sale.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      sale.status === 'concluida' ? 'bg-green-100 text-green-800' :
                      sale.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell>{sale.notes}</TableCell>
                  <TableCell>{new Date(sale.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesTab;