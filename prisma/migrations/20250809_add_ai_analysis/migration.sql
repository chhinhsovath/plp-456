-- Create table to store AI analysis results
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  inspection_session_id TEXT NOT NULL REFERENCES inspection_sessions(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, suggestions, recommendations, etc.
  overall_score INTEGER,
  performance_level VARCHAR(50),
  strengths JSONB,
  areas_for_improvement JSONB,
  recommendations JSONB,
  detailed_feedback TEXT,
  language VARCHAR(10) DEFAULT 'km',
  metadata JSONB, -- Store any additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Create index for faster lookups
CREATE INDEX idx_ai_analysis_session_id ON ai_analysis_results(inspection_session_id);
CREATE INDEX idx_ai_analysis_type ON ai_analysis_results(analysis_type);
CREATE INDEX idx_ai_analysis_created_at ON ai_analysis_results(created_at DESC);

-- Add unique constraint to prevent duplicate analysis for same session and type
CREATE UNIQUE INDEX idx_ai_analysis_unique ON ai_analysis_results(inspection_session_id, analysis_type);

-- Add comment
COMMENT ON TABLE ai_analysis_results IS 'Stores AI-generated analysis results for observations to avoid regenerating';