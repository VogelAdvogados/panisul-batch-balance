-- Criar tabela de clientes
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vendas
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'concluida',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de itens de venda
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id),
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir acesso total (sistema interno)
CREATE POLICY "Permitir tudo em customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Permitir tudo em sales" ON public.sales FOR ALL USING (true);
CREATE POLICY "Permitir tudo em sale_items" ON public.sale_items FOR ALL USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar estoque quando há venda
CREATE OR REPLACE FUNCTION public.update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Para cada item vendido, diminuir o estoque baseado na receita
  INSERT INTO public.stock_movements (ingredient_id, movement_type, quantity, reason)
  SELECT 
    ri.ingredient_id,
    'saida',
    -(ri.quantity * NEW.quantity),
    'Venda: ' || r.name
  FROM public.recipe_ingredients ri
  JOIN public.recipes r ON r.id = ri.recipe_id
  WHERE ri.recipe_id = NEW.recipe_id;
  
  -- Atualizar o estoque atual dos ingredientes
  UPDATE public.ingredients 
  SET current_stock = current_stock + sm.total_movement
  FROM (
    SELECT 
      ingredient_id,
      SUM(quantity) as total_movement
    FROM public.stock_movements 
    WHERE reason LIKE 'Venda: %' AND created_at >= NEW.created_at
    GROUP BY ingredient_id
  ) sm
  WHERE ingredients.id = sm.ingredient_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque em vendas
CREATE TRIGGER update_stock_on_sale_trigger
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_sale();