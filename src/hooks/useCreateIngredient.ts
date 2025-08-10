import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';
import { Ingredient } from '@/types';

type NewIngredient = Omit<Ingredient, 'id'>;

const createIngredient = async (ingredient: NewIngredient) => {
  const { data, error } = await supabase
    .from('ingredients')
    .insert(ingredient as TablesInsert<'ingredients'>)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
};
