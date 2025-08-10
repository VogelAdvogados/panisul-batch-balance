import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PayBillParams {
  payable_id: string;
  account_id: string;
}

const payBill = async ({ payable_id, account_id }: PayBillParams) => {
  const { error } = await (supabase.rpc as any)('pay_bill', {
    p_payable_id: payable_id,
    p_account_id: account_id,
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const usePayBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payBill,
    onSuccess: () => {
      // Refetch both accounts payable and the financial account balances
      queryClient.invalidateQueries({ queryKey: ['accountsPayable'] });
      queryClient.invalidateQueries({ queryKey: ['financialAccounts'] });
    },
  });
};
