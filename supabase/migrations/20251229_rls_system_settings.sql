-- Migration: Enable RLS for system_settings
-- Sprint 7: Security Hardening

-- 1. Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any (to be idempotent)
DROP POLICY IF EXISTS "Public can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can delete system settings" ON public.system_settings;

-- 3. Create Policy: Public can read (needed for app config and web forms)
CREATE POLICY "Public can read system settings"
  ON public.system_settings
  FOR SELECT
  TO public
  USING (true);

-- 4. Create Policy: Only admins can update
CREATE POLICY "Admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Create Policy: Only admins can insert/delete (though it's a singleton)
CREATE POLICY "Admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete system settings"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. Add comment explaining the security model
COMMENT ON TABLE public.system_settings IS 'Global system configuration. Publicly readable, admin-only updates.';
