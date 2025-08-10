import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinancialReportData } from '@/integrations/supabase/types';

export interface FinancialReportParams {
  startDate: string;
  endDate: string;
}

const fetchFinancialReport = async ({ startDate, endDate }: FinancialReportParams): Promise<FinancialReportData> => {
  const { data, error } = await (supabase.rpc as any)(
    'get_financial_report',
    {
      p_start_date: startDate,
      p_end_date: endDate,
    },
  );

  if (error) {
    throw new Error(`Error fetching financial report: ${error.message}`);
  }

  // The RPC function returns a single JSON object with two arrays
  return data as FinancialReportData;
};

export const useFinancialReport = () => {
  return useMutation<FinancialReportData, Error, FinancialReportParams>({
    mutationFn: fetchFinancialReport,
  });
};
