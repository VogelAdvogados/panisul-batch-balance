import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewSale = Omit<TablesInsert<'sales'>, 'total_amount'>;
type NewSaleItem = Omit<TablesInsert<'sale_items'>, 'sale_id'>;

interface CreateSaleParams {
  saleData: NewSale;
  itemsData: NewSaleItem[];
}

const createSale = async ({ saleData, itemsData }: CreateSaleParams) => {
  const total_amount = itemsData.reduce((sum, item) => sum + (item.total_price || 0), 0);

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({ ...saleData, total_amount })
    .select()
    .single();

  if (saleError) {
    throw new Error(`Failed to create sale: ${saleError.message}`);
  }

  if (!sale) {
    throw new Error("Sale creation did not return a result.");
  }

  const itemsToInsert = itemsData.map(item => ({
    ...item,
    sale_id: sale.id,
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsToInsert);

  if (itemsError) {
    // This is not transactional. A better solution would be an RPC function.
    throw new Error(`Failed to insert sale items: ${itemsError.message}`);
  }

  return sale;
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      // Also invalidate customers if a sale is associated with one, as it might affect their history
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
