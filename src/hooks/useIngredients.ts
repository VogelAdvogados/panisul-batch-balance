import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ingredient } from '@/types';

const fetchIngredients = async (): Promise<Ingredient[]> => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(error.message);
  }

  return (data as Ingredient[]) || [];
};

export const useIngredients = () => {
  return useQuery<Ingredient[], Error>({
    queryKey: ['ingredients'],
    queryFn: fetchIngredients,
  });
};
