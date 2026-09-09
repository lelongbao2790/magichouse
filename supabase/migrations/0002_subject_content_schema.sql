-- =============================================================================
-- Migration: 0002_subject_content_schema.sql
-- Project:   magichouse (eoelyqphaixgqlkyoxau)
-- Initiative: subject-content-db
--
-- Adds subject/question content tables so quiz content lives in the database
-- instead of data/translations.ts, and widens the quiz_history.category CHECK.
-- IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS make this idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subjects (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key                   text        NOT NULL UNIQUE,
  title_vi              text        NOT NULL CHECK (length(btrim(title_vi)) > 0),
  title_en              text        NOT NULL CHECK (length(btrim(title_en)) > 0),
  grade                 text        NOT NULL CHECK (grade IN ('preschool', 'grade1', 'grade2')),
  target_language       text        NOT NULL CHECK (target_language IN ('vi', 'en')),
  content_mode          text        NOT NULL CHECK (content_mode IN ('fixed', 'localized')),
  questions_per_session integer     NOT NULL DEFAULT 10 CHECK (questions_per_session > 0),
  sort_order            integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subject_questions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id    uuid        NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  source_key    text,
  prompt_vi     text        CHECK (prompt_vi IS NULL OR length(btrim(prompt_vi)) > 0),
  prompt_en     text        CHECK (prompt_en IS NULL OR length(btrim(prompt_en)) > 0),
  options_vi    jsonb       CHECK (options_vi IS NULL OR jsonb_array_length(options_vi) = 3),
  options_en    jsonb       CHECK (options_en IS NULL OR jsonb_array_length(options_en) = 3),
  correct_index integer     NOT NULL CHECK (correct_index BETWEEN 0 AND 2),
  difficulty    text        NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active     boolean     NOT NULL DEFAULT true,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  -- NULL source_key rows (admin-created) never collide; seeded rows carry a stable key.
  CONSTRAINT subject_questions_source_key_uq UNIQUE (subject_id, source_key)
);

-- ---------------------------------------------------------------------------
-- Index — covering, for "active questions for a subject, in session order"
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subject_questions_subject_active
  ON subject_questions (subject_id, is_active, sort_order)
  INCLUDE (prompt_vi, prompt_en, options_vi, options_en, correct_index, difficulty);

-- ---------------------------------------------------------------------------
-- updated_at triggers (reuse update_updated_at_column() from 0001)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS subjects_updated_at ON subjects;
CREATE TRIGGER subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS subject_questions_updated_at ON subject_questions;
CREATE TRIGGER subject_questions_updated_at
  BEFORE UPDATE ON subject_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Trigger: enforce per-subject content_mode locale coverage
--   fixed(L)   -> prompt_L + options_L NOT NULL ; the other locale MUST be NULL
--   localized  -> all four of prompt_vi/en + options_vi/en NOT NULL
-- (A plain CHECK cannot reference the parent subjects row.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION subject_questions_mode_check()
RETURNS TRIGGER AS $$
DECLARE
  s_mode text;
  s_lang text;
BEGIN
  SELECT content_mode, target_language INTO s_mode, s_lang
    FROM subjects WHERE id = NEW.subject_id;

  IF s_mode IS NULL THEN
    RAISE EXCEPTION 'subject_questions: unknown subject_id %', NEW.subject_id;
  END IF;

  IF s_mode = 'fixed' THEN
    IF s_lang = 'vi' THEN
      IF NEW.prompt_vi IS NULL OR NEW.options_vi IS NULL THEN
        RAISE EXCEPTION 'fixed subject % requires prompt_vi and options_vi', NEW.subject_id;
      END IF;
      IF NEW.prompt_en IS NOT NULL OR NEW.options_en IS NOT NULL THEN
        RAISE EXCEPTION 'fixed vi subject % must not set prompt_en/options_en', NEW.subject_id;
      END IF;
    ELSE
      IF NEW.prompt_en IS NULL OR NEW.options_en IS NULL THEN
        RAISE EXCEPTION 'fixed subject % requires prompt_en and options_en', NEW.subject_id;
      END IF;
      IF NEW.prompt_vi IS NOT NULL OR NEW.options_vi IS NOT NULL THEN
        RAISE EXCEPTION 'fixed en subject % must not set prompt_vi/options_vi', NEW.subject_id;
      END IF;
    END IF;
  ELSE -- localized
    IF NEW.prompt_vi IS NULL OR NEW.prompt_en IS NULL
       OR NEW.options_vi IS NULL OR NEW.options_en IS NULL THEN
      RAISE EXCEPTION 'localized subject % requires vi and en prompt+options', NEW.subject_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subject_questions_mode_check_trg ON subject_questions;
CREATE TRIGGER subject_questions_mode_check_trg
  BEFORE INSERT OR UPDATE ON subject_questions
  FOR EACH ROW
  EXECUTE FUNCTION subject_questions_mode_check();

-- ---------------------------------------------------------------------------
-- Row-Level Security — authenticated read-only catalog (mirrors `stickers`)
-- ---------------------------------------------------------------------------
ALTER TABLE subjects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_select_authenticated" ON subjects;
CREATE POLICY "subjects_select_authenticated" ON subjects
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "subject_questions_select_authenticated" ON subject_questions;
CREATE POLICY "subject_questions_select_authenticated" ON subject_questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Widen quiz_history.category to include the Grade 2 language subjects.
-- Prior (0001) constraint allowed exactly:
--   'shapes','colors','animals','math','vietnamese','english',
--   'addition','subtraction','timesTable'
-- ---------------------------------------------------------------------------
ALTER TABLE quiz_history DROP CONSTRAINT IF EXISTS quiz_history_category_check;
ALTER TABLE quiz_history ADD CONSTRAINT quiz_history_category_check CHECK (
  category IN (
    'shapes', 'colors', 'animals', 'math', 'vietnamese', 'english',
    'addition', 'subtraction', 'timesTable',
    'grade2Vietnamese', 'grade2English'
  )
);
