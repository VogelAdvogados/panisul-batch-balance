import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AccountsReceivableLog {
  account_id: string;
  changed_at: string;
  old_status: string | null;
  new_status: string | null;
  old_method: string | null;
  new_method: string | null;
  user_id: string | null;
}

const fetchLogs = async (accountId: string): Promise<AccountsReceivableLog[]> => {
  const { data, error } = await supabase
    .from('accounts_receivable_logs')
    .select('*')
    .eq('account_id', accountId)
    .order('changed_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAccountsReceivableLogs = (accountId?: string) => {
  return useQuery<AccountsReceivableLog[], Error>({
    queryKey: ['accountsReceivableLogs', accountId],
    queryFn: () => fetchLogs(accountId!),
    enabled: !!accountId,
  });
};
