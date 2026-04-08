-- Categorías personalizadas + vínculo opcional en eventos
CREATE TABLE IF NOT EXISTS custom_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own custom_categories"
  ON custom_categories FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_categories_user ON custom_categories (user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.events
      ADD COLUMN category_id UUID REFERENCES custom_categories(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_events_category ON public.events (category_id);
