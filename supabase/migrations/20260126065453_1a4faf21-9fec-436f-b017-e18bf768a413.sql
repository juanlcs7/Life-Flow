-- Create table for dashboard preferences
CREATE TABLE public.dashboard_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_order JSONB DEFAULT '["finances", "tasks", "goals", "health", "agenda", "history"]'::jsonb,
  visible_cards JSONB DEFAULT '["finances", "tasks", "goals", "health", "agenda", "history"]'::jsonb,
  card_sizes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own dashboard preferences"
ON public.dashboard_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard preferences"
ON public.dashboard_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard preferences"
ON public.dashboard_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard preferences"
ON public.dashboard_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dashboard_preferences_updated_at
BEFORE UPDATE ON public.dashboard_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();