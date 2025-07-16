CREATE OR REPLACE FUNCTION get_recommended_videos(
  user_id UUID,
  limit_count INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user JSONB,
  _count JSONB,
  similarity_score DECIMAL,
  recommendation_reason TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_video_preferences AS (
    -- Get user's liked video categories and viewing history
    SELECT 
      ARRAY_AGG(DISTINCT v.category) as liked_categories,
      ARRAY_AGG(DISTINCT v.id) as watched_videos
    FROM video_likes vl
    JOIN videos v ON vl.video_id = v.id
    WHERE vl.user_id = get_recommended_videos.user_id
    
    UNION ALL
    
    SELECT 
      ARRAY_AGG(DISTINCT v.category) as liked_categories,
      ARRAY_AGG(DISTINCT v.id) as watched_videos
    FROM video_views vv
    JOIN videos v ON vv.video_id = v.id
    WHERE vv.user_id = get_recommended_videos.user_id
  ),
  video_scores AS (
    SELECT 
      v.*,
      -- Calculate similarity score
      CASE 
        WHEN v.category = ANY(uvp.liked_categories) THEN 0.5
        ELSE 0.0
      END +
      -- Popularity score (views and likes)
      (COALESCE(view_counts.count, 0) * 0.2 / GREATEST(COALESCE(view_counts.count, 1), 100)) +
      (COALESCE(like_counts.count, 0) * 0.2 / GREATEST(COALESCE(like_counts.count, 1), 10)) +
      -- Recency score
      (EXTRACT(EPOCH FROM (NOW() - v.created_at)) / 86400 * -0.1 + 0.1) as score,
      
      -- Determine recommendation reason
      CASE 
        WHEN v.category = ANY(uvp.liked_categories) THEN 'Dựa trên video bạn đã xem'
        WHEN COALESCE(view_counts.count, 0) > 1000 THEN 'Phổ biến trong nhóm tuổi của bạn'
        WHEN EXTRACT(EPOCH FROM (NOW() - v.created_at)) < 86400 THEN 'Xu hướng mới nhất'
        ELSE 'Tương tự nội dung bạn yêu thích'
      END as reason
    FROM videos v
    CROSS JOIN user_video_preferences uvp
    LEFT JOIN (
      SELECT video_id, COUNT(*) as count
      FROM video_views
      GROUP BY video_id
    ) view_counts ON v.id = view_counts.video_id
    LEFT JOIN (
      SELECT video_id, COUNT(*) as count
      FROM video_likes
      GROUP BY video_id
    ) like_counts ON v.id = like_counts.video_id
    WHERE v.user_id != get_recommended_videos.user_id
    AND v.id != ALL(uvp.watched_videos)
  )
  SELECT 
    vs.id,
    vs.title,
    vs.description,
    vs.video_url,
    vs.thumbnail_url,
    vs.duration,
    vs.category,
    vs.created_at,
    vs.user_id,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url
    ) as user,
    jsonb_build_object(
      'likes', COALESCE(like_counts.count, 0),
      'comments', COALESCE(comment_counts.count, 0),
      'views', COALESCE(view_counts.count, 0)
    ) as _count,
    vs.score as similarity_score,
    vs.reason as recommendation_reason
  FROM video_scores vs
  JOIN users u ON vs.user_id = u.id
  LEFT JOIN (
    SELECT video_id, COUNT(*) as count
    FROM video_likes
    GROUP BY video_id
  ) like_counts ON vs.id = like_counts.video_id
  LEFT JOIN (
    SELECT video_id, COUNT(*) as count
    FROM video_comments
    GROUP BY video_id
  ) comment_counts ON vs.id = comment_counts.video_id
  LEFT JOIN (
    SELECT video_id, COUNT(*) as count
    FROM video_views
    GROUP BY video_id
  ) view_counts ON vs.id = view_counts.video_id
  ORDER BY vs.score DESC, vs.created_at DESC
  LIMIT limit_count;
END;
$$;
