import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewAccountReceivable = TablesInsert<'accounts_receivable'>;

const createAccountReceivable = async (entry: NewAccountReceivable) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert(entry)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateAccountReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccountReceivable,
    onSuccess: (data) => {
      // Invalidate the specific customer's data to refetch
      queryClient.invalidateQueries({ queryKey: ['customer', data.customer_id] });
    },
  });
};
