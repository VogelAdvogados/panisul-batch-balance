CREATE TABLE public.accounts_receivable_logs (
  account_id UUID REFERENCES public.accounts_receivable(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_status TEXT,
  new_status TEXT,
  old_method TEXT,
  new_method TEXT,
  user_id UUID
);

ALTER TABLE public.accounts_receivable_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on accounts_receivable_logs" ON public.accounts_receivable_logs FOR ALL USING (true);
