ALTER TABLE public.trades ALTER COLUMN stop_loss DROP NOT NULL;
ALTER TABLE public.trades ADD COLUMN source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.trades ADD COLUMN external_id text;
ALTER TABLE public.trades ADD COLUMN quantity numeric;
ALTER TABLE public.trades ADD COLUMN pnl numeric;
ALTER TABLE public.trades ADD COLUMN closed_at timestamptz;
CREATE UNIQUE INDEX trades_user_external ON public.trades(user_id, external_id) WHERE external_id IS NOT NULL;
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  watchlist jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings select" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own settings insert" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own settings update" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);