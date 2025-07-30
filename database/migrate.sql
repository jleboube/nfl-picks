-- Migration script to add groups functionality to existing database

-- Create groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL CHECK (length(name) >= 3),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    max_members INTEGER CHECK (max_members >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL CHECK (length(code) >= 6),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add group_id column to users table if it doesn't exist
DO $$
DECLARE
    default_group_id UUID;
BEGIN
    -- Check if group_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'group_id'
    ) THEN
        -- Create a default group first
        INSERT INTO groups (name, description, max_members) 
        VALUES ('Default Group', 'Default group for existing users', 100)
        RETURNING id INTO default_group_id;
        
        -- Add the group_id column to users table
        ALTER TABLE users ADD COLUMN group_id UUID;
        
        -- Update all existing users to belong to the default group
        UPDATE users SET group_id = default_group_id;
        
        -- Now make it NOT NULL and add foreign key constraint
        ALTER TABLE users ALTER COLUMN group_id SET NOT NULL;
        ALTER TABLE users ADD CONSTRAINT fk_users_group 
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE RESTRICT;
        
        -- Create the test group code
        INSERT INTO group_codes (code, group_id) VALUES ('TEST2025', default_group_id);
        
        RAISE NOTICE 'Successfully added groups functionality and migrated existing users';
    ELSE
        RAISE NOTICE 'Groups functionality already exists';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);
CREATE INDEX IF NOT EXISTS idx_group_codes_code ON group_codes(code);
CREATE INDEX IF NOT EXISTS idx_group_codes_group ON group_codes(group_id);
CREATE INDEX IF NOT EXISTS idx_group_codes_active ON group_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);

-- Add triggers for groups and group_codes
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_codes_updated_at BEFORE UPDATE ON group_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();