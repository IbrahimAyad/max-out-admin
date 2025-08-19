-- Migration: create_check_user_exists_function
-- Created at: 1755562861

-- Create a function to check if a user exists in auth.users table
CREATE OR REPLACE FUNCTION check_user_exists(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id_param
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_user_exists(UUID) TO anon, authenticated, service_role;;