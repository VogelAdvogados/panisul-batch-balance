import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Customer = Tables<'customers'>;

const fetchCustomers = async (searchTerm?: string): Promise<Customer[]> => {
  let query = supabase
    .from('customers')
    .select('*')
    .order('name');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useCustomers = (searchTerm?: string) => {
  return useQuery<Customer[], Error>({
    queryKey: ['customers', searchTerm],
    queryFn: () => fetchCustomers(searchTerm),
  });
};
