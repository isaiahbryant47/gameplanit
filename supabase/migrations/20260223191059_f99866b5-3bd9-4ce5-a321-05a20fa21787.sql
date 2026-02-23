
-- Create student_evidence table
CREATE TABLE public.student_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pillar_id UUID REFERENCES public.career_pillars(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_path TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'document',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own evidence"
  ON public.student_evidence FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evidence"
  ON public.student_evidence FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence"
  ON public.student_evidence FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can read all evidence"
  ON public.student_evidence FOR SELECT
  USING (public.has_role(auth.uid(), 'partner_admin'));

-- Create storage bucket for student artifacts (private, user-scoped)
INSERT INTO storage.buckets (id, name, public) VALUES ('student-artifacts', 'student-artifacts', false);

-- Storage RLS: users can upload to their own folder
CREATE POLICY "Users can upload own artifacts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own artifacts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own artifacts"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'student-artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);
