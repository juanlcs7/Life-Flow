-- Create history_events table to track user actions
CREATE TABLE public.history_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'finance' | 'task' | 'health'
  action TEXT NOT NULL, -- 'create' | 'update' | 'delete' | 'complete' | 'payment' | 'refund' | 'deposit' | 'withdraw'
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  category TEXT,
  account_name TEXT,
  reference_id UUID, -- ID of the related entity (transaction, task, habit, etc.)
  reference_type TEXT, -- 'transaction' | 'installment_payment' | 'financial_goal' | 'task' | 'habit'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.history_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own history_events" 
ON public.history_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own history_events" 
ON public.history_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history_events" 
ON public.history_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_history_events_user_created ON public.history_events(user_id, created_at DESC);
CREATE INDEX idx_history_events_type ON public.history_events(user_id, event_type);
CREATE INDEX idx_history_events_reference ON public.history_events(reference_id, reference_type);