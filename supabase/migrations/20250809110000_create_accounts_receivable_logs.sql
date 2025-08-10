CREATE TABLE public.accounts_receivable_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_due_date DATE,
  new_due_date DATE,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id)
);

ALTER TABLE public.accounts_receivable_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo em accounts_receivable_logs" ON public.accounts_receivable_logs FOR ALL USING (true);
