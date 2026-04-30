-- ====== 合并迁移：伴侣数据互通 ======
-- 涵盖 001-004 的核心内容，幂等可重复执行
-- 复制整段到 Supabase SQL Editor 执行

-- 1. 补充 bills 表缺失列（001）
ALTER TABLE bills ADD COLUMN IF NOT EXISTS category_icon TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS category_name TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS member TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS account TEXT;
ALTER TABLE bills ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. 修复 book_id 约束（003）
ALTER TABLE bills ALTER COLUMN book_id DROP NOT NULL;

-- 3. 删除冗余外键（004）
ALTER TABLE bills DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

-- 4. 情侣表（002）
CREATE TABLE IF NOT EXISTS couples (
  id BIGSERIAL PRIMARY KEY,
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);
CREATE INDEX IF NOT EXISTS idx_couples_user_a ON couples(user_a);
CREATE INDEX IF NOT EXISTS idx_couples_user_b ON couples(user_b);
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couples_select_own" ON couples;
CREATE POLICY "couples_select_own" ON couples
  FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "couples_insert_own" ON couples;
CREATE POLICY "couples_insert_own" ON couples
  FOR INSERT WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "couples_delete_own" ON couples;
CREATE POLICY "couples_delete_own" ON couples
  FOR DELETE USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 5. 邀请码表（002）
CREATE TABLE IF NOT EXISTS invite_codes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invite_codes_select" ON invite_codes;
CREATE POLICY "invite_codes_select" ON invite_codes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "invite_codes_insert" ON invite_codes;
CREATE POLICY "invite_codes_insert" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "invite_codes_update" ON invite_codes;
CREATE POLICY "invite_codes_update" ON invite_codes
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = used_by);

-- 6. 伴侣判定函数（002）
CREATE OR REPLACE FUNCTION is_couple_with(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM couples
    WHERE (user_a = auth.uid() AND user_b = target_user_id)
       OR (user_b = auth.uid() AND user_a = target_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ★ 7. 关键：替换 bills RLS 策略，允许伴侣互看账单（002）
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own" ON bills;
DROP POLICY IF EXISTS "select_bills" ON bills;
CREATE POLICY "select_bills" ON bills FOR SELECT USING (
  auth.uid() = user_id
  OR user_id IS NULL
  OR (
    user_id IN (
      SELECT CASE WHEN user_a = auth.uid() THEN user_b ELSE user_a END
      FROM couples
      WHERE user_a = auth.uid() OR user_b = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "insert_own" ON bills;
CREATE POLICY "insert_own" ON bills FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own" ON bills;
CREATE POLICY "update_own" ON bills FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "delete_own" ON bills;
CREATE POLICY "delete_own" ON bills FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
