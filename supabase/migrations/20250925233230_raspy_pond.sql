-- Create function to delete user account and all associated data
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete user data in correct order (respecting foreign keys)
  DELETE FROM client_notes WHERE user_id = auth.uid();
  DELETE FROM notifications WHERE user_id = auth.uid();
  DELETE FROM clients WHERE user_id = auth.uid();
  DELETE FROM stripe_subscriptions WHERE customer_id IN (
    SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid()
  );
  DELETE FROM stripe_customers WHERE user_id = auth.uid();
  DELETE FROM profiles WHERE id = auth.uid();
  
  -- Delete from auth.users (this will cascade to other auth tables)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;