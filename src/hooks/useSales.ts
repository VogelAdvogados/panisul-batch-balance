import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SaleWithCustomer } from '@/integrations/supabase/types';

const fetchSales = async (): Promise<SaleWithCustomer[]> => {
  const { data, error } = await supabase.from('sales').select(`
    *,
    customers (*)
  `).order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useSales = () => {
  return useQuery<SaleWithCustomer[], Error>({
    queryKey: ['sales'],
    queryFn: fetchSales,
  });
};
