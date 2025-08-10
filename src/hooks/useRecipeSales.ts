import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

const fetchRecipeSales = async (recipeId: string): Promise<number> => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data, error } = await supabase
    .from('sale_items')
    .select('quantity, sales!inner(sale_date)')
    .eq('recipe_id', recipeId)
    .gte('sales.sale_date', thirtyDaysAgo.toISOString())

  if (error) {
    throw new Error(error.message)
  }

  return data?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}

export const useRecipeSales = (recipeId?: string) => {
  return useQuery<number, Error>({
    queryKey: ['recipeSales', recipeId],
    queryFn: () => fetchRecipeSales(recipeId!),
    enabled: !!recipeId,
  })
}

