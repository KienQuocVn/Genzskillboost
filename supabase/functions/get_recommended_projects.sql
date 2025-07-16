CREATE OR REPLACE FUNCTION get_recommended_projects(
  user_id UUID,
  limit_count INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT[],
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
  WITH user_preferences AS (
    -- Get user's liked categories and tags
    SELECT 
      ARRAY_AGG(DISTINCT p.category) as liked_categories,
      ARRAY_AGG(DISTINCT tag) as liked_tags
    FROM project_likes pl
    JOIN projects p ON pl.project_id = p.id
    CROSS JOIN UNNEST(p.tags) as tag
    WHERE pl.user_id = get_recommended_projects.user_id
  ),
  project_scores AS (
    SELECT 
      p.*,
      -- Calculate similarity score based on categories and tags
      CASE 
        WHEN p.category = ANY(up.liked_categories) THEN 0.4
        ELSE 0.0
      END +
      CASE 
        WHEN p.tags && up.liked_tags THEN 0.3
        ELSE 0.0
      END +
      -- Popularity score
      (COALESCE(like_counts.count, 0) * 0.2 / GREATEST(COALESCE(like_counts.count, 1), 1)) +
      -- Recency score
      (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400 * -0.1 + 0.1) as score,
      
      -- Determine recommendation reason
      CASE 
        WHEN p.category = ANY(up.liked_categories) AND p.tags && up.liked_tags THEN 'Dựa trên sở thích và danh mục yêu thích'
        WHEN p.category = ANY(up.liked_categories) THEN 'Phù hợp với danh mục bạn quan tâm'
        WHEN p.tags && up.liked_tags THEN 'Có chủ đề tương tự dự án bạn đã thích'
        ELSE 'Xu hướng trong cộng đồng'
      END as reason
    FROM projects p
    CROSS JOIN user_preferences up
    LEFT JOIN (
      SELECT project_id, COUNT(*) as count
      FROM project_likes
      GROUP BY project_id
    ) like_counts ON p.id = like_counts.project_id
    WHERE p.user_id != get_recommended_projects.user_id
  )
  SELECT 
    ps.id,
    ps.title,
    ps.description,
    ps.image_url,
    ps.category,
    ps.tags,
    ps.created_at,
    ps.user_id,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url
    ) as user,
    jsonb_build_object(
      'likes', COALESCE(like_counts.count, 0),
      'comments', COALESCE(comment_counts.count, 0)
    ) as _count,
    ps.score as similarity_score,
    ps.reason as recommendation_reason
  FROM project_scores ps
  JOIN users u ON ps.user_id = u.id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM project_likes
    GROUP BY project_id
  ) like_counts ON ps.id = like_counts.project_id
  LEFT JOIN (
    SELECT project_id, COUNT(*) as count
    FROM project_comments
    GROUP BY project_id
  ) comment_counts ON ps.id = comment_counts.project_id
  ORDER BY ps.score DESC, ps.created_at DESC
  LIMIT limit_count;
END;
$$;
