-- Create user_activities table for tracking user interactions
CREATE TABLE user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'comment', 'upload', 'follow', 'view')),
  content_id UUID,
  content_type VARCHAR(10) CHECK (content_type IN ('project', 'video')),
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_content ON user_activities(content_id, content_type);

-- Create follows table if not exists
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create likes table if not exists
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('project', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id, content_type)
);

-- Create comments table if not exists
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('project', 'video')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers to automatically log activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'likes' THEN
    INSERT INTO user_activities (user_id, type, content_id, content_type)
    VALUES (NEW.user_id, 'like', NEW.content_id, NEW.content_type);
  ELSIF TG_TABLE_NAME = 'comments' THEN
    INSERT INTO user_activities (user_id, type, content_id, content_type, metadata)
    VALUES (NEW.user_id, 'comment', NEW.content_id, NEW.content_type, 
            jsonb_build_object('comment_text', LEFT(NEW.text, 100)));
  ELSIF TG_TABLE_NAME = 'follows' THEN
    INSERT INTO user_activities (user_id, type, target_user_id)
    VALUES (NEW.follower_id, 'follow', NEW.following_id);
  ELSIF TG_TABLE_NAME = 'projects' THEN
    INSERT INTO user_activities (user_id, type, content_id, content_type)
    VALUES (NEW.user_id, 'upload', NEW.id, 'project');
  ELSIF TG_TABLE_NAME = 'videos' THEN
    INSERT INTO user_activities (user_id, type, content_id, content_type)
    VALUES (NEW.user_id, 'upload', NEW.id, 'video');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_log_like_activity
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_comment_activity
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_follow_activity
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_project_upload_activity
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_video_upload_activity
  AFTER INSERT ON videos
  FOR EACH ROW EXECUTE FUNCTION log_user_activity();
