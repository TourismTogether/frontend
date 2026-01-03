-- Create share_location table for SOS feature
CREATE TABLE IF NOT EXISTS share_location (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 0,
    processed BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_share_location_user_id ON share_location(user_id);
CREATE INDEX IF NOT EXISTS idx_share_location_share_with_user_id ON share_location(share_with_user_id);
CREATE INDEX IF NOT EXISTS idx_share_location_processed ON share_location(processed);
CREATE INDEX IF NOT EXISTS idx_share_location_created_at ON share_location(created_at DESC);

-- Add comment to table
COMMENT ON TABLE share_location IS 'Stores SOS emergency location sharing between travellers and supporters';
COMMENT ON COLUMN share_location.user_id IS 'The user who activated SOS';
COMMENT ON COLUMN share_location.share_with_user_id IS 'The specific supporter user selected (null = broadcast to all)';
COMMENT ON COLUMN share_location.processed IS 'Whether the SOS request has been handled';

