import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SupplierInsert = { name: string; cnpj?: string | null; email?: string | null; phone?: string | null; address?: string | null }

const createSupplier = async (supplier: SupplierInsert) => {
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
  if (error) throw new Error(error.message)
  return data
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}
