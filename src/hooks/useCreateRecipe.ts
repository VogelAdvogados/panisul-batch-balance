import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewRecipe = TablesInsert<'recipes'>;
type NewRecipeIngredient = Omit<TablesInsert<'recipe_ingredients'>, 'recipe_id'>;

interface CreateRecipeParams {
  recipeData: NewRecipe;
  ingredientsData: NewRecipeIngredient[];
}

const createRecipe = async ({ recipeData, ingredientsData }: CreateRecipeParams) => {
  // Step 1: Insert the main recipe record
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert(recipeData)
    .select()
    .single();

  if (recipeError) {
    throw new Error(`Failed to create recipe: ${recipeError.message}`);
  }

  if (!recipe) {
    throw new Error("Recipe creation did not return a result.");
  }

  // Step 2: Prepare and insert the associated recipe ingredients
  const itemsToInsert = ingredientsData.map(item => ({
    ...item,
    recipe_id: recipe.id,
  }));

  const { error: itemsError } = await supabase
    .from('recipe_ingredients')
    .insert(itemsToInsert);

  if (itemsError) {
    // This is not transactional. If this fails, the recipe will still exist.
    throw new Error(`Failed to insert recipe ingredients: ${itemsError.message}`);
  }

  return recipe;
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      // Invalidate and refetch the recipes query to show the new recipe
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
};
