
-- 1. Create app_role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('student', 'caregiver', 'partner_admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function for role checking (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS on user_roles: users can read their own roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'student',
  grade_level TEXT,
  school_name TEXT,
  zip_code TEXT,
  interests TEXT[] DEFAULT '{}',
  constraints_json JSONB DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  baseline_json JSONB DEFAULT '{}',
  goal_domain TEXT,
  pathway_id UUID REFERENCES public.pathways(id),
  outcome_statement TEXT,
  target_date TEXT,
  domain_baseline JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Partners can read all profiles (anonymized in app layer)
CREATE POLICY "Partners can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'partner_admin'));

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Tighten RLS on plans (user-specific)
DROP POLICY IF EXISTS "Anyone can read plans" ON public.plans;
DROP POLICY IF EXISTS "Anyone can insert plans" ON public.plans;
DROP POLICY IF EXISTS "Anyone can update plans" ON public.plans;
DROP POLICY IF EXISTS "Anyone can delete plans" ON public.plans;

CREATE POLICY "Users can read own plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Users can insert own plans"
  ON public.plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON public.plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON public.plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Tighten RLS on plan_weeks (via plan ownership)
DROP POLICY IF EXISTS "Anyone can read plan_weeks" ON public.plan_weeks;
DROP POLICY IF EXISTS "Anyone can insert plan_weeks" ON public.plan_weeks;
DROP POLICY IF EXISTS "Anyone can update plan_weeks" ON public.plan_weeks;
DROP POLICY IF EXISTS "Anyone can delete plan_weeks" ON public.plan_weeks;

CREATE POLICY "Users can read own plan_weeks"
  ON public.plan_weeks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_weeks.plan_id
        AND (plans.user_id = auth.uid() OR public.has_role(auth.uid(), 'partner_admin'))
    )
  );

CREATE POLICY "Users can insert own plan_weeks"
  ON public.plan_weeks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_weeks.plan_id AND plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own plan_weeks"
  ON public.plan_weeks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_weeks.plan_id AND plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own plan_weeks"
  ON public.plan_weeks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plans
      WHERE plans.id = plan_weeks.plan_id AND plans.user_id = auth.uid()
    )
  );

-- 7. Tighten RLS on user_pathways
DROP POLICY IF EXISTS "Anyone can insert user_pathways" ON public.user_pathways;
DROP POLICY IF EXISTS "Anyone can read user_pathways" ON public.user_pathways;
DROP POLICY IF EXISTS "Anyone can update user_pathways" ON public.user_pathways;

CREATE POLICY "Users can read own user_pathways"
  ON public.user_pathways FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Users can insert own user_pathways"
  ON public.user_pathways FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_pathways"
  ON public.user_pathways FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Tighten RLS on user_unlocked_opportunities
DROP POLICY IF EXISTS "Anyone can insert user_unlocked_opportunities" ON public.user_unlocked_opportunities;
DROP POLICY IF EXISTS "Anyone can read user_unlocked_opportunities" ON public.user_unlocked_opportunities;

CREATE POLICY "Users can read own unlocked_opportunities"
  ON public.user_unlocked_opportunities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'partner_admin'));

CREATE POLICY "Users can insert own unlocked_opportunities"
  ON public.user_unlocked_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 9. Allow service role to bypass for edge functions (plans insert from generate-plan)
-- The service role already bypasses RLS by default, so no additional policy needed.

-- 10. Keep catalog tables public-read (pathways, opportunities, pathway_opportunities, resources)
-- These already have public SELECT and that's correct for catalog data.
