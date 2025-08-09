import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TopCustomer } from '@/integrations/supabase/types';

const fetchTopCustomers = async (limit: number): Promise<TopCustomer[]> => {
  const { data, error } = await supabase.rpc('get_top_customers', {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Error fetching top customers: ${error.message}`);
  }

  return data;
};

export const useTopCustomers = (limit: number) => {
  return useQuery<TopCustomer[], Error>({
    queryKey: ['topCustomers', limit],
    queryFn: () => fetchTopCustomers(limit),
  });
};
