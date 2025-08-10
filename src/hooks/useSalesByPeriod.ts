import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesLast7Days as SalesByPeriodData } from '@/integrations/supabase/types'; // Alias for clarity

export type SalesPeriod = '7d' | '30d' | 'this_month';

const fetchSalesByPeriod = async (period: SalesPeriod): Promise<SalesByPeriodData[]> => {
  const { data, error } = await (supabase.rpc as any)('get_sales_by_period', {
    p_period: period,
  });

  if (error) {
    throw new Error(`Error fetching sales chart data: ${error.message}`);
  }

  return data as SalesByPeriodData[];
};

export const useSalesByPeriod = (period: SalesPeriod) => {
  return useQuery<SalesByPeriodData[], Error>({
    queryKey: ['salesByPeriod', period],
    queryFn: () => fetchSalesByPeriod(period),
  });
};
