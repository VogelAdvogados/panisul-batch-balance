import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseWithSupplier } from '@/integrations/supabase/types';

const fetchPurchases = async (): Promise<PurchaseWithSupplier[]> => {
  const { data, error } = await supabase.from('purchases').select(`
    *,
    suppliers (*)
  `).order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const usePurchases = () => {
  return useQuery<PurchaseWithSupplier[], Error>({
    queryKey: ['purchases'],
    queryFn: fetchPurchases,
  });
};
