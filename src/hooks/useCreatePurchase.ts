import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

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
  const { data, error } = await supabase.rpc('create_purchase_with_items', {
    purchase_data: purchaseData,
    items_data: itemsData,
  }).single();

  if (error) {
    // The RPC function handles the transaction, so if there's an error,
    // nothing should be committed to the database.
    throw new Error(`Failed to create purchase transactionally: ${error.message}`);
  }

  return data;
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      // When the mutation is successful, invalidate the 'purchases' query cache.
      // This will trigger a refetch of the purchases list and update the UI.
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
    // onError can be handled here if needed, e.g., for logging or showing a generic error message.
  });
};
