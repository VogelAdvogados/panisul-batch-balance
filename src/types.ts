export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit?: number;
  current_stock?: number;
  min_stock?: number;
}

export interface ParsedItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ingredient_id?: string;
}
