import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RecipeWithIngredients } from '@/integrations/supabase/types';

const fetchRecipes = async (searchTerm?: string): Promise<RecipeWithIngredients[]> => {
  let query = supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (
        quantity,
        ingredients (
          id,
          name,
          unit,
          cost_per_unit
        )
      )
    `)
    .order('name');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useRecipes = (searchTerm?: string) => {
  return useQuery<RecipeWithIngredients[], Error>({
    queryKey: ['recipes', searchTerm],
    queryFn: () => fetchRecipes(searchTerm),
  });
};
