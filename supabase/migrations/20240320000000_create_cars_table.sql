-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chassis_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, chassis_number)
);

-- Add RLS policies
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cars"
    ON cars FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cars"
    ON cars FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
    ON cars FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
    ON cars FOR DELETE
    USING (auth.uid() = user_id);

-- Modify documents table to include car_id
ALTER TABLE documents
ADD COLUMN car_id UUID REFERENCES cars(id) ON DELETE CASCADE;

-- Update RLS policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
CREATE POLICY "Users can insert their own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
CREATE POLICY "Users can delete their own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id); 