-- Add ai_context_comment field to evaluation_records table
ALTER TABLE evaluation_records 
ADD COLUMN ai_context_comment TEXT;