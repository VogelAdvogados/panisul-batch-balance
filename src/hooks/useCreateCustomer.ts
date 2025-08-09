import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewCustomer = TablesInsert<'customers'>;

const createCustomer = async (customer: NewCustomer) => {
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      // Invalidate and refetch the customers query to show the new customer
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
