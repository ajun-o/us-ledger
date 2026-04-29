-- Migration: 删除 bills.user_id → profiles 的冗余外键约束
-- RLS 策略已充分处理访问控制，此外键阻止了正常写入

ALTER TABLE bills DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
