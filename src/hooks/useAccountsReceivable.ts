import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AccountReceivableWithCustomer } from '@/integrations/supabase/types';

export type ReceivableStatusFilter = 'all' | 'pending' | 'overdue' | 'received';

const fetchAccountsReceivable = async (statusFilter: ReceivableStatusFilter): Promise<AccountReceivableWithCustomer[]> => {
  let query = supabase
    .from('accounts_receivable')
    .select(`
      *,
      customers ( name )
    `)
    .order('due_date', { ascending: true });

  if (statusFilter === 'received') {
    query = query.eq('status', 'received');
  } else if (statusFilter === 'pending') {
    query = query.eq('status', 'pending');
  } else if (statusFilter === 'overdue') {
    query = query.eq('status', 'pending').lt('due_date', new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAccountsReceivable = (statusFilter: ReceivableStatusFilter) => {
  return useQuery<AccountReceivableWithCustomer[], Error>({
    queryKey: ['accountsReceivable', statusFilter],
    queryFn: () => fetchAccountsReceivable(statusFilter),
  });
};
