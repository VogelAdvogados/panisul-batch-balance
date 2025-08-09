import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesUpdate } from '@/integrations/supabase/types';

interface UpdateParams {
  id: string;
  customerId?: string;
  updates: TablesUpdate<'accounts_receivable'>;
}

const updateAccountReceivable = async ({ id, updates }: UpdateParams) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useUpdateAccountReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccountReceivable,
    onSuccess: (data, variables) => {
      // Invalidate the specific customer's data to refetch
      // We get the customerId from the variables passed to the mutation
      if (variables.customerId) {
        queryClient.invalidateQueries({ queryKey: ['customer', variables.customerId] });
      } else {
        // As a fallback, refetch all customers data if id is not available
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }
    },
  });
};
