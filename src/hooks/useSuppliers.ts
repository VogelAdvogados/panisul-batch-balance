import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Supplier { id: string; name: string; cnpj?: string; email?: string; phone?: string; address?: string }

const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw new Error(error.message)
  return data || []
}

export const useSuppliers = () => {
  return useQuery<Supplier[], Error>({ queryKey: ['suppliers'], queryFn: fetchSuppliers })
}
