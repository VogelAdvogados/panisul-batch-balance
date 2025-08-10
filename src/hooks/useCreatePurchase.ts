import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert, Tables, PurchaseWithSupplier } from '@/integrations/supabase/types';

// Use TablesInsert for type safety from auto-generated types
type NewPurchase = TablesInsert<'purchases'>;
type NewPurchaseItem = TablesInsert<'purchase_items'>;

// Define the shape of the parameters for the mutation function
interface CreatePurchaseParams {
  purchaseData: NewPurchase;
  // Items will not have a purchase_id when passed from the form
  itemsData: Omit<NewPurchaseItem, 'purchase_id'>[];
}

const createPurchase = async ({ purchaseData, itemsData }: CreatePurchaseParams) => {
  // Step 1: Insert the main purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert(purchaseData)
    .select()
    .single();

  if (purchaseError) {
    throw new Error(`Failed to create purchase: ${purchaseError.message}`);
  }

  if (!purchase) {
    throw new Error("Purchase creation did not return a result.");
  }

  // Step 2: Prepare and insert the associated purchase items
  const itemsToInsert = itemsData.map(item => ({
    ...item,
    purchase_id: purchase.id,
  }));

  const { error: itemsError } = await supabase
    .from('purchase_items')
    .insert(itemsToInsert);

  if (itemsError) {
    // IMPORTANT: This is not transactional. If this step fails, the purchase
    // record will still exist in the database without any items.
    // A better solution would be to wrap this logic in a Supabase database function (RPC).
    // For now, we proceed with the original logic but throw an error.
    throw new Error(`Failed to insert purchase items: ${itemsError.message}`);
  }

  return purchase;
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation<Tables<'purchases'>, Error, CreatePurchaseParams, { previousPurchases: PurchaseWithSupplier[] | undefined }>({
    mutationFn: createPurchase,
    onMutate: async ({ purchaseData }) => {
      await queryClient.cancelQueries({ queryKey: ['purchases'] });
      const previousPurchases = queryClient.getQueryData<PurchaseWithSupplier[]>(['purchases']);

      const optimisticPurchase: PurchaseWithSupplier = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        suppliers: null,
        ...purchaseData,
      } as PurchaseWithSupplier;

      queryClient.setQueryData<PurchaseWithSupplier[]>(['purchases'], old =>
        old ? [optimisticPurchase, ...old] : [optimisticPurchase]
      );

      return { previousPurchases };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPurchases) {
        queryClient.setQueryData(['purchases'], context.previousPurchases);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};
