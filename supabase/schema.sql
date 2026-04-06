-- ============================================================
-- POMODY OS — Schema Completo
-- Ejecutar en Supabase SQL Editor en ORDEN
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. PROFILES (si no existe — la crea Supabase Auth trigger)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  is_premium BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. CALENDARS (Multi-calendar, estilo Google Calendar)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Personal',
  color TEXT DEFAULT '#3b82f6',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own calendars" ON calendars
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger para crear calendario "Personal" automáticamente
CREATE OR REPLACE FUNCTION public.create_default_calendar()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.calendars (user_id, name, color, is_default)
  VALUES (NEW.id, 'Personal', '#3b82f6', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_user_create_calendar') THEN
    CREATE TRIGGER on_user_create_calendar
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.create_default_calendar();
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 3. EVENTS (Tabla Core — Event = Study Workspace)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'OTRO'
    CHECK (event_type IN ('EXAMEN', 'TAREA', 'REPASO', 'OTRO')),
  color TEXT,
  all_day BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own events" ON events
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Índices para queries de rango de fecha
CREATE INDEX idx_events_user_time ON events (user_id, start_time, end_time);
CREATE INDEX idx_events_calendar ON events (calendar_id);

-- ═══════════════════════════════════════════════════════════
-- 4. NOTES (Actualizar si ya existe, sino crear)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  color TEXT DEFAULT '#fef3c7',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agregar vinculación a eventos (Event = Workspace con notas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;
  END IF;
END;
$$;

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if needed, then create
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can CRUD own notes" ON notes;
END;
$$;

CREATE POLICY "Users can CRUD own notes" ON notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- ✅ VERIFICACIÓN
-- ═══════════════════════════════════════════════════════════
-- Ejecutá esto para verificar que todo se creó correctamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ═══════════════════════════════════════════════════════════
-- 5. TASKS (Tareas flexibles, pueden ir sin hora)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can CRUD own tasks" ON tasks;
END;
$$;

CREATE POLICY "Users can CRUD own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

