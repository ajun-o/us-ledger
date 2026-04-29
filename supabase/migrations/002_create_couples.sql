-- Migration: 情侣绑定 + 邀请码 + 伴侣可见账单
-- 支持双人双账号共同管理账单

-- ====== couples 表 ======
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


-- ====== invite_codes 表 ======
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

-- 任何人可通过邀请码查询（用于注册时核验）
DROP POLICY IF EXISTS "invite_codes_select" ON invite_codes;
CREATE POLICY "invite_codes_select" ON invite_codes
  FOR SELECT USING (true);

-- 仅认证用户可创建
DROP POLICY IF EXISTS "invite_codes_insert" ON invite_codes;
CREATE POLICY "invite_codes_insert" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 创建者或使用者可更新
DROP POLICY IF EXISTS "invite_codes_update" ON invite_codes;
CREATE POLICY "invite_codes_update" ON invite_codes
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = used_by);


-- ====== is_couple_with 函数 ======
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


-- ====== 更新 bills RLS：允许伴侣看共同账单 ======
-- 先删除旧的 select_own 策略
DROP POLICY IF EXISTS "select_own" ON bills;

-- 新策略：自己的账单 + 伴侣的可见账单
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

-- update/delete 策略也需要兼容 user_id IS NULL 的旧账单
DROP POLICY IF EXISTS "update_own" ON bills;
CREATE POLICY "update_own" ON bills FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "delete_own" ON bills;
CREATE POLICY "delete_own" ON bills FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
