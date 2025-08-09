import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AccountPayableWithSupplier } from '@/integrations/supabase/types';

export type PayableStatusFilter = 'all' | 'pending' | 'overdue' | 'paid';

const fetchAccountsPayable = async (statusFilter: PayableStatusFilter): Promise<AccountPayableWithSupplier[]> => {
  let query = supabase
    .from('accounts_payable')
    .select(`
      *,
      suppliers ( name )
    `)
    .order('due_date', { ascending: true });

  if (statusFilter === 'paid') {
    query = query.eq('status', 'paid');
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

export const useAccountsPayable = (statusFilter: PayableStatusFilter) => {
  return useQuery<AccountPayableWithSupplier[], Error>({
    queryKey: ['accountsPayable', statusFilter],
    queryFn: () => fetchAccountsPayable(statusFilter),
  });
};
