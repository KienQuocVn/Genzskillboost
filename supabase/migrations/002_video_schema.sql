-- Update videos table with additional fields for short video features
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS trending_score DECIMAL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Create video_views table for detailed analytics
CREATE TABLE IF NOT EXISTS video_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    watch_duration INTEGER DEFAULT 0, -- in seconds
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_shares table
CREATE TABLE IF NOT EXISTS video_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    platform VARCHAR(50), -- 'facebook', 'twitter', 'instagram', 'copy_link', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_reports table for content moderation
CREATE TABLE IF NOT EXISTS video_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hashtags table for better tag management
CREATE TABLE IF NOT EXISTS hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_hashtags junction table
CREATE TABLE IF NOT EXISTS video_hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(video_id, hashtag_id)
);

-- Create indexes for video features
CREATE INDEX IF NOT EXISTS idx_videos_trending ON videos(is_trending DESC, trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(is_featured DESC);
CREATE INDEX IF NOT EXISTS idx_videos_duration ON videos(duration);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_user_id ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON video_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_shares_video_id ON video_shares(video_id);
CREATE INDEX IF NOT EXISTS idx_video_shares_platform ON video_shares(platform);
CREATE INDEX IF NOT EXISTS idx_video_shares_created_at ON video_shares(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_reports_video_id ON video_reports(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reports_status ON video_reports(status);

CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(is_trending DESC, usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_video_hashtags_video_id ON video_hashtags(video_id);
CREATE INDEX IF NOT EXISTS idx_video_hashtags_hashtag_id ON video_hashtags(hashtag_id);

-- Create function to update trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(video_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    video_age_hours DECIMAL;
    likes_count INTEGER;
    views_count INTEGER;
    comments_count INTEGER;
    shares_count INTEGER;
    score DECIMAL;
BEGIN
    -- Get video data
    SELECT 
        EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600,
        v.likes_count,
        v.views_count,
        v.comments_count
    INTO video_age_hours, likes_count, views_count, comments_count
    FROM videos v
    WHERE v.id = video_id;
    
    -- Get shares count
    SELECT COUNT(*) INTO shares_count
    FROM video_shares
    WHERE video_shares.video_id = video_id;
    
    -- Calculate trending score (higher is better)
    -- Formula: (likes * 3 + comments * 5 + shares * 10 + views) / (age_hours + 1)
    score := (likes_count * 3 + comments_count * 5 + shares_count * 10 + views_count) / (video_age_hours + 1);
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Create function to update hashtag usage
CREATE OR REPLACE FUNCTION update_hashtag_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE hashtags 
        SET usage_count = usage_count + 1,
            updated_at = NOW()
        WHERE id = NEW.hashtag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE hashtags 
        SET usage_count = GREATEST(usage_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.hashtag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hashtag usage
CREATE TRIGGER update_hashtag_usage_trigger
    AFTER INSERT OR DELETE ON video_hashtags
    FOR EACH ROW EXECUTE FUNCTION update_hashtag_usage();

-- Create function to update video view count
CREATE OR REPLACE FUNCTION update_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE videos 
    SET views_count = views_count + 1,
        updated_at = NOW()
    WHERE id = NEW.video_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for video view count
CREATE TRIGGER update_video_view_count_trigger
    AFTER INSERT ON video_views
    FOR EACH ROW EXECUTE FUNCTION update_video_view_count();

-- Create function to update trending videos (run periodically)
CREATE OR REPLACE FUNCTION update_trending_videos()
RETURNS VOID AS $$
BEGIN
    -- Reset all trending flags
    UPDATE videos SET is_trending = FALSE;
    
    -- Update trending scores for recent videos (last 7 days)
    UPDATE videos 
    SET trending_score = calculate_trending_score(id)
    WHERE created_at > NOW() - INTERVAL '7 days';
    
    -- Mark top 50 videos as trending
    UPDATE videos 
    SET is_trending = TRUE
    WHERE id IN (
        SELECT id 
        FROM videos 
        WHERE created_at > NOW() - INTERVAL '7 days'
        ORDER BY trending_score DESC 
        LIMIT 50
    );
    
    -- Update trending hashtags
    UPDATE hashtags SET is_trending = FALSE;
    
    UPDATE hashtags 
    SET is_trending = TRUE
    WHERE id IN (
        SELECT h.id
        FROM hashtags h
        JOIN video_hashtags vh ON h.id = vh.hashtag_id
        JOIN videos v ON vh.video_id = v.id
        WHERE v.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY h.id
        ORDER BY COUNT(*) DESC
        LIMIT 20
    );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for new tables
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_hashtags ENABLE ROW LEVEL SECURITY;

-- Video views policies
CREATE POLICY "Video views are publicly readable" ON video_views
    FOR SELECT USING (true);

CREATE POLICY "Users can create video views" ON video_views
    FOR INSERT WITH CHECK (true);

-- Video shares policies
CREATE POLICY "Video shares are publicly readable" ON video_shares
    FOR SELECT USING (true);

CREATE POLICY "Users can create video shares" ON video_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Video reports policies
CREATE POLICY "Users can view own reports" ON video_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON video_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Hashtags policies
CREATE POLICY "Hashtags are publicly readable" ON hashtags
    FOR SELECT USING (true);

-- Video hashtags policies
CREATE POLICY "Video hashtags are publicly readable" ON video_hashtags
    FOR SELECT USING (true);

-- Insert some popular hashtags
INSERT INTO hashtags (name, usage_count, is_trending) VALUES
('dance', 0, true),
('funny', 0, true),
('trending', 0, true),
('viral', 0, true),
('comedy', 0, true),
('music', 0, true),
('challenge', 0, true),
('duet', 0, true),
('tutorial', 0, true),
('lifestyle', 0, true),
('food', 0, true),
('travel', 0, true),
('fashion', 0, true),
('beauty', 0, true),
('tech', 0, true),
('gaming', 0, true),
('art', 0, true),
('sports', 0, true),
('pets', 0, true),
('motivation', 0, true)
ON CONFLICT (name) DO NOTHING;
