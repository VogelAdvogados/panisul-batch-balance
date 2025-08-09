import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/integrations/supabase/types';

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) {
    throw new Error(`Error fetching dashboard stats: ${error.message}`);
  }

  // The data from rpc is returned as a single JSON object.
  // We assume the structure matches our DashboardStats type.
  return data;
};

export const useDashboardStats = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });
};
