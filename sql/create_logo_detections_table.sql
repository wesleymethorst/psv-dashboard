-- Logo Detections Table
-- Stores all logo detections found in Instagram posts

CREATE TABLE IF NOT EXISTS logo_detections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Reference to the Instagram post
  post_id INT NOT NULL,
  
  -- Detection details
  logo_label VARCHAR(100) NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,
  
  -- Bounding box coordinates (in pixels)
  `box_x` DECIMAL(10, 2) NOT NULL,
  `box_y` DECIMAL(10, 2) NOT NULL,
  `box_width` DECIMAL(10, 2) NOT NULL,
  `box_height` DECIMAL(10, 2) NOT NULL,
  
  -- Model information
  model_version VARCHAR(50) DEFAULT 'best.onnx',
  confidence_threshold DECIMAL(3, 2) NOT NULL,
  
  -- Metadata
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified TINYINT(1) DEFAULT 0,
  verified_by VARCHAR(100) DEFAULT NULL,
  verified_at TIMESTAMP NULL DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  
  -- Indexes
  INDEX idx_post_id (post_id),
  INDEX idx_logo_label (logo_label),
  INDEX idx_confidence (confidence),
  INDEX idx_detected_at (detected_at),
  INDEX idx_verified (verified),
  
  -- Foreign key constraint
  CONSTRAINT fk_logo_detections_post_id 
    FOREIGN KEY (post_id) 
    REFERENCES instagram_posts(id) 
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Create a view for easy querying with post information
CREATE OR REPLACE VIEW logo_detections_with_posts AS
SELECT 
  ld.*,
  ip.shortcode,
  ip.url AS post_url,
  ip.owner_username,
  ip.taken_at,
  ip.caption
FROM 
  logo_detections ld
  INNER JOIN instagram_posts ip ON ld.post_id = ip.id
ORDER BY 
  ld.detected_at DESC;

-- Optional: Statistics view
CREATE OR REPLACE VIEW logo_detection_stats AS
SELECT 
  logo_label,
  COUNT(*) AS total_detections,
  AVG(confidence) AS avg_confidence,
  MIN(confidence) AS min_confidence,
  MAX(confidence) AS max_confidence,
  COUNT(DISTINCT post_id) AS posts_with_logo,
  SUM(verified) AS verified_count
FROM 
  logo_detections
GROUP BY 
  logo_label
ORDER BY 
  total_detections DESC;
