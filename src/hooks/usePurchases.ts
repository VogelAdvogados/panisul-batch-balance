import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Supplier { id: string; name: string }
export interface Purchase {
  id: string
  supplier_id?: string
  purchase_date: string
  total_amount: number
  status: string
  nfe_number?: string
  notes?: string
  suppliers?: Supplier
}

const fetchPurchases = async (): Promise<Purchase[]> => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`*, suppliers (*)`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export const usePurchases = () => {
  return useQuery<Purchase[], Error>({ queryKey: ['purchases'], queryFn: fetchPurchases })
}
