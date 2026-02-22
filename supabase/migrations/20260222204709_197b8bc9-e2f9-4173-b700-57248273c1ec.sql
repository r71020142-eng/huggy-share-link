
-- Create activity_logs table for tracking system events
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read logs
CREATE POLICY "Superadmins can read all logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Only superadmins can insert logs (or service role)
CREATE POLICY "Superadmins can insert logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Allow authenticated users to insert their own logs
CREATE POLICY "Users can insert own logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs (action);

-- Also allow superadmins to read user_roles and profiles for the users management page
CREATE POLICY "Superadmins can read all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can manage user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Superadmins can read all profiles
CREATE POLICY "Superadmins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));
