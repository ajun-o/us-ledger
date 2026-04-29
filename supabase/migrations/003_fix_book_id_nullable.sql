-- Migration: 修复 book_id NOT NULL 约束导致账单写入失败
-- book_id 列是手动在 Dashboard 添加的，暂不使用，允许 NULL

ALTER TABLE bills ALTER COLUMN book_id DROP NOT NULL;
