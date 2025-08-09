import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewProduction = TablesInsert<'productions'>;

const createProduction = async (production: NewProduction) => {
  const { data, error } = await supabase
    .from('productions')
    .insert(production)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateProduction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduction,
    onSuccess: () => {
      // Invalidate and refetch the productions query to show the new entry
      queryClient.invalidateQueries({ queryKey: ['productions'] });
      // Also invalidate ingredients, as their stock will have changed
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
};
