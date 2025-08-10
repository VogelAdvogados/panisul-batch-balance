import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, PurchaseWithSupplier } from '@/integrations/supabase/types';

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

  return useMutation<Tables<'purchases'>, Error, UpdateStatusParams, { previousPurchases: PurchaseWithSupplier[] | undefined }>({
    mutationFn: updatePurchaseStatus,
    onMutate: async ({ purchaseId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['purchases'] });
      const previousPurchases = queryClient.getQueryData<PurchaseWithSupplier[]>(['purchases']);

      queryClient.setQueryData<PurchaseWithSupplier[]>(['purchases'], old =>
        old?.map(p => (p.id === purchaseId ? { ...p, status } : p)) || []
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
