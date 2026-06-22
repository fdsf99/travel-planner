-- ============================================================
-- 终极修复脚本: 解决行程保存失败 / UUID语法错误 / RLS阻止写入
-- 在 Supabase Dashboard -> SQL Editor -> New query 中完整粘贴并执行
-- 此脚本可重复执行,不会报错
-- ============================================================

-- ====================
-- 步骤1: 确保扩展可用
-- ====================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====================
-- 步骤2: itineraries 表 - 彻底放开匿名读写
-- (Web端无登录态,user_id 为 null,RLS 默认会阻止匿名插入)
-- ====================

DROP POLICY IF EXISTS "Users can view own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can insert own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can update own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Users can delete own itineraries" ON itineraries;
DROP POLICY IF EXISTS "Allow anon select itineraries" ON itineraries;
DROP POLICY IF EXISTS "Allow anon insert itineraries" ON itineraries;
DROP POLICY IF EXISTS "Anyone can view itineraries" ON itineraries;
DROP POLICY IF EXISTS "Anyone can insert itineraries" ON itineraries;
DROP POLICY IF EXISTS "Anyone can update itineraries" ON itineraries;
DROP POLICY IF EXISTS "Anyone can delete itineraries" ON itineraries;

CREATE POLICY "Anyone can view itineraries" ON itineraries
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert itineraries" ON itineraries
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update itineraries" ON itineraries
  FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete itineraries" ON itineraries
  FOR DELETE USING (true);

-- ====================
-- 步骤3: attractions 表 - 彻底放开匿名读写
-- ====================

DROP POLICY IF EXISTS "Anyone can view attractions" ON attractions;
DROP POLICY IF EXISTS "Anyone can insert attractions" ON attractions;
DROP POLICY IF EXISTS "Anyone can update attractions" ON attractions;
DROP POLICY IF EXISTS "Anyone can delete attractions" ON attractions;

CREATE POLICY "Anyone can view attractions" ON attractions
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attractions" ON attractions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attractions" ON attractions
  FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete attractions" ON attractions
  FOR DELETE USING (true);

-- ====================
-- 步骤4: users 表 - 放开(可选,用于连通性测试)
-- ====================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;

CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- ====================
-- 步骤5: 确保 RLS 已启用(保留 RLS 但策略全开放)
-- ====================

ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ====================
-- 步骤6: 验证 - 插入测试行程并立即删除
-- ====================

DO $$
DECLARE
  test_id UUID;
BEGIN
  INSERT INTO itineraries (
    destination_city, start_date, end_date, days,
    budget, interests, daily_plans, status
  ) VALUES (
    '测试城市', CURRENT_DATE, CURRENT_DATE + INTERVAL '2 days', 3,
    '{"total": 5000, "perDay": 1667}'::jsonb,
    ARRAY['文化']::text[],
    '[]'::jsonb,
    'draft'
  ) RETURNING id INTO test_id;

  RAISE NOTICE '测试插入成功, ID: %', test_id;

  DELETE FROM itineraries WHERE id = test_id;
  RAISE NOTICE '测试删除成功';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '测试失败: %', SQLERRM;
END $$;

-- ====================
-- 步骤7: 显示当前所有策略(确认配置正确)
-- ====================

SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
