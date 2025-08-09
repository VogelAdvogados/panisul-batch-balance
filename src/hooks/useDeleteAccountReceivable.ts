import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeleteParams {
  id: string;
  customerId?: string;
}

const deleteAccountReceivable = async ({ id }: DeleteParams) => {
  const { error } = await supabase
    .from('accounts_receivable')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useDeleteAccountReceivable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccountReceivable,
    onSuccess: (data, variables) => {
      if (variables.customerId) {
        queryClient.invalidateQueries({ queryKey: ['customer', variables.customerId] });
      }
    },
  });
};
