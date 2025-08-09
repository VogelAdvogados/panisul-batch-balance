import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
}

const IngredientsTab = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    current_stock: "",
    min_stock: "",
    cost_per_unit: ""
  });
  const { toast } = useToast();

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar ingredientes",
        variant: "destructive"
      });
    } else {
      setIngredients(data || []);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("ingredients")
      .insert({
        name: formData.name,
        unit: formData.unit,
        current_stock: parseFloat(formData.current_stock),
        min_stock: parseFloat(formData.min_stock),
        cost_per_unit: parseFloat(formData.cost_per_unit) || 0
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar ingrediente",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Ingrediente adicionado com sucesso"
      });
      setFormData({
        name: "",
        unit: "",
        current_stock: "",
        min_stock: "",
        cost_per_unit: ""
      });
      setShowForm(false);
      fetchIngredients();
    }
  };

  const addStock = async (ingredientId: string, quantity: number) => {
    const { error } = await supabase
      .from("stock_movements")
      .insert({
        ingredient_id: ingredientId,
        movement_type: "entrada",
        quantity: quantity,
        reason: "Entrada manual"
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar estoque",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Estoque atualizado"
      });
      fetchIngredients();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6" />
          Controle de Ingredientes
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ingrediente
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Ingrediente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Ingrediente</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unidade</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="kg, g, L, ml, unidade"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="current_stock">Estoque Atual</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    step="0.01"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock">Estoque Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    step="0.01"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cost_per_unit">Custo por Unidade (R$)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Atualizado automaticamente por compras confirmadas (custo médio).</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Adicionar</Button>
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
          <CardTitle>Lista de Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Custo/Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{ingredient.current_stock}</TableCell>
                  <TableCell>{ingredient.min_stock}</TableCell>
                  <TableCell>R$ {ingredient.cost_per_unit.toFixed(2)}</TableCell>
                  <TableCell>
                    {ingredient.current_stock <= ingredient.min_stock ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Baixo
                      </div>
                    ) : (
                      <span className="text-green-600">Normal</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => {
                        const quantity = prompt("Quantidade a adicionar:");
                        if (quantity) {
                          addStock(ingredient.id, parseFloat(quantity));
                        }
                      }}
                    >
                      + Estoque
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default IngredientsTab;