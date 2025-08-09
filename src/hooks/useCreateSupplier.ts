import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewSupplier = TablesInsert<'suppliers'>;

const createSupplier = async (supplier: NewSupplier) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      // Invalidate and refetch the suppliers query
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
};
