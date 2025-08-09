import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinancialAccountWithBalance } from '@/integrations/supabase/types';

const fetchFinancialAccounts = async (): Promise<FinancialAccountWithBalance[]> => {
  const { data, error } = await supabase.rpc('get_financial_accounts_with_balances');

  if (error) {
    throw new Error(`Error fetching financial accounts: ${error.message}`);
  }

  return data;
};

export const useFinancialAccounts = () => {
  return useQuery<FinancialAccountWithBalance[], Error>({
    queryKey: ['financialAccounts'],
    queryFn: fetchFinancialAccounts,
  });
};
