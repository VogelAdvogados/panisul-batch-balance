import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesUpdate } from '@/integrations/supabase/types';

interface UpdateParams {
  id: string;
  customerId?: string;
  updates: TablesUpdate<'accounts_receivable'>;
  notes?: string;
  userId?: string;
}

const updateAccountReceivable = async ({ id, updates, notes, userId }: UpdateParams) => {
  // Fetch current due date before updating
  const { data: current, error: fetchError } = await supabase
    .from('accounts_receivable')
    .select('due_date')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Insert log if due_date is being changed
  if (updates.due_date && current?.due_date) {
    const { error: logError } = await supabase
      .from('accounts_receivable_logs')
      .insert({
        account_id: id,
        old_due_date: current.due_date,
        new_due_date: updates.due_date,
        notes: notes || null,
        user_id: userId || null,
      });

    if (logError) {
      throw new Error(logError.message);
    }
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
