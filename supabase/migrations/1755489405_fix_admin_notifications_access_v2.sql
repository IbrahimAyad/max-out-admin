-- Migration: fix_admin_notifications_access_v2
-- Created at: 1755489405

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
  (gen_random_uuid(), 'new_order', 'New High Priority Order', 'Wedding party order requires immediate attention', 'high', false, now()),
  (gen_random_uuid(), 'low_stock', 'Low Stock Warning', 'Formal wear inventory running low', 'normal', false, now() - interval '1 hour'),
  (gen_random_uuid(), 'payment_received', 'Payment Confirmation', 'Large wedding party payment received', 'low', false, now() - interval '2 hours')
ON CONFLICT (id) DO NOTHING;;