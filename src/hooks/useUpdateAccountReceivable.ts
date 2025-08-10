import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesUpdate } from '@/integrations/supabase/types';

interface UpdateParams {
  id: string;
  customerId?: string;
  userId?: string;
  updates: TablesUpdate<'accounts_receivable'> & { payment_method?: string };
}

const updateAccountReceivable = async ({ id, updates, userId }: UpdateParams) => {
  const { data: current, error: fetchError } = await supabase
    .from('accounts_receivable')
    .select('status, payment_method')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const { data, error } = await supabase
    .from('accounts_receivable')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const statusChanged =
    updates.status !== undefined && updates.status !== current?.status;
  const methodChanged =
    updates.payment_method !== undefined &&
    updates.payment_method !== current?.payment_method;

  if (statusChanged || methodChanged) {
    const { error: logError } = await supabase
      .from('accounts_receivable_logs')
      .insert({
        account_id: id,
        old_status: statusChanged ? current?.status : null,
        new_status: statusChanged ? updates.status : null,
        old_method: methodChanged ? current?.payment_method : null,
        new_method: methodChanged ? updates.payment_method : null,
        user_id: userId || null,
      });

    if (logError) {
      throw new Error(logError.message);
    }
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
