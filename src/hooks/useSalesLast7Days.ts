import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesLast7Days } from '@/integrations/supabase/types';

const fetchSalesLast7Days = async (): Promise<SalesLast7Days[]> => {
  const { data, error } = await supabase.rpc('get_sales_last_7_days');

  if (error) {
    throw new Error(`Error fetching sales chart data: ${error.message}`);
  }

  return data;
};

export const useSalesLast7Days = () => {
  return useQuery<SalesLast7Days[], Error>({
    queryKey: ['salesLast7Days'],
    queryFn: fetchSalesLast7Days,
  });
};
