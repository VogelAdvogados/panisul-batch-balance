import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomerDetails } from '@/integrations/supabase/types';

const fetchCustomer = async (customerId: string): Promise<CustomerDetails | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      sales (
        *,
        sale_items (
          *,
          recipes ( name )
        )
      ),
      accounts_receivable ( * )
    `)
    .eq('id', customerId)
    .order('sale_date', { referencedTable: 'sales', ascending: false })
    .order('due_date', { referencedTable: 'accounts_receivable', ascending: true })
    .single();

  if (error) {
    // .single() throws an error if no row is found, or more than one is found.
    // We can check the error code to see if it's just a "not found" error.
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};

export const useCustomer = (customerId: string | undefined) => {
  return useQuery<CustomerDetails | null, Error>({
    queryKey: ['customer', customerId],
    queryFn: () => {
      if (!customerId) {
        return Promise.resolve(null);
      }
      return fetchCustomer(customerId);
    },
    enabled: !!customerId, // The query will not run until the customerId is available
  });
};
