import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductionWithRecipe } from '@/integrations/supabase/types';

const fetchProductions = async (): Promise<ProductionWithRecipe[]> => {
  const { data, error } = await supabase
    .from('productions')
    .select(`
      *,
      recipes (
        name,
        yield_unit
      )
    `)
    .order('production_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useProductions = () => {
  return useQuery<ProductionWithRecipe[], Error>({
    queryKey: ['productions'],
    queryFn: fetchProductions,
  });
};
