
-- Create accounts/wallets table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking', -- checking, savings, wallet, credit_card
  balance NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'bg-primary',
  icon TEXT NOT NULL DEFAULT 'Wallet',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_goals table
CREATE TABLE public.financial_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  notes TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_frequency TEXT DEFAULT 'weekly', -- daily, weekly, monthly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installments table
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installment_count INTEGER NOT NULL,
  installment_amount NUMERIC NOT NULL,
  first_payment_date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'Outros',
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installment_payments table for tracking individual payments
CREATE TABLE public.installment_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  payment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- weekly, monthly, yearly
  category TEXT NOT NULL DEFAULT 'Assinaturas',
  next_billing_date DATE NOT NULL,
  reminder_days_before INTEGER NOT NULL DEFAULT 3,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add account_id to transactions table
ALTER TABLE public.transactions ADD COLUMN account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for financial_goals
CREATE POLICY "Users can view own financial_goals" ON public.financial_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own financial_goals" ON public.financial_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own financial_goals" ON public.financial_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own financial_goals" ON public.financial_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for installments
CREATE POLICY "Users can view own installments" ON public.installments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own installments" ON public.installments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own installments" ON public.installments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own installments" ON public.installments FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for installment_payments (based on parent installment ownership)
CREATE POLICY "Users can view own installment_payments" ON public.installment_payments FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.installments WHERE id = installment_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own installment_payments" ON public.installment_payments FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.installments WHERE id = installment_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own installment_payments" ON public.installment_payments FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.installments WHERE id = installment_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own installment_payments" ON public.installment_payments FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.installments WHERE id = installment_id AND user_id = auth.uid()));

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
