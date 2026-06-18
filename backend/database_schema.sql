-- Supabase数据库表结构
-- 在Supabase Dashboard -> SQL Editor中执行此脚本

-- 1. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  preferences JSONB DEFAULT '{"interests": [], "budgetRange": null, "travelPace": null}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引 (如果不存在)
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);

-- 2. 景点表 (attractions)
CREATE TABLE IF NOT EXISTS attractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  longitude DECIMAL(12, 8),
  latitude DECIMAL(12, 8),
  category TEXT,
  subcategories TEXT[],
  description TEXT,
  images TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  popularity INTEGER DEFAULT 0,
  opening_hours JSONB DEFAULT '{"weekday": "", "weekend": "", "specialNotes": ""}',
  ticket_price JSONB DEFAULT '{"adult": 0, "child": 0, "currency": "CNY"}',
  suggested_duration INTEGER DEFAULT 120, -- 分钟
  tags TEXT[],
  source TEXT DEFAULT 'manual',
  source_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引 (如果不存在)
CREATE INDEX IF NOT EXISTS idx_attractions_city ON attractions(city);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);
CREATE INDEX IF NOT EXISTS idx_attractions_city_category ON attractions(city, category);
CREATE INDEX IF NOT EXISTS idx_attractions_popularity ON attractions(city, popularity DESC);

-- 3. 行程表 (itineraries)
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destination_city TEXT NOT NULL,
  destination_province TEXT,
  destination_country TEXT DEFAULT '中国',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL CHECK (days >= 1 AND days <= 30),
  budget JSONB DEFAULT '{"total": 0, "perDay": 0, "currency": "CNY"}',
  interests TEXT[],
  daily_plans JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'completed', 'cancelled')),
  is_public BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引 (如果不存在)
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_created ON itineraries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries(destination_city, is_public);

-- 4. 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 为所有表添加更新时间触发器 (如果不存在)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_attractions_updated_at') THEN
    CREATE TRIGGER update_attractions_updated_at BEFORE UPDATE ON attractions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_itineraries_updated_at') THEN
    CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 6. 启用行级安全策略 (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- 7. 创建RLS策略 (如果不存在)

-- users表: 用户可以查看和修改自己的数据
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth.uid()::text = openid);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON users
      FOR UPDATE USING (auth.uid()::text = openid);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON users
      FOR INSERT WITH CHECK (auth.uid()::text = openid);
  END IF;
END $$;

-- attractions表: 所有人可以查看和插入(开发阶段)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view attractions') THEN
    CREATE POLICY "Anyone can view attractions" ON attractions
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert attractions') THEN
    CREATE POLICY "Anyone can insert attractions" ON attractions
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- itineraries表: 用户可以查看自己的行程,公开行程所有人可见
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own itineraries') THEN
    CREATE POLICY "Users can view own itineraries" ON itineraries
      FOR SELECT USING (
        auth.uid()::text = user_id::text OR is_public = true
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own itineraries') THEN
    CREATE POLICY "Users can insert own itineraries" ON itineraries
      FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own itineraries') THEN
    CREATE POLICY "Users can update own itineraries" ON itineraries
      FOR UPDATE USING (auth.uid()::text = user_id::text);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own itineraries') THEN
    CREATE POLICY "Users can delete own itineraries" ON itineraries
      FOR DELETE USING (auth.uid()::text = user_id::text);
  END IF;
END $$;

-- 8. 插入一些示例数据 (可选)
INSERT INTO attractions (name, city, longitude, latitude, category, description, rating, popularity) VALUES
('故宫博物院', '北京', 116.397, 39.918, '文化', '明清两代的皇家宫殿,世界上现存规模最大的宫殿型建筑群', 4.9, 9800),
('长城', '北京', 116.015, 40.388, '历史', '中国古代伟大的军事防御工程,世界文化遗产', 4.8, 9500),
('天安门广场', '北京', 116.397, 39.904, '历史', '世界上最大的城市广场,中国标志性建筑之一', 4.7, 9200),
('颐和园', '北京', 116.275, 39.999, '文化', '中国现存规模最大、保存最完整的皇家园林', 4.8, 8800),
('天坛公园', '北京', 116.407, 39.882, '文化', '明清两代皇帝祭天祈谷的场所', 4.7, 7500);

-- 完成!
COMMENT ON TABLE users IS '用户信息表';
COMMENT ON TABLE attractions IS '景点信息表';
COMMENT ON TABLE itineraries IS '行程规划表';
