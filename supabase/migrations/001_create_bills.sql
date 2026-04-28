-- Migration: bills 表适配
-- 远程数据库已存在 bills 表，此迁移仅补充缺失列和 RLS 策略

-- 补充缺失列（如已存在则跳过）
ALTER TABLE bills ADD COLUMN IF NOT EXISTS category_icon TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS member TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS account TEXT;

-- 确保 user_id 有默认值
ALTER TABLE bills ALTER COLUMN user_id SET DEFAULT auth.uid();

-- RLS 策略（基于 user_id）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'select_own' AND tablename = 'bills') THEN
    CREATE POLICY "select_own" ON bills FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_own' AND tablename = 'bills') THEN
    CREATE POLICY "insert_own" ON bills FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update_own' AND tablename = 'bills') THEN
    CREATE POLICY "update_own" ON bills FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_own' AND tablename = 'bills') THEN
    CREATE POLICY "delete_own" ON bills FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
