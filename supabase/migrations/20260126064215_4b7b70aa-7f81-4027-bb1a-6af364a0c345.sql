-- 1) Add columns to goals table for personal/professional goals
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress';

-- 2) Add goal_id to tasks for linking tasks to personal goals
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- 3) Create goal_contributions table for financial goal contribution history
CREATE TABLE public.goal_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit', -- 'deposit' or 'withdraw'
  note TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);
CREATE INDEX idx_goal_contributions_user_id ON public.goal_contributions(user_id);
CREATE INDEX idx_tasks_goal_id ON public.tasks(goal_id);

-- Enable RLS on goal_contributions
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goal_contributions
CREATE POLICY "Users can view own goal_contributions"
ON public.goal_contributions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goal_contributions"
ON public.goal_contributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal_contributions"
ON public.goal_contributions FOR DELETE
USING (auth.uid() = user_id);