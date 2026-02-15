
-- 1. Harden handle_new_user with NULL validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

-- 2. Fix WITH CHECK (true) on prediction_snapshots INSERT
-- These tables use hashed user IDs, but we can still verify the user is authenticated
DROP POLICY IF EXISTS "Authenticated can insert predictions" ON public.prediction_snapshots;
CREATE POLICY "Authenticated can insert predictions"
ON public.prediction_snapshots FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix WITH CHECK (true) on weekly_checkins INSERT
DROP POLICY IF EXISTS "Authenticated can insert checkins" ON public.weekly_checkins;
CREATE POLICY "Authenticated can insert checkins"
ON public.weekly_checkins FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
