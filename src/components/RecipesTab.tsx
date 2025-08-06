import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChefHat, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  name: string;
  description: string;
  yield_quantity: number;
  yield_unit: string;
  created_at: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
  ingredient_name?: string;
  ingredient_unit?: string;
}

const RecipesTab = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    yield_quantity: "",
    yield_unit: ""
  });
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const { toast } = useToast();

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("name");
    
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar receitas",
        variant: "destructive"
      });
    } else {
      setRecipes(data || []);
    }
  };

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    
    if (!error) {
      setIngredients(data || []);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recipeIngredients.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um ingrediente à receita",
        variant: "destructive"
      });
      return;
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        name: formData.name,
        description: formData.description,
        yield_quantity: parseFloat(formData.yield_quantity),
        yield_unit: formData.yield_unit
      })
      .select()
      .single();

    if (recipeError) {
      toast({
        title: "Erro",
        description: "Erro ao criar receita",
        variant: "destructive"
      });
      return;
    }

    const ingredientsData = recipeIngredients.map(ing => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity
    }));

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsData);

    if (ingredientsError) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar ingredientes à receita",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Receita criada com sucesso"
      });
      setFormData({
        name: "",
        description: "",
        yield_quantity: "",
        yield_unit: ""
      });
      setRecipeIngredients([]);
      setShowForm(false);
      fetchRecipes();
    }
  };

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredient_id: "", quantity: 0 }]);
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          Receitas
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Receita
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Receita</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="yield_quantity">Rendimento</Label>
                  <Input
                    id="yield_quantity"
                    type="number"
                    step="0.01"
                    value={formData.yield_quantity}
                    onChange={(e) => setFormData({...formData, yield_quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="yield_unit">Unidade do Rendimento</Label>
                  <Input
                    id="yield_unit"
                    value={formData.yield_unit}
                    onChange={(e) => setFormData({...formData, yield_unit: e.target.value})}
                    placeholder="unidades, kg, etc"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Ingredientes</Label>
                  <Button type="button" onClick={addIngredient} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Ingrediente
                  </Button>
                </div>
                
                {recipeIngredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Select
                      value={ingredient.ingredient_id}
                      onValueChange={(value) => updateIngredient(index, "ingredient_id", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Quantidade"
                      className="w-32"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, "quantity", parseFloat(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit">Criar Receita</Button>
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
          <CardTitle>Lista de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell>{recipe.description}</TableCell>
                  <TableCell>{recipe.yield_quantity} {recipe.yield_unit}</TableCell>
                  <TableCell>{new Date(recipe.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecipesTab;