-- Migration: fix_admin_notifications_access
-- Created at: 1755489377

-- Enable RLS on admin_notifications and create access policies
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated users to read admin notifications (for admin dashboard)
CREATE POLICY "Allow read access to admin notifications" ON admin_notifications
FOR SELECT USING (true);

-- Allow authenticated users to update notifications (mark as read)
CREATE POLICY "Allow update access to admin notifications" ON admin_notifications
FOR UPDATE USING (true);

-- Insert some sample admin notifications for testing
INSERT INTO admin_notifications (id, type, title, message, priority, is_read, created_at) 
VALUES 
  (gen_random_uuid(), 'system', 'System Update', 'System maintenance completed successfully', 'low', false, now()),
  (gen_random_uuid(), 'order', 'New Order Alert', 'High priority order requires immediate attention', 'high', false, now() - interval '1 hour'),
  (gen_random_uuid(), 'inventory', 'Low Stock Warning', 'Product inventory running low', 'medium', false, now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;;