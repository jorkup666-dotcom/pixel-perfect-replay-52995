CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  trade_date date NOT NULL,
  instrument text NOT NULL,
  session text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('long','short')),
  entry numeric NOT NULL,
  stop_loss numeric NOT NULL,
  take_profit numeric,
  exit_price numeric,
  result_r numeric NOT NULL,
  setup_type text NOT NULL,
  timeframe text NOT NULL,
  screenshot_path text,
  notes text,
  ict_concepts text[] NOT NULL DEFAULT '{}',
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.trades FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX trades_user_date ON public.trades(user_id, trade_date DESC);
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trades_touch BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();