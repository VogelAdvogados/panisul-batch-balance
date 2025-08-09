import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TopProduct } from '@/integrations/supabase/types';

const fetchTopProducts = async (limit: number): Promise<TopProduct[]> => {
  const { data, error } = await supabase.rpc('get_top_selling_products', {
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Error fetching top products: ${error.message}`);
  }

  return data;
};

export const useTopProducts = (limit: number) => {
  return useQuery<TopProduct[], Error>({
    queryKey: ['topProducts', limit],
    queryFn: () => fetchTopProducts(limit),
  });
};
