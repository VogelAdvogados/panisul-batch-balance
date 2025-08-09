import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewFinancialAccount = TablesInsert<'financial_accounts'>;

const createFinancialAccount = async (account: NewFinancialAccount) => {
  const { data, error } = await supabase
    .from('financial_accounts')
    .insert(account)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateFinancialAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFinancialAccount,
    onSuccess: () => {
      // Invalidate and refetch the accounts query to show the new account
      queryClient.invalidateQueries({ queryKey: ['financialAccounts'] });
    },
  });
};
