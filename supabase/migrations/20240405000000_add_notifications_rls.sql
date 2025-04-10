-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications table

-- Policy for staff to insert notifications
CREATE POLICY "Staff can insert notifications"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'staff'
  )
);

-- Policy for users to read their own notifications
CREATE POLICY "Users can read their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  recipient_email = (
    SELECT email FROM auth.users
    WHERE id = auth.uid()
  )
);

-- Policy for staff to read all notifications
CREATE POLICY "Staff can read all notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'staff'
  )
);

-- Policy for users to update their own notification read status
CREATE POLICY "Users can update their own notification read status"
ON notifications
FOR UPDATE
TO authenticated
USING (
  recipient_email = (
    SELECT email FROM auth.users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  recipient_email = (
    SELECT email FROM auth.users
    WHERE id = auth.uid()
  )
); 