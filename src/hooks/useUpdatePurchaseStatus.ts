import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdateStatusParams {
  purchaseId: string;
  status: string;
}

const updatePurchaseStatus = async ({ purchaseId, status }: UpdateStatusParams) => {
  const { data, error } = await supabase
    .from('purchases')
    .update({ status })
    .eq('id', purchaseId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const useUpdatePurchaseStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchaseStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
};
