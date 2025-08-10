import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types';

type NewStockMovement = TablesInsert<'stock_movements'>;

const createStockMovement = async (movement: NewStockMovement) => {
  const { error } = await supabase.from('stock_movements').insert(movement);

  if (error) {
    throw new Error(error.message);
  }
};

export const useStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockMovement,
    onSuccess: () => {
      // When a stock movement is made, the ingredients list should be refetched
      // to show the updated stock levels.
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
};
