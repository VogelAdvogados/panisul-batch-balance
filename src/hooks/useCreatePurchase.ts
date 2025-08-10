import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PurchaseInsert = {
  supplier_id?: string
  purchase_date?: string
  total_amount?: number
  status?: string
  nfe_number?: string | null
  notes?: string | null
}

export type PurchaseItemInsert = {
  ingredient_id: string
  quantity: number
  unit_price: number
  total_price: number
  purchase_id?: string
}

interface CreatePurchaseParams {
  purchaseData: PurchaseInsert
  itemsData: Omit<PurchaseItemInsert, 'purchase_id'>[]
}

const createPurchase = async ({ purchaseData, itemsData }: CreatePurchaseParams) => {
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single()

  if (purchaseError) throw new Error(`Failed to create purchase: ${purchaseError.message}`)
  if (!purchase) throw new Error('Purchase creation did not return a result.')

  const itemsToInsert = itemsData.map((item) => ({ ...item, purchase_id: purchase.id }))
  if (itemsToInsert.length) {
    const { error: itemsError } = await supabase.from('purchase_items').insert(itemsToInsert)
    if (itemsError) throw new Error(`Failed to insert purchase items: ${itemsError.message}`)
  }

  return purchase
}

export const useCreatePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['ingredients'] })
    },
  })
}
