import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewAccountPayable = TablesInsert<'accounts_payable'>;

const createAccountPayable = async (entry: NewAccountPayable) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .insert(entry)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateAccountPayable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccountPayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountsPayable'] });
    },
  });
};
