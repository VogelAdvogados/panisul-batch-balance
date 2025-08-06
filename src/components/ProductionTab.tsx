import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Factory } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  name: string;
  yield_quantity: number;
  yield_unit: string;
}

interface Production {
  id: string;
  recipe_id: string;
  quantity_produced: number;
  production_date: string;
  notes: string;
  created_at: string;
  recipes?: Recipe;
}

const ProductionTab = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    recipe_id: "",
    quantity_produced: "",
    production_date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const { toast } = useToast();

  const fetchProductions = async () => {
    const { data, error } = await supabase
      .from("productions")
      .select(`
        *,
        recipes (
          id,
          name,
          yield_quantity,
          yield_unit
        )
      `)
      .order("production_date", { ascending: false });
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar produções",
        variant: "destructive"
      });
    } else {
      setProductions(data || []);
    }
  };

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("name");
    
    if (!error) {
      setRecipes(data || []);
    }
  };

  useEffect(() => {
    fetchProductions();
    fetchRecipes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("productions")
      .insert({
        recipe_id: formData.recipe_id,
        quantity_produced: parseFloat(formData.quantity_produced),
        production_date: formData.production_date,
        notes: formData.notes
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao registrar produção",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Produção registrada! Estoque atualizado automaticamente."
      });
      setFormData({
        recipe_id: "",
        quantity_produced: "",
        production_date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      setShowForm(false);
      fetchProductions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Factory className="h-6 w-6" />
          Controle de Produção
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Produção
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Nova Produção</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipe_id">Receita</Label>
                  <Select
                    value={formData.recipe_id}
                    onValueChange={(value) => setFormData({...formData, recipe_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma receita" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} (Rende: {recipe.yield_quantity} {recipe.yield_unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity_produced">Quantidade Produzida</Label>
                  <Input
                    id="quantity_produced"
                    type="number"
                    step="0.01"
                    value={formData.quantity_produced}
                    onChange={(e) => setFormData({...formData, quantity_produced: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="production_date">Data de Produção</Label>
                  <Input
                    id="production_date"
                    type="date"
                    value={formData.production_date}
                    onChange={(e) => setFormData({...formData, production_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Observações sobre a produção..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Registrar Produção</Button>
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
          <CardTitle>Histórico de Produções</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Registrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productions.map((production) => (
                <TableRow key={production.id}>
                  <TableCell>{new Date(production.production_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">
                    {production.recipes?.name || 'Receita não encontrada'}
                  </TableCell>
                  <TableCell>
                    {production.quantity_produced} {production.recipes?.yield_unit || ''}
                  </TableCell>
                  <TableCell>{production.notes}</TableCell>
                  <TableCell>{new Date(production.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionTab;