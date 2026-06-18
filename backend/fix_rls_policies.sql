-- 快速修复: 为attractions和itineraries表添加完整CRUD策略
-- 在Supabase SQL Editor中执行此脚本

-- 为attractions表添加INSERT策略 (如果不存在)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert attractions' AND tablename = 'attractions') THEN
    CREATE POLICY "Anyone can insert attractions" ON attractions
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 同时添加更新和删除策略 (开发阶段)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update attractions' AND tablename = 'attractions') THEN
    CREATE POLICY "Anyone can update attractions" ON attractions
      FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete attractions' AND tablename = 'attractions') THEN
    CREATE POLICY "Anyone can delete attractions" ON attractions
      FOR DELETE USING (true);
  END IF;
END $$;

-- 为itineraries表也添加允许匿名的策略 (如果user_id为NULL)
DROP POLICY IF EXISTS "Users can insert own itineraries" ON itineraries;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert itineraries' AND tablename = 'itineraries') THEN
    CREATE POLICY "Anyone can insert itineraries" ON itineraries
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 完成!
