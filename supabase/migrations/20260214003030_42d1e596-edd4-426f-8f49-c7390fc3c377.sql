
-- Add stage column to plans table
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'foundation';

-- Add current_cycle_number to user_pathways
ALTER TABLE public.user_pathways 
ADD COLUMN IF NOT EXISTS current_cycle_number integer NOT NULL DEFAULT 1;
