import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RecipeWithIngredients } from '@/integrations/supabase/types';

const fetchRecipes = async (): Promise<RecipeWithIngredients[]> => {
  const { data, error } = await supabase
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

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useRecipes = () => {
  return useQuery<RecipeWithIngredients[], Error>({
    queryKey: ['recipes'],
    queryFn: fetchRecipes,
  });
};
