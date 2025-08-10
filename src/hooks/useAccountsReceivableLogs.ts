import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

const fetchLogs = async (accountId: string): Promise<Tables<'accounts_receivable_logs'>[]> => {
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

export const useAccountsReceivableLogs = (accountId: string) => {
  return useQuery({
    queryKey: ['accountsReceivableLogs', accountId],
    queryFn: () => fetchLogs(accountId),
    enabled: !!accountId,
  });
};
